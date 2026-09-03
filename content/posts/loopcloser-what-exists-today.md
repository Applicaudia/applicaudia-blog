---
title: 'Building LoopCloser, Part 2: What Exists Today'
date: '2026-09-08'
excerpt: 'An honest inventory of LoopCloser one week into the build-in-public run: what works, what is rough, and what is held together by a single daily user.'
tags: ['build-in-public', 'loopcloser', 'management', 'shipaton']
---

# Building LoopCloser, Part 2: What Exists Today

Last week I wrote about [why I am building LoopCloser](/blog/loopcloser-the-tool-i-always-wanted). This post is the inventory: what the app actually does today, two and a half weeks before it has to be public in the App Store and Google Play.

I will try to keep this honest, which is easier than it sounds, because the honest version is also the useful version. The app is in daily use by roughly one person, and that person is me. Everything below is tested the way most first versions are: on the manager who is motivated not to lose his notes.

## What works

**The notebook core.** Every person I manage has a space: their 1:1 notes, their commitments, their development plan. Notes can be drafted before a conversation and finished after it. The next 1:1 starts where the last one ended. This is the part I built for myself first, and it is the part I would keep if I had to delete everything else.

**Action tracking.** Commitments are tracked items, not sentences in a paragraph. Mine and theirs. When something is still open three weeks later, the app shows me that, instead of my memory quietly losing it.

**AI coach insights.** The app reads the notes I wrote and points at things: a concern that has come up three weeks in a row, a development goal that has not moved since spring, a question I might want to ask in the next 1:1. It is a second pair of eyes, not an oracle. It is regularly wrong in useful ways, in the sense that disagreeing with it forces me to articulate what I actually think.

**Export.** All notes export as markdown and zip. I have been burned by tools that held my data hostage, so this was a requirement from day one, not a feature.

**Platforms.** A web app at [loopcloserapp.com](https://loopcloserapp.com), an iOS app in TestFlight, and an Android app in internal testing. Same core, shared across platforms.

## What is rough

I promised this section, so here it is.

The mobile apps are behind the web app. Not by architecture, but by attention: I use the web app in 1:1s on a laptop, so that is what gets polished. Taking notes on a phone mid-conversation is a different habit than the one I have, and the UI has not caught up.

The AI coach is only as good as the notes it reads. On a thin week of notes it has thin things to say. I have not yet built the guardrails that tell it to stay quiet when it has nothing.

Onboarding is still written for me, not for a stranger. There is a difference between an app that explains itself and an app that relies on the author knowing why every screen exists. LoopCloser is currently the second kind.

And the parts I am building right now, the 360 feedback flow - reviewer mapping, sending requests, summarizing what comes back - exist on a branch, not in the app. Milestones are landing, but if you tried it today you would find none of it. When it merges, it gets its own post.

## The deadline math

The stores have to have the public version by September 19. Between now and then: App Store review, Play Store review, the paywall going live, and the 360 flow landing or being explicitly cut from the launch. I have a plan for the order of those. The plan has already been wrong once, which is normal, and I will write about what broke when it breaks.

If you want to follow along: this blog, or [@applicaudia on X](https://x.com/applicaudia). If you manage people and want to kick the tires, [loopcloserapp.com](https://loopcloserapp.com) - the first six team members are free, and trial codes are available if you ping me.

Next post: monetization and the paywall - what it will cost, how the free tier is drawn, and why.
