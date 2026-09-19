---
title: "Fastlane 401 Errors From App Store Connect? Check the Runner Clock"
date: "2026-09-19"
excerpt: "An intermittent 'Authentication credentials are missing or invalid' failure in a self-hosted CI lane traced to clock drift, and a preflight guard that fails fast."
tags: ["ci", "fastlane", "app-store-connect", "self-hosted-runner"]
---

# Fastlane 401 Errors From App Store Connect? Check the Runner Clock

Every iOS release ships from a self-hosted Mac runner. One morning the tag build failed in the **Build iOS app** step with a message that looks like a credential problem:

```
Authentication credentials are missing or invalid
```

It came from the very first App Store Connect calls, `get_appstore_connect_apikey` and `get_provisioning_profile`. Nothing in the pipeline had changed; the same step had been green the day before. The usual suspects were all fine: the `.p8` key was in place, the key ID and issuer ID were unchanged, and the key was not revoked.

## The symptom

The failure is intermittent, which is what makes it expensive. It appears as a fastlane 401 on App Store Connect API calls, it survives re-running the job, and it disappears after rebooting the runner machine. That last detail is the giveaway: rebooting a Mac resynchronizes its clock.

App Store Connect API authentication uses a JWT signed with the `.p8` key. The token carries `iat` (issued at) and `exp` (expires at) timestamps, and Apple validates both against its own clock. If the runner's clock has drifted more than a few minutes, every token the runner signs is either "not yet valid" or "already expired" from Apple's point of view. The API answers with a 401 that reads like bad credentials, even though the credentials are fine.

Self-hosted runners drift because their real-time clock is battery-backed hardware with no time source. Desktop Macs on an office network usually stay honest because macOS network time sync is on. Headless build boxes slowly wander, and the drift accumulates silently until a JWT crosses Apple's tolerance window.

## The diagnosis

Confirm skew in one command by comparing local time to a server's `Date` header:

```bash
LOCAL=$(date +%s)
SERVER=$(curl -sI https://www.apple.com \
  | grep -i '^date:' \
  | sed 's/^[Dd]ate: //;s/\r$//' \
  | xargs -I{} date -j -f "%a, %d %b %Y %H:%M:%S %Z" "{}" +%s)
echo "Skew: $((LOCAL - SERVER))s"
```

Anything beyond a couple of minutes explains the 401. Apple's own docs note the API rejects tokens whose timestamps are more than a few minutes out of alignment with server time.

## The fix, in two parts

First, turn on network time on the runner so the drift never accumulates:

```bash
sudo systemsetup -setusingnetworktime on
```

Second, because a silent-drifting clock can still cost a full build before anyone notices, add a preflight step to the workflow that measures skew against `apple.com` and fails the job immediately if it exceeds 60 seconds. The failure message says exactly what is wrong and how to fix it, instead of a misleading 401 four steps later in a lane that has already archived the app.

The guard cost one `curl` per build. It turned an unreproducible authentication failure into a red step with a one-line remedy, and a reboot into a non-event.
