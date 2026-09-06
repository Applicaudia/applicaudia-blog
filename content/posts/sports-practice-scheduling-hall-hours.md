---
title: 'Sports Practice Scheduling: Splitting Hall Hours Without the August Argument'
date: '2026-09-06'
excerpt: 'Sports practice scheduling becomes a fairness problem when one club splits municipal hall hours between teams. Here is how CourtPuzzle divides them evenly.'
tags: ['courtpuzzle', 'sports-clubs', 'scheduling', 'build-in-public']
---

# Sports Practice Scheduling: Splitting Hall Hours Without the August Argument

Every season, municipalities grant sports clubs an allocation of venue hours. The club then divides those hours between every team, coach, and age group. Sports practice scheduling at that point stops being a calendar problem and becomes a fairness problem. This post is about CourtPuzzle, the scheduling tool I built for that situation, and about the design choices that make the split defensible.

CourtPuzzle is live at [courtpuzzle.com](https://courtpuzzle.com). I have been building and piloting it with a basketball club in Gothenburg. Every mechanism below exists in the app today, not on a roadmap.

## The actual shape of the problem

Three terms cover the whole domain. A venue is anything a club books time in: a hall, a pitch, a court, or a lane. An allocation is the bundle of venue hours the club has been granted, usually by a municipality. A practice is one team's recurring weekly session in that allocation.

The scheduling work sits in the overlap of those three terms. Each practice needs a venue slot that nothing else occupies. A coach has to be in one place at a time. Every team's request for weekday prime hours collides with every other team's identical request, because nobody wants Sunday at 20:00.

Add human availability and the spreadsheet buckles. Coaches are volunteers with day jobs, so their free evenings decide what is even possible. Meanwhile the split has to look fair to every parent who checks the calendar, all season long.

## How CourtPuzzle approaches sports practice scheduling

CourtPuzzle starts by gathering availability with a coach intake link. Each coach gets a signed, expiring magic link, so they fill in their available days and times without creating an account. That one detail matters, because volunteer coaches drop out of tools that demand logins.

The availability then goes to the solver. The solver places practices under the real constraints: venue capacity, coach availability, and zero collisions. A collision means two practices in one venue slot, or one coach in two places at once. Every schedule the solver produces is checked for full feasibility before anything is saved. There is no "mostly valid" state in between.

Fairness becomes visible instead of vibes-driven through the practices-fulfilled checklist. Each team shows whether all of its weekly practices are placed. An under-served age group is therefore a marked row, rather than a feeling someone argues about in a meeting.

There is also an AI angle, kept deliberately narrow. An AI copilot takes plain-language requests, like "swap the U16 girls to the small hall on Thursdays". It then shows a reviewable diff before anything is applied. AI document import reads a CSV or PDF allocation and asks clarifying questions when the format is ambiguous. In both cases the deterministic solver still validates the result, so the AI drafts and the mathematics signs off.

## One link, always current

Publishing a season schedule usually means exporting a file, mailing it out, and watching it drift out of date. CourtPuzzle instead publishes a read-only weekly calendar at a public share link. Players and parents open the link with no account and no app install.

The interesting part is what happens after publishing. Every schedule change republishes to that same link automatically. When the municipality retracts a hall, the club edits, solves, and publishes again. The world watching the link sees the new state as it happens. The link never changes, and it never goes stale.

For anyone who needs the data itself, the same schedule exports to a multi-sheet Excel workbook, an iCal feed, and Markdown.

## Handing the schedule to collaborators

A club schedule is rarely one person's job, so CourtPuzzle has two roles per club: owner and editor. The owner mints single-use editor invites, each valid for 30 days and revocable. Redeeming an invite is a one-time action with a 192-bit token. The editor can then configure venues, teams, and constraints, run the solver, and edit schedules. Only the owner manages members and the license.

This split keeps the awkward parts, like paying and membership, with one accountable person. Meanwhile every other admin can actually move the schedule forward.

## What CourtPuzzle does not try to do

CourtPuzzle does weekly practice placement, and it does that one thing with full effort. It does not handle payments, member registration, chat, or roster management. General club platforms like TeamSnap and Spond are good at those jobs, and a club can happily run one of them alongside CourtPuzzle for scheduling.

I would rather be honest about that boundary than ship a shallow version of everything.

## What it costs

The free tier covers 2 venues and 3 teams per season, solver and exports included. That is enough to try real sports practice scheduling for a small club. A season pass for a club costs $19.99 for 6 months or $29.99 for 12 months, as a one-time purchase rather than a subscription. It covers every team, coach, and admin in the club. Paddle handles the purchase as merchant of record.

## FAQ

### Does CourtPuzzle replace TeamSnap or Spond?

No, and it is not trying to. Those platforms cover payments, registration, and communication. CourtPuzzle covers the placement and fair division of practice hours across a club's allocated venues, and publishes the result to a live public link.

### Do coaches need to create accounts?

No. Coaches receive a signed magic link, fill in their availability, and are done. Reviewers of the published schedule need nothing at all, since the public share link is read-only and requires no login.

### Can parents and players see the schedule?

Yes. The published schedule lives at a public link that works in any browser. It updates automatically whenever the club republishes, so there is no stale PDF circulating in a group chat.

### What happens when the allocation changes mid-season?

The club updates the venue hours, re-runs the solver, and publishes again. The same public link then shows the new schedule, and exports like iCal pick up the change.

---

*This post is part of the [Applicaudia blog](https://applicaudia.se/blog/). Applicaudia AB is a one-developer studio in Gothenburg building [CourtPuzzle](https://courtpuzzle.com) for sports club scheduling, among other apps. Read more about the studio's manager tooling in [The Tool I Always Wanted as an Engineering Manager](https://applicaudia.se/blog/loopcloser-the-tool-i-always-wanted/).*
