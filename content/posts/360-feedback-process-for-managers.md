---
title: 'The 360 Feedback Process, Rebuilt Around the Manager'
date: '2026-09-06'
excerpt: 'A 360 feedback process run by hand means mapping reviewers and compiling answers. LoopCloser balances reviewer load and traces each conclusion to a quote.'
tags: ['loopcloser', 'management', '360-feedback', 'build-in-public']
---

# The 360 Feedback Process, Rebuilt Around the Manager

A 360 feedback process sounds simple: collect input about a person from the people around them. Use it to help them grow. Then you try to run it in Excel, shared docs, and email chains, and the logistics take over. The manager owns a pile of unglamorous work. Someone maps reviewers so no one carries an unfair load. Then they chase answers, compile what comes back, and keep the whole thing traceable. This post is about how LoopCloser, the manager notebook I am building in public, takes over that half of the job.

I wrote about why I started LoopCloser in an [earlier post](https://applicaudia.se/blog/loopcloser-the-tool-i-always-wanted/). That one covered the 1:1 notebook core. This one covers the 360 side and the people memory that feeds it.

## The unglamorous half of a 360 feedback process

The valuable output of a 360 cycle is maybe three pages of synthesis per person. Everything around those pages is logistics. Reviewers have to be chosen, balanced across relationships, and reminded. Answers arrive in different shapes at different times. Compilation then has to stay honest, because a reviewer's careful sentence should not dissolve into a vague summary nobody can check.

LoopCloser treats that logistics layer as a first-class feature rather than an afterthought, and the sections below walk through each piece.

## Balancing reviewer load evenly

Hand-mapping reviewers drifts toward two failure modes. Popular colleagues end up reviewing seven people, and quiet ones end up reviewing nobody. As a result, some reviewees are starved of input.

LoopCloser's allocation solver instead balances reviewer burden across the cycle. It produces soft workload recommendations rather than hard capacity caps. A solver should not forbid the one case where a reviewer genuinely should weigh in on five people. The manager stays the owner of the cycle, so every mapping can be adjusted before anything goes out.

## Collecting answers without chasing accounts

Every reviewer gets one bundle link: a single, high-entropy, revocable link, with an optional password. Reviewers answer through that link without creating a LoopCloser account, and employees never get a portal to log into at all.

That choice removes the biggest source of friction in any 360 feedback process, namely the signup wall between a willing reviewer and their answers. It also removes a class of awkward conversations, since a revocable link is easy to invalidate if it leaks into the wrong hands.

One rule matters more than convenience here: AI never rewrites raw submissions. Whatever a reviewer wrote stays exactly as written, and everything derived from it is layered on top.

## From answers to evidence

Once answers are in, LoopCloser compiles them into briefs for performance reviews. Each conclusion in a brief traces back to the exact quotes it came from. When a review conversation lands on a claim, the manager can point at the sentence behind it.

That traceability is the difference between a review built on evidence and one built on vibes. Therefore compilation runs as a pipeline with provenance, rather than as a text box.

## The person behind the review

A 360 cycle only covers a slice of what a manager has to remember about each person. LoopCloser therefore keeps a living profile per team member. The synthesis covers shared direction, growth, working relationship, and voluntarily shared personal context like family, hobbies, and career direction.

Personal context is exactly that, voluntary. The manager reads it to coach better, not to score it.

AI can propose changes to the profile, for example after a reconciled 1:1. Every proposal then waits in a candidate list until the manager approves it. Nothing about a person changes silently in the background.

Formal growth gets its own artifact: the individual development plan. Each plan is employee-driven, with intake by email, immutable versions, and an append-only progress log. A year of growth therefore becomes a document with a history, rather than an overwritten file.

## Praise that reaches the right person

Managers hear nice things about people who are not in the room. In a 1:1, someone mentions that a colleague unblocked them on a nasty bug. That compliment deserves a destination besides the manager's memory.

During reconciliation after a 1:1, LoopCloser detects mentions of other team members and proposes two kinds of cards. A cross-colleague feedback card routes praise or observations into that colleague's profile. A discussion topic card routes a topic that needs a real conversation into that colleague's discussion queue. It then surfaces as a bullet under Discussion in the next 1:1 note with them.

The loop that closes is the one the product is named after: input collected in one conversation, delivered where it belongs, in another.

## FAQ

### Do reviewers need a LoopCloser account?

No. Each reviewer answers through one revocable bundle link, optionally protected by a password. Employees being reviewed never need to log in either, since there is no employee portal.

### Can AI change what a reviewer wrote?

No. Raw 360 submissions are never rewritten. AI proposes compilations, profile changes, and follow-ups, and the manager approves or rejects each proposal. That rule applies at every stage of the 360 feedback process.

### What does LoopCloser cost?

Your first 6 team members are free, forever, with unlimited notes and search. Pro starts at $9.99 per month or $89.99 per year, and unlocks the whole team plus review generation and exports.

### Is it only for engineering managers?

It is built by and for an engineering manager, so that is the vocabulary you will find. However, any manager who runs 1:1s and wants traceable feedback can use it. Try it at [loopcloserapp.com](https://loopcloserapp.com).

---

*This post is part of the [Applicaudia blog](https://applicaudia.se/blog/). Applicaudia AB is a one-developer studio in Gothenburg. LoopCloser is its manager notebook: 1:1 notes, growth plans, and 360 feedback in one private place, at [loopcloserapp.com](https://loopcloserapp.com).*
