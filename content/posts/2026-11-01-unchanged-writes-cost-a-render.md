---
title: "The Write That Changed Nothing: Debugging Jank in a React Native Strobe Tuner"
date: "2026-11-01"
excerpt: "Our tuner ran at 31 fps on a 2018 Android phone while iOS sat smooth. The profiler pointed at a render chain consuming 37% of app cycles — triggered by writes that changed nothing. Here's why an unchanged value write still costs a full native render pass in Reanimated, and how we fixed it with two one-line gates."
tags: ["React Native", "Reanimated", "performance", "Skia", "jank", "profiling", "AI-assisted development"]
---

# The Write That Changed Nothing: Debugging Jank in a React Native Strobe Tuner

StroboPro is a strobe tuner: its whole product promise is a display that moves *smoothly*, because the harmonic rings on screen are literally visualizing phase drift in real time. On modern iPhones it runs beautifully. On a Huawei P20 Pro — a 2018 mid-range Android we keep around precisely because it's slow — the display stuttered, the audio polling loop blew out to 83 ms, and the GPU frame time p50 sat at 44 ms. Thirty-one frames per second, on the device that most needed the app to feel precise.

The fix ended up being two small gates. But the *why* is the interesting part, because it inverts an assumption most React developers carry around without noticing: that writing an unchanged value is a no-op. In the Reanimated + React Native Skia stack, it is not a no-op. It is a render command in disguise. This post is the full anatomy of that mistake — ours and the framework's — plus the regression guards we built so it never comes back.

## Step one: profile on the slowest device you support

None of this showed up on a modern phone or in the simulator. That's the first lesson and it's boring and non-negotiable: **the fast device hides the cost profile entirely.** On an iPhone 15, a redundant write costs a redundant write. On the P20 Pro, the same write lands on a much more expensive JNI bridge, a slower GPU, and a JS thread with far less headroom — so the cost stops being noise and becomes the whole profile.

We instrumented three signals:

1. **Audio poll interval** — the tuner's measurement loop prints its own history in debug builds. If the JS thread is congested, this number is the first to suffer, and for a *tuner* it's the one that matters: a late poll is a late measurement. (Our golden rule: measurement quality outranks rendering smoothness. Never trade one for the other — fix the render path *within* the measurement budget.)
2. **`dumpsys gfxinfo` frame percentiles** — free, on-device, no harness. The p50 tells you what a typical frame costs; the tail tells you what users feel.
3. **CPU sampling** — here the profiler handed us the headline: **~37% of all application cycles were inside the React Native Skia → JNI → `renderImmediate` chain.** Not drawing anything new. Just being *in* the render machinery.

Thirty-seven percent of the app's time was spent telling the GPU to redraw things that hadn't changed. So: who kept ordering the redraws?

## Suspect one: colors crossing the bridge as objects

Reanimated SharedValues cross the JS/native boundary through `setJsiProperty`. Our ring colors were stored as objects — `{ r, g, b, a }`-ish shapes that Skia accepts — and every animation frame, every color property went through that crossing.

On the slow device, each object crossing costs measurably more than a numeric one. The fix was to pack colors as plain numbers (`packSkColor` produces the platform's native packed representation) so the bridge carries a single JS number instead of a fresh object graph.

That helped. It did not explain 37%.

## Suspect two: the write that never changes anything

The real culprit was idiomatic animation code — the kind you'll find in a thousand tutorials. Inside a `useFrameCallback`, compute the next rotation value and write it:

```tsx
const next = doMod(prevRotate + v * (dt / 1000), Math.PI * 2);
rTransform[i].value = [{ rotate: next }];
```

Every frame. Unconditionally. And here's the thing: *most of the time, nothing changed*. When the tuner rings are resting — the note is held, the ring is locked on pitch, drift velocity is zero — `next` equals `prevRotate` to the last bit. The line runs, writes an identical value, and goes home having done nothing.

Except it hadn't done nothing. Because **Reanimated's `makeMutable` notifies listeners on every single set, with no equality check and no dedup.** The value assignment isn't a variable write; it's an event dispatch. The React Native Skia renderer registers a listener on every SharedValue it's bound to, and each notification drives `setJsiProperty` → a JNI call across the native boundary → `renderImmediate` — a full render pass, scheduled and executed, for a frame identical to the last one.

Read that again from the framework's point of view: **there is no such thing as a redundant write.** The renderer can't know the value is semantically unchanged without doing the comparison itself, so it assumes every write is dirty and re-renders. React itself batches and diffs; reconciliation is what makes idempotent re-renders affordable in plain React. The Reanimated-to-Skia path has no such layer. The comparison is *your* job.

So a screen at rest, showing a locked-in-tune ring — arguably the most important visual state a tuner has, because "stable" is the whole signal — was triggering the full native render pipeline 60 times a second. On the P20, that machinery is expensive enough to eat a third of the app's cycles, congest the JS thread, and drag the audio poll — the measurement path — out to 83 ms.

An idle app, rendering furiously at nothing.

## The fix is an equality gate

The fix for that hot loop is one comparison:

```tsx
const prevRotate = rTransform[i].value[0].rotate;
const next = doMod(prevRotate + (v * Math.PI) / 180 * DRIFT_SCALE[i] * (dt / 1000), Math.PI * 2);
// Skip the write when unchanged (v === 0 rest phase) — makeMutable
// notifies on every set, so a redundant write still costs a render pass.
if (next !== prevRotate) {
  rTransform[i].value = [{ rotate: next }];
}
```

The same `!==` gate went onto every per-frame SharedValue write in the ring-rendering path. That's it. That's the whole fix.

Measured on the same P20 Pro, same idle scenario, median of three runs:

| Metric | Before | After |
|---|---|---|
| Audio poll avg | 83.3 ms | ~54 ms |
| gfxinfo frame p50 | 44 ms | ~17 ms |
| FPS | 31.6 | ~48 |

The FPS number didn't reach 60 and we left it there on purpose. The 60→48 gap on a 2018 GPU is the cost of drawing the rings at all, and pushing it down would mean shrinking the measurement budget — which is exactly the trade our golden rule forbids. The frame p50 of 17 ms means the render thread has real headroom again; the poll at 54 ms means measurement latency is back where the product needs it. Rendering recovered *within* the measurement budget, not by eating it.

## The guards: because this regresses silently

The nastiest property of this bug class is that it doesn't look like a bug when you reintroduce it. Nobody writes `if (next !== prev)` and then deletes it. It regresses the way the original happened: someone adds a new ring, or a new per-frame property, and writes the idiomatic unconditional line. It passes review — it *is* idiomatic — and the jank only shows up on the slow device, weeks later, if anyone happens to profile.

So we built two guards, now running in CI on every PR that touches the animation surfaces:

**1. A static check for unconditional SharedValue writes.** A small lint-style script scans every file that uses `useFrameCallback` for SharedValue `.value =` assignments with no conditional guarding them — heuristically, no `if (` within the preceding few lines. Each finding must either carry an inline `// jank-ok: <reason>` marker or be added to an explicit allowlist with a justification. It's deliberately coarse: it will never be a complete parser, and its header says so. But it encodes the actual invariant — *per-frame SharedValue writes must be gated or justified* — and it caught a genuine live violation in a demo component the day we turned it on. Static guards like this pay for themselves the first time.

**2. A hardware benchmark that gates against a committed baseline.** The static check catches the pattern; only the device catches the cost. We committed a benchmark that builds the release app, installs it on the P20 Pro, samples three runs of `dumpsys gfxinfo` plus the tuner's own poll history, and compares medians against a `baseline.json` in the repo — poll avg, frame p50, each with explicit tolerances. Two properties make it practical:

- **It self-skips (exit 0) when the device isn't attached.** So it can run on every PR without requiring the hardware; when a runner with the phone connected picks up the job, the gate is real. No phone, no false failures.
- **It gates medians over three runs**, not single samples, because a phone this old shares a wall with a desk full of other hardware and the occasional outlier run is a fact of life.

The baseline anchors an *idle* tuner rather than a stimulated one, deliberately: an idle, in-tune screen is the exact state where the redundant-write pathology lives, and it's also the most reproducible stimulus — no speaker feedback loops, no MIDI routing, no flaky taps.

## What generalizes

If you take one sentence from this post: **in a direct-binding animation stack, an unconditional write is a render command, and only you can tell the renderer it's a no-op.** React's reconciliation model trains you to think writes are cheap and diffs are automatic. Reanimated's SharedValues flip that: the write is the event, the render is unconditional, and the diff is manual.

And the meta-lesson, which we keep relearning: the profiler told us the truth in one session on the slow device, after months of nothing on the fast ones. Fix what the measurement says, gate the fix against a baseline, and make the baseline machine-checked — because the next person (or the next AI agent) to touch that file will write the idiomatic line. The guard has to be there to meet them.

---

*StroboPro is a multi-harmonic strobe tuner with a `<0.1 cent` display resolution — which is exactly why render jank mattered so much: the rings are the measurement. If you're curious what a phase-comparison tuner looks like when the display is smooth, it's free to try at [strobopro.se](https://strobopro.se).*
