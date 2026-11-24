---
title: "errSecInternalComponent After a Reboot: macOS Now Unlocks Keychains Per Session"
date: "2026-11-24"
excerpt: "Our self-hosted macOS CI runner stopped signing apps after a routine reboot. Keychains showed as unlocked, identities showed as valid, and codesign still refused to run. The unlock model changed: keychains unlock per securityd session, and your runner lives in a session you never unlocked."
tags: ["macOS", "CI/CD", "GitHub Actions", "codesigning", "self-hosted runners"]
---

# errSecInternalComponent After a Reboot: macOS Now Unlocks Keychains Per Session

Our self-hosted macOS CI runner stopped signing builds after a reboot. Every fix we knew was already in place. We lost a day to this. The failure looked like a corrupted keychain, a revoked certificate, a stolen signing identity, and an Apple-side outage at various points. It was none of those. The rule that changed underneath us: **keychain unlock state now applies to the securityd session that performed the unlock, not to the machine.**

## The symptom

A GitHub Actions job on our Mac Mini runner, running the same build that passed the day before:

```
codesign --force --sign B1EDD07E... hermes.framework
hermes.framework: errSecInternalComponent
Command PhaseScriptExecution failed with a nonzero exit code
```

The failure came from the `[CP] Embed Pods Frameworks` CocoaPods phase, which signs every embedded framework. Archive dies, exit 65, no further explanation.

What made this miserable was the surrounding evidence. From an interactive terminal, everything looked fine:

- `security find-identity -v -p codesigning` listed the Apple Distribution identity as valid, with its private key
- Keychain Access showed both keychains unlocked
- `security show-keychain-info` reported `no-timeout` on both
- Codesigning from that same interactive terminal **worked**

Only the CI job failed. Same machine, same key, same certificate, seconds after a successful interactive sign.

## What it is not

Work through these before touching anything, because each one produces the same error and each has its own fix:

- **Locked keychain after reboot.** The classic. `security unlock-keychain` fixes it. Still worth ruling out first, but on modern macOS it is no longer the whole story (see below).
- **Missing or revoked certificate.** Check `security find-identity -v -p codesigning`. If the identity is listed as valid with a private key, the certificate is fine.
- **Wrong partition list.** `security set-key-partition-list -S apple-tool:,apple: -s -k <password> <keychain>` is the standard CI fix and good hygiene regardless. It did not fix this, and applying it does not hurt.
- **DNS, proxy, or TLS interception.** `errSecInternalComponent` is a local keychain error, not a network error. If you can hit `https://api.appstoreconnect.apple.com` from the same shell, the network is not your problem.
- **An Apple-side outage.** Check `developer.apple.com/system-status`. During our debugging we also hit a genuine App Store Connect outage where every API key returned 401 `NOT_AUTHORIZED` for hours. Two unrelated failures in one night is possible, and each one will hide the other.

## Two commands name the problem

Run the codesign from the same kind of session your runner uses. Ours is launched over SSH, so:

```bash
ssh localhost 'echo t > /tmp/t.txt && codesign -f -s "YOUR_IDENTITY_SHA1" /tmp/t.txt'
```

Then run the identical command in an interactive terminal.

If the interactive one succeeds and the SSH one prints `errSecInternalComponent`, you have the per-session unlock semantics. Confirm with:

```bash
ssh localhost 'security show-keychain-info ~/Library/Keychains/login.keychain-db'
```

In the broken state this returns `User interaction is not allowed` even though Keychain Access on the desktop shows the keychain unlocked. The unlock you performed in the GUI belongs to the GUI's securityd session. Your runner is in a different session, and in that session the keychain is still locked.

The decisive experiment: unlock and sign **in the same session**.

```bash
ssh localhost 'security unlock-keychain -p "PASSWORD" ~/Library/Keychains/dev.keychain-db && codesign -f -s "YOUR_IDENTITY_SHA1" /tmp/t.txt && echo SIGNED'
```

If this succeeds, diagnosis done. The unlock has to happen inside the session that signs.

## Fix 1: unlock inside the CI job

The GitHub Actions job shares its session with the codesign invocations it makes, so a step before the build covers it:

```yaml
- name: Unlock keychains for codesigning
  if: vars.USE_GITHUB_HOSTED != 'true'
  run: |
    security unlock-keychain -p "$DEV_KEYCHAIN_PASSWORD" "$HOME/Library/Keychains/dev.keychain-db"
    security unlock-keychain -p "$LOGIN_KEYCHAIN_PASSWORD" "$HOME/Library/Keychains/login.keychain-db" || true
  env:
    DEV_KEYCHAIN_PASSWORD: ${{ secrets.DEV_KEYCHAIN_PASSWORD }}
    LOGIN_KEYCHAIN_PASSWORD: ${{ secrets.LOGIN_KEYCHAIN_PASSWORD }}
```

Details that matter:

- **Two secrets, one per keychain.** Ours had different passphrases, and a single shared secret unlocked one keychain and silently failed on the other because of a `|| true` we added for portability. The failure surfaced later as a wrong signing identity. Keep the `|| true` only for keychains whose unlock is genuinely optional, and know which one is load-bearing.
- **Avoid `contains(runner.labels, 'self-hosted-macos')` as the gate.** On our runner, carrying that exact label, the expression evaluated false and the step was skipped silently. We gate on a repository variable instead (`vars.USE_GITHUB_HOSTED != 'true'`), which also keeps the workflow portable to cloud runners later.
- **`security unlock-keychain` takes `-p <password>`.** A positional password argument is rejected on current macOS. And the password has to reach the tool: `ssh` does not forward environment variables, and the tool does not read stdin. Passing `-p` with the password interpolated by the step's own shell is the reliable path.

## Fix 2: unlock in the runner's own startup session

The job-level step covers every job, but you can also fix it once per runner start. Our runner service is a LaunchAgent that SSHes to localhost and execs the runner. We replaced its command with a wrapper script:

```bash
#!/bin/bash
while [ ! -d "/Volumes/Projects/actions-runners" ]; do sleep 5; done
PW=$(cat /Volumes/Projects/actions-runners/.keychain_pw)
security unlock-keychain -p "$PW" "$HOME/Library/Keychains/dev.keychain-db"
security unlock-keychain -p "$PW" "$HOME/Library/Keychains/login.keychain-db"
cd /Volumes/Projects/actions-runners/actions-runner-org && exec ./bin/runsvc.sh
```

The password lives in `.keychain_pw` with mode 600 on the same encrypted volume as everything else we already store locally. After this, a reboot needs no human at all: the LaunchAgent starts, the wrapper unlocks the keychains in its own session, and the runner inherits it.

The restart itself has two traps. `launchctl kickstart -k <label>` restarts the job with the plist as cached at boot, so editing the plist file and then kicking does nothing new; use `launchctl bootout gui/$(id -u)/<label>` followed by `launchctl bootstrap gui/$(id -u) <plist-path>` to make the runner pick up plist edits. Restarts can also orphan a second `Runner.Listener` process, so after any restart check `pgrep -f 'bin/Runner.Listener'` and kill duplicates whose parent PID is 1. Two live listeners fight over one session and log `A session for this runner already exists` while retrying.

## The related trap: stale provisioning profiles

Later that night we hit a second failure. Our iOS build failed with `Provisioning profile "com.example.app AppStore" expired on 2 Nov 2026`. We had regenerated that exact profile on App Store Connect and installed the fresh copy.

Cause: `~/Library/MobileDevice/Provisioning Profiles/` on the runner had **76 expired copies** of profiles with the same name. Xcode resolves profiles by name during archive and matched an expired one. Regenerating on ASC and installing the new file does not remove the old ones.

The fix is to delete every expired profile with that name from the runner's profile directory and rebuild. To check what a profile actually contains after the cleanup:

```bash
security cms -D -i "/path/to/SomeName.mobileprovision" > /tmp/p.plist
```

then inspect `Name`, `ExpirationDate`, and the `DeveloperCertificates` array (they are base64 DER blobs; pipe one through `openssl x509 -fingerprint -sha1` to compare against `security find-certificate -c "Apple Distribution" -Z`).

A `force: true` on your `sigh`/`get_provisioning_profile` call in CI regenerates the profile on every build and prevents the pile-up.

## The diagnostic order that would have saved us a day

1. Reproduce the failing command in the runner's session type (SSH for us). If it succeeds there, stop; the problem is not the runner.
2. `security show-keychain-info <keychain>` from that same session. `User interaction is not allowed` means locked-in-this-session, regardless of what the GUI claims.
3. Unlock + sign in one session. Success = per-session semantics confirmed.
4. Only then look at partition lists, certificate validity, or Apple's status page.

The deeper lesson from our night: we had a server-side Apple outage (every API key 401) and this client-side keychain change hitting at the same time. Each one masked the other: a red build looks identical whether the API is down or the keychain is locked. The way through was to test each layer in isolation and prove each one healthy or broken on its own: a raw JWT against the API with no CI involved, and a raw codesign with no CI involved.
