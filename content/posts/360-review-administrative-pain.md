---
title: 'The Administrative Pain of Running 360 Reviews (and How I Fixed It)'
date: '2026-09-09'
excerpt: 'Running 360 reviews by hand took me days of planning with AI help, and I still got it wrong. Here is what the process actually demands of a manager.'
tags: ['loopcloser', 'management', '360-feedback', 'performance-reviews']
---

# The Administrative Pain of Running 360 Reviews (and How I Fixed It)

Every year I run 360 reviews for my team. I'm an engineering manager and my team is a mix of employees and contractors ("consultants" in Sweden), and I wanted to ensure that the feedback was role-specific, and that I balanced the reviewer load, anonymized results with real quotes I could use in performance conversations. I planned the whole thing with AI assistance. It still took me days. And I still got it wrong: some of the feedback request emails were for some reason left in my drafts folder, and it took me a month to notice.

This post is the breakdown of what a hand-run 360 cycle actually demands from a manager. Not the theory of 360 feedback, the logistics. Because in practice, the logistics are the job.

## The mapping problem: who reviews whom

Before a single question gets written, you have to build a map. For every person receiving feedback, who should give it?

That map is more complicated than it looks, because a modern engineering team contains three populations, not two:

- **Employees** are reviewed. They receive a feedback report at the end. Employees can be in multiple teams, ideally they will only review others from the same team, but maybe not always.
- **Contractors** (consultants, in European usage) give feedback, but they are not reviewed themselves. Like employees, consultants should preferably review people on the same team.
- **Stakeholders** are people outside my line organization who work with my people anyway: product managers, delivery managers, engineers on neighboring teams. They have valuable perspective. They are not part of my review scope.

The first administrative task is separating defining who gets whom as reviewer based on their role and team.

### Contractors and stakeholders give feedback, but do not receive it

This means that every list, every email merge, every tally of "who still owes feedback" has to respect a directional rule that is really hard to take care of manually. For teams in Sweden and much of Europe, where mixed employee and consultant teams are the norm rather than the exception, this is the first thing that breaks.

## Different questions for different roles

Once the map exists, the questions come next, and one questionnaire does not fit all. A tech lead gets questions about technical judgment and mentoring. A junior developer gets questions about collaboration and growth. A P.O. might be judged on her capability to plan features and design a roadmap.

Per-role question sets multiply the admin work fast. Ten reviewees across four roles means four questionnaires to keep straight, each attached to the right subset of reviewers, each needing to reach the right inboxes.

## Balancing the load, in two directions

Here is the constraint that turned my folder full of markdown documents into a small optimization problem. Every reviewee needs **enough** reviewers for the feedback to be meaningful and for anonymity to hold up. Three responses is thin; the feedback is easy to reverse-engineer and statistically weak.

At the same time, no reviewer should drown. Guidance on 360 surveys [recommends keeping questionnaires short and reviewer counts limited](https://www.questback.com/guides/360-feedback-survey-the-complete-guide/) precisely because survey fatigue is real: overload someone once and their next invitation goes straight to the archive folder.

So we are balancing two directions at once. Per reviewee: enough reviewers, drawn from the right populations, answering the right questionnaire. Per reviewer: not too many total requests across all the reviewees they touch. The senior engineer who works with everyone is the one who gets hammered if you do not watch it. Industry writeups list this [complexity and administrative burden as the top con of 360 reviews](https://www.peoplebox.ai/blog/pros-cons-360-reviews/), and this is exactly why.

## Collecting, chasing, and compiling

Then the cycle starts, and the job becomes tracking. Who has answered? Who has not? Time to send reminders, individually, because you built this by hand and there is no system remembering for you. Then the responses trickle in, in different formats, and someone (me) has to compile them into a coherent report per reviewee.

## Anonymized, but verbatim

The compilation has one more hard constraint: the feedback must be anonymized for the employee, but I still need verbatim quotes. Averaged scores tell you very little in a performance conversation; the specific sentence a colleague wrote is what carries the signal. But with three reviewers, a verbatim quote is a signature, so the anonymization has to be real, not cosmetic. [Commentary on 360 programs](https://www.weforum.org/stories/leadership/360-degree-feedback-the-good-the-bad-and-the-ugly/) consistently flags confidentiality as the failure mode that destroys trust in the whole process. Getting this wrong once can poison the well for years.

## Where it broke

Days of planning with help of AI agents, and the process still failed silently. Somewhere in my agentic sendout, some requests were left in drafts. A month later I compared who had responded against who had been asked, and found the gap.

That is the part that stings. The failure was not in the feedback, it was in my process, and I had to collect more feedback at the last minute, apologizing while doing it.

## How I fixed it

I am building [LoopCloser](https://loopcloserapp.com) partly because of this administrative burden. The fix is not more discipline, a better spreadsheet, or more AI agents. The fix is a system where the administrative work is done for you and failures are visible:

- The mapping is generated for you: employees, contractors, and stakeholders handled as distinct populations with distinct rules.
- Reviewer load is balanced automatically in both directions, per reviewee and per reviewer, and you tweak the result with visual tools until it is right.
- Every feedback request is sent by the system, and every request is either sent or visibly failed. Nothing disappears quietly. Silent failure is the specific bug I am designing out.
- Responses are compiled for you, anonymized for the employee, with verbatim quotes preserved for your performance conversation.

I wrote up how the rebuilt process works in detail in [The 360 Feedback Process, Rebuilt Around the Manager](https://applicaudia.se/blog/360-feedback-process-for-managers/), and the background on why I am building this at all in [The Tool I Always Wanted as an Engineering Manager](https://applicaudia.se/blog/loopcloser-the-tool-i-always-wanted/).

If you run 360 reviews for a mixed team and any of this sounded familiar, try it at [loopcloserapp.com](https://loopcloserapp.com).

## FAQ

### How many reviewers should each person in a 360 review have?

Enough that individual responses cannot be reverse-engineered, which in practice means five or more, and few enough that no reviewer is answering questionnaires all week. The constraint cuts both ways, which is exactly why balancing it by hand is hard.

### Should contractors receive 360 feedback?

Not in my cycle. Contractors give feedback on my employees, but their own reviews belong to their employer or agency. The tooling still needs to know they exist and treat them differently from stakeholders.

### How do you keep verbatim quotes anonymous?

By aggregating responses so no quote is attributable to a single named reviewer, and by making sure reviewer groups are large enough that a quote does not identify its author on its own. The manager sees the quote; the employee sees it without attribution clues.

---

_This post is part of the [Applicaudia blog](https://applicaudia.se/blog/). Applicaudia AB is a one-developer studio in Gothenburg. LoopCloser is its manager notebook: 1:1 notes, growth plans, and 360 feedback in one private place, at [loopcloserapp.com](https://loopcloserapp.com)._
