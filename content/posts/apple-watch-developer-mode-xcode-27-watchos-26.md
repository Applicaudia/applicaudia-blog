---
title: "Two Hours to Turn On Developer Mode on an Apple Watch (And It Still Isn't Working)"
date: "2026-11-28"
excerpt: "An Apple Watch SE on watchOS 26.6.1 paired to iOS 27.2.1 with Xcode 27.2 on a Mac Mini. Two hours of hidden toggles, silent Wi-Fi requirements, a double-confirmation reboot trap, and a CoreDevice pairing loop with no running build."
tags: ["watchOS", "Apple Watch", "Xcode", "iOS", "CoreDevice", "developer experience"]
---

# Two Hours to Turn On Developer Mode on an Apple Watch (And It Still Isn't Working)

Today my first physical Apple Watch arrived so I could run on-device audio verification for our watchOS companion app. Two hours later, Developer Mode is toggled on. The watch has been unpaired, reset, re-paired to a dedicated test iPhone, rebooted twice, and unpaired from CoreDevice. Xcode still cannot keep a stable connection to it.

This is not a post with a tidy happy ending. It is a field report on how hostile Apple's watchOS developer onboarding gets when your hardware is one OS generation behind Xcode, plus the diagnostic commands that actually showed us what was happening.

## The setup

Nothing exotic here:

| Component | Version / Model | Notes |
|-----------|-----------------|-------|
| Watch | Apple Watch SE (`Watch6,13`), watchOS 26.6.1 | Capped at 26; cannot update to watchOS 27 |
| Phone | iPhone SE (`iPhone12,8`), iOS 27.2.1 | Wired via USB; Developer Mode already enabled |
| Host | Mac Mini, Xcode 27.2 | Deployment target in project is `watchOS 10.0` |

Every piece of this setup is supported.

## Trap 1: A toggle that hides instead of explaining itself

On watchOS, **Developer Mode** lives at **Settings → Privacy & Security → Developer Mode**. Except when it does not. Apple hides the menu item completely until Xcode completes a discovery handshake with the watch through its paired iPhone.

There is no greyed-out row. There is no status line saying *"Waiting for Xcode on a paired Mac."* You open **Privacy & Security** and scroll to empty space. You are left guessing whether watchOS 26 moved the setting or whether the watch is too old.

## Trap 2: Trust succeeds over Bluetooth, then CoreDevice dies silently over Wi-Fi

Our Mac Mini is a wired CI runner. Ethernet (`en0`) was up, while Wi-Fi (`en1`) was turned off:

```bash
networksetup -getairportpower en1
# Wi-Fi Power (en1): Off
```

Because the iPhone was plugged in over USB, Xcode could reach the phone. The phone then relayed a **"Trust This Computer?"** prompt to the watch over Bluetooth. I tapped Trust and entered the watch passcode.

Nothing happened. `xcrun devicectl list devices` showed the iPhone as `connected` and showed no physical watch. Device Hub showed nothing. Xcode gave zero feedback.

Apple Watch has no USB port, so CoreDevice requires Wi-Fi on the Mac to open its `localNetwork` tunnel. Apple's tooling was happy to pop a Trust dialog over Bluetooth that could never complete, and never once warned that Wi-Fi was off on the host.

## Trap 3: Xcode 27 tells watchOS 26 users to watch a 2022 video

Xcode 27 replaced **Window → Devices and Simulators** with **Device Hub**. For watchOS 27, Device Hub has a direct nearby-device pairing flow. For watchOS 26 (which still runs on watches Apple supports that cannot upgrade to 27), Xcode points you at a four-year-old conference talk:

> "For devices running iOS 26 or watchOS 26 (or earlier) see WWDC 2022: Get to know Developer Mode"

That talk also recommends `/usr/bin/devmodectl` for automating Developer Mode setup. We checked it on the Mac:

```bash
/usr/bin/devmodectl list
# UDID                         Developer Mode Status
# 00008030-001609181183802E    enabled
```

`devmodectl` only lists USB-connected iPhones. It cannot see an Apple Watch at all.

## Trap 4: Cached Settings and the double-confirmation reboot

We turned Mac Wi-Fi on. Then I unpaired the watch from my first phone and reset it. After pairing it cleanly as a new watch to the dedicated iPhone SE, `Chris’s Apple Watch (26.6.1)` finally appeared in Device Hub with this message:

> Enable Developer Mode: To use Chris's Apple Watch for development, go to Settings > Privacy & Security > Developer Mode.

On the watch, **Settings → Privacy & Security** still did not list Developer Mode. watchOS had cached the Settings list. Force-quitting Settings from the app switcher and reopening it finally made **Developer Mode** appear.

Then came the worst UX decision of the morning:

1. Tap **Developer Mode → On**.
2. Confirm **Restart** and wait for the watch to reboot.
3. Enter your passcode after boot.
4. watchOS immediately pops up **"Turn On Developer Mode?"** a second time.

I dismissed that dialog thinking it was a leftover prompt from before the reboot. I had literally just turned Developer Mode on and waited through a reboot for it. Dismissing that alert silently turned Developer Mode back **off** and hid the menu item from **Privacy & Security** again.

There is no warning on that dialog that cancelling undoes the reboot you just sat through.

## Trap 5: Stale CoreDevice state, the trust loop, and the charger lockout

Even after going back through the dance and confirming the second prompt so Developer Mode stayed on, the Mac side never caught up:

```bash
xcrun devicectl device info details --device 00008301-D89EF4811A10A02E
# Device State: disconnected
# Pairing State: paired
# Transport Type: localNetwork
# Marketing Name: Apple Watch SE
# OS Version: 26.6.1
# Developer Mode Status: Disabled
```

Device Hub oscillated between *"Currently Unavailable"* and *"Enable Developer Mode"*. The watch fell into a loop asking **"Trust This Computer?"** over and over.

When I tried to reboot the watch to break the loop, long-pressing the Side Button brought up the power icon, which refused to respond to taps. On watchOS, the Power Off button is silently disabled while the watch sits on its charger. That is not even a developer edge case. It is plain bad consumer UX: Apple renders a power button on screen, accepts your tap with no toast saying *"Remove from charger to power off"*, and silently does nothing until you guess to lift the watch off the puck.

Unpairing the stale Mac-side CoreDevice record stopped the trust loop:

```bash
xcrun devicectl manage unpair --device 00008301-D89EF4811A10A02E
```

And immediately made the watch disappear from Device Hub again.

## What Apple gets wrong here

Developer Mode exists for a legitimate security reason: stopping accidental or coerced sideloading on consumer hardware. The security boundary is not the problem. The implementation and diagnostics around it are.

Hiding **Developer Mode** until an opaque multi-hop handshake succeeds turns every failure into guesswork. Show the toggle, disable it, and print the exact missing condition.

`devicectl` gives you no error surface either. It reports `connecting` or `disconnected` with no reason code, so you never know whether the block is host Wi-Fi disabled, mDNS dropped on the router, an expired trust record, or Developer Mode still off.

Asking for confirmation twice around a reboot is defensible. Silently reverting the setting and re-hiding the UI when the user dismisses the second alert is bad design.

Shipping Xcode 27 with a new Device Hub while punting watchOS 26 devices back to a 2022 video leaves supported hardware stranded in an under-tested code path.

## Commands that actually helped

None of these fixed watchOS on their own, but each one cut through guesswork:

```bash
# 1. Verify the Mac's Wi-Fi is actually powered on and has an IP on the same subnet
networksetup -getairportpower en1
ipconfig getifaddr en1

# 2. See what CoreDevice actually knows about the watch
xcrun devicectl list devices
xcrun devicectl device info details --device <WATCH_UDID>

# 3. Clear a stuck Mac-side CoreDevice trust loop without touching the iPhone
xcrun devicectl manage unpair --device <WATCH_UDID>
```

A few watch-side habits also saved time:

- Force-quit Settings (double-press the Digital Crown, swipe left, tap `X`) whenever Xcode sees the watch but **Privacy & Security** still omits **Developer Mode**.
- Lift the watch off its charger before trying to power it off from the Side Button menu, or hold both the Side Button and Digital Crown for 10 seconds to force restart.
- When you need to test a build on hardware without fighting local CoreDevice tunnels, **TestFlight** installs App Store-signed watch apps through the iPhone's Watch app with no Developer Mode required.

## Where this stands

Two hours into unboxing a brand-new test watch, Developer Mode is enabled on the wrist and CocoaPods is synced. Xcode still has not run a single line of our code on the device. We will update this post if we find a reliable recipe to keep Xcode 27.2 talking to watchOS 26.6.1, or if we end up shipping our first hardware test round through TestFlight just to bypass Apple's debugger bridge.
