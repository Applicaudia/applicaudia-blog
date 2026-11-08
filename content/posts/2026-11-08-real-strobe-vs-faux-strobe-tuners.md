---
title: "Real Strobe Tuners vs Visualizers: Inharmonic Tone Test"
date: "2026-11-08"
excerpt: "Digital tuners often draw spinning wheels without true strobe analysis. Here is how multi-harmonic phase tracking works and how to test any tuner."
tags: ["audio", "strobopro", "fakepiano", "dsp", "tuning", "acoustics"]
---

# Real Strobe Tuners vs Visualizers: Inharmonic Tone Test

A vintage mechanical strobe tuner operates by direct optical modulation rather than calculating an averaged pitch number. Light from a neon lamp flashes at the frequency of the incoming audio signal, illuminating concentric pattern rings printed on a motor-driven spinning disc. When an incoming harmonic matches the rotational speed of a ring, stroboscopic persistence makes that pattern appear motionless to the human eye.

Because physical sound waves contain multiple harmonics, each concentric pattern on a mechanical disc responds to its own harmonic frequency. When the fundamental note is in tune, the fundamental ring stops. If the second harmonic is slightly sharp due to physical string stiffness, that second ring continues to drift clockwise while the fundamental ring remains stationary.

Modern digital tuners often display a spinning wheel that mimics a mechanical disc. Standard needle and mobile apps calculate a single fundamental pitch estimate and rotate a pre-rendered graphic wheel at a synthetic velocity. A true digital strobe tuner feeds incoming audio through parallel bandpass filters to track the real-time phase drift of multiple harmonics independently.

You can verify whether a tuner separates and tracks individual harmonics using inharmonic test tones.

## How a single-pitch visualizer operates

Single-pitch detection is the foundation of digital needle tuners. Algorithms such as YIN, autocorrelation, or zero-crossing counters examine the incoming audio buffer and calculate one dominant fundamental frequency. 

A strobe visualizer takes that single calculated frequency and compares it to a target note:

$$\Delta f = f_{\text{detected}} - f_{\text{target}}$$

The application then rotates a digital graphic wheel at a visual velocity proportional to $\Delta f$.

Single-pitch detection is ideal for rapid onstage tuning. Chromatic pedal tuners and mobile apps excel at fast target acquisition in noisy rehearsal rooms, filtering out room bleed and locking onto the fundamental in milliseconds using negligible processing power. However, collapsing an entire audio spectrum into one scalar value discards the harmonic phase information that defines stroboscopic measurement.

When a single-pitch visualizer receives a complex sound with stretched overtones, the engine faces an architectural constraint: the software only has one velocity variable. If the fundamental frequency and the overtones drift in opposite directions, the display cannot show them simultaneously.

## How a true digital strobe tuner works

A true digital strobe tuner, such as [StroboPro](https://strobopro.se), mirrors the physics of the mechanical strobe disc in software. Instead of calculating a single average frequency number, the digital signal processor feeds the incoming audio through a bank of phase-tracking filters centered at each harmonic.

Every concentric band on the screen represents a separate harmonic window. The visual drift velocity of each band directly reflects the real-time phase change of that specific partial:

1. The fundamental band tracks $f_1$.
2. The octave band tracks the second partial ($f_2$).
3. The fifth-above-octave band tracks the third partial ($f_3$).
4. Upper bands track higher partials ($f_4, f_5, \dots$).

Because each band evaluates incoming phase independently, the rings move independently. A musician adjusting an instrument can watch the fundamental and overtone rings settle at different rates.

## The acoustic test: inharmonic string partials

Acoustic strings possess physical stiffness that introduces restoring force at shorter wavelengths. In heavy piano wires and wound bass strings, this stiffness causes upper overtones to vibrate faster than exact mathematical integer multiples.

Acousticians describe this frequency shift using the stiff-string equation:

$$f_n = n \cdot f_1 \sqrt{\frac{1 + B n^2}{1 + B}}$$

In this equation, $n$ is the partial number, $f_1$ is the actual fundamental frequency, and $B$ is the inharmonicity coefficient. 

When $B = 0$ (an idealized flexible string), every harmonic is an exact integer multiple ($f_2 = 2f_1$). On a real piano or heavy steel string, $B > 0$. For a concert grand bass string with $B \approx 0.0004$, the second partial vibrates at $f_2 \approx 2.0006 \cdot f_1$, which is roughly 2.1 cents sharp relative to the fundamental.

This physical property provides a clear test bench for tuners:

- **Multi-harmonic strobe analysis**: The fundamental ring halts when $f_1$ aligns with the target pitch, while the second harmonic ring continues to drift clockwise at a speed determined by $B$.
- **Single-pitch graphic visualizer**: Because the engine only tracks one scalar frequency, the wheel cannot decouple the partials; it either locks exclusively to the dominant peak or spins at an averaged compromise speed.

## Running the benchmark with Fake Piano

A repeatable benchmark requires an isolated acoustic reference free from room boundary reflections and soundboard resonance. [Fake Piano](https://applicaudia.se/fakepiano/) provides this reference as a browser-based inharmonic tone generator.

Fake Piano uses Web Audio synthesis to generate piano tones modeled directly on the stiff-string equation. It allows users to set exact frequencies, select specific $B$ coefficients, and adjust cents offsets with 0.1 cent resolution.

Here is a step-by-step test procedure:

1. Open [Fake Piano](https://applicaudia.se/fakepiano/) in your browser.
2. Select the **Ideal String** profile ($B = 0$) as a control. Play note **A1** ($55.0\text{ Hz}$). Both single-pitch visualizers and true strobe tuners should lock smoothly on target.
3. Switch Fake Piano to the **Concert Grand** profile ($B \approx 0.0004$) and play **A1** again.
4. Observe the tuner display on your phone or bench tuner.

On a true multi-harmonic strobe tuner like [StroboPro](https://strobopro.se), the fundamental ring remains stationary while the outer harmonic rings drift clockwise, reflecting the exact inharmonicity of the string. On a single-pitch visualizer, the graphic wheel rotates as a single monolithic unit.

## Operational tradeoffs: speed versus harmonic detail

Single-pitch tuners remain the fastest choice for stage work, quick string changes, and noisy band environments where you need immediate confirmation of the root note.

Strobe tracking becomes essential when setting electric guitar saddle intonation, voicing acoustic instruments, or temperament-tuning low piano unisons, where the relationship between overtones is the primary variable under test.

Testing a tuner with an inharmonic tone reveals its architecture within five seconds: if the second harmonic cannot drift independently of the root, the display is animating an average rather than measuring physical phase.

---

*This article is published on the [Applicaudia blog](https://applicaudia.se/blog/). Applicaudia builds [StroboPro](https://strobopro.se) for chromatic strobe tuning, alongside the browser-based test bench [Fake Piano](https://applicaudia.se/fakepiano/).*
