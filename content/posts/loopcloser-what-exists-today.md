---
title: 'Building LoopCloser, Part 2: What Exists Today'
date: '2026-09-08'
excerpt: 'An honest inventory of LoopCloser one week into the build-in-public run: what works, what is rough, and what is held together by a single daily user.'
tags: ['build-in-public', 'loopcloser', 'management', 'shipaton']
---

# Building LoopCloser, Part 2: What Exists Today

Last week I wrote about [why I am building LoopCloser](/blog/loopcloser-the-tool-i-always-wanted). This post is the inventory. It covers what the app actually does today, two weeks before the public store launch.

I will keep this honest, because the honest version is the most useful version. The app is in daily use by roughly one person: me. Everything below is tested by a manager motivated not to lose his notes.

## What works

**The notebook core.** Every person I manage has a dedicated space for 1:1 notes, commitments, and development plans. You can draft notes before a conversation and finish them afterward. Each meeting starts where the last one ended. This is the foundation I built for myself first. It is the part I would keep if forced to delete everything else.

**Action tracking.** Commitments are tracked items rather than lost sentences in a paragraph. When an item remains open three weeks later, the app flags it directly.

**AI coach insights.** The app reads recent notes and highlights key patterns. The coach spots concerns repeated three weeks in a row, stalled goals, and prompts for the next chat. Think of it as a second pair of eyes rather than an oracle. It is regularly wrong in useful ways, because disagreeing with it forces me to clarify my thinking.

**Export.** All notes export cleanly as markdown and zip archives. I have been burned by tools holding data hostage, so open export was a requirement from day one.

**Platforms.** The system runs on the web at [loopcloserapp.com](https://loopcloserapp.com), on iOS via TestFlight, and on Android in internal testing. All platforms share the same core engine.

## What is rough

I promised this section, so here it is.

The mobile apps still lag behind the web app. This is a matter of attention rather than architecture. Because I run 1:1s on a laptop, the web interface gets polished first. Mobile note-taking during meetings requires different habits, and the phone UI needs refinement.

The AI coach depends directly on note quality. When notes are brief, its insights are thin. I still need to build guardrails to keep it quiet when context is scarce.

I wrote the onboarding flow for myself rather than new users. LoopCloser currently expects you to know why each screen exists, which needs simplification.

Finally, the 360 feedback pipeline lives on a feature branch. Reviewer mapping, request dispatching, and summary generation are still in progress. When that merges, it will get its own walkthrough.

## The deadline math

The public release must reach the stores by September 19. Between now and then, I need to complete App Store review, Google Play review, and paywall activation. I also need to decide whether the 360 flow makes the initial launch.

To follow along, check this blog or [@applicaudia on X](https://x.com/applicaudia). If you manage people, try [loopcloserapp.com](https://loopcloserapp.com). The first six team members are free, and you can email me for trial codes.

Next post: monetization and the paywall. We will cover pricing, free tier boundaries, and the reasoning behind them.
