---
title: "AI Agents Create Tech Debt: Why Engineers Must Force the Cleanup"
date: "2026-10-07"
excerpt: "A paywall shipped three bugs that were all the same debt wearing different hats. A war story about how AI agents layer slop on slop, and the review-gate workflow that forced the cleanup."
tags: ["AI-assisted development", "tech debt", "agentic", "lessons", "code review"]
---

# AI Agents Create Tech Debt: Why Engineers Must Force the Cleanup

Last week my paywall shipped three bugs at once. A literal `[object Object]` rendered at the bottom of the purchase screen after sign-in. A customer who signed in and received their legacy premium status immediately got the paywall thrown back in their face. And two different thank-you messages, each ending in a 🙏 emoji, rendered on top of each other.

Three bugs, one root cause: months of AI-agent patches, each one locally correct, had built a purchasing flow where nobody owned the truth. That is the shape of AI-agent tech debt: no single bad decision, just accumulation. So instead of a fourth patch, I stopped the line: designed a real state machine, and built review gates the work had to survive. This is that story, and the lesson in it is blunt: agents will happily layer slop on slop forever. You, the engineer, have to take charge and force the cleanup.

## How Slop Accumulates: The Commit Archaeology

The best evidence is git history. Watch what happens to one component, `web-paywall.tsx`, over four days:

Commit `39c191ee` (Oct 3) added inline sign-in to the web paywall. A signed-out user who taps upgrade gets a sign-in modal, and after sign-in the component resumes the abandoned checkout. Reasonable feature. The implementation armed a React ref (`pendingCheckoutRef`) and added a resume effect watching the auth state. That was now the second place in the component that decided whether checkout should proceed.

Commit `83c6eb2e` (Oct 4) fixed the email-link sign-in case: the full-page redirect remounts the component, and the ref dies with it. So a second persistence mechanism appeared, a `sessionStorage` key, armed when the gate opens and consumed by the same resume effect. Two sources of truth for "a checkout was pending" in one component, both correct in isolation.

Meanwhile, elsewhere in the codebase, the entitlement model was quietly degrading. An earlier commit had introduced a `legacySupporter` boolean in redux, derived from a Firestore field. Sounds harmless. But over time, code paths started reading it as if it meant "this user has paid access", which it never did. It was a copy flag for a thank-you message.

The deepest cut was a single line in `entitlement_sync.ts`:

```typescript
Store.inst().store.dispatch(Dispatch.setFirestorePremium(hasPaidAccess(currentDoc, currentSurface(), now)));
```

The backend maintains a full grant map per user: which surfaces (iOS, Android, web, DAW) they bought, expiry, grant reason. This line collapsed all of it into one platform-filtered boolean before it entered the client state. After that, downstream code could no longer ask what the user was actually entitled to. It got a yes or a no, and nothing else. Every future feature that needed a real answer had to re-derive one from the RevenueCat SDK, each with its own subtly different logic.

That is how agents build slop. Nobody writes `// TODO: make this incoherent`. Each change solves the bug in front of it, each diff passes review, and the data model underneath rots a little more.

## The Bugs Were the Debt Speaking

All three traced back to the same rot. The bugs just surfaced it in three different places.

**`[object Object]` in the error message.** The web RevenueCat SDK throws errors with a numeric `errorCode`, or sometimes plain objects. Somewhere a handler did the JavaScript default thing, stringifying a non-string. The paywall's own error mapper re-derived cancel detection from that numeric code with regex heuristics. The shared mapper it should have used reads a `.code` field that only the mobile SDK produces. Two platforms threw differently shaped errors, so the paywall had grown a second mapper and nobody owned either one.

**The paywall that would not stay closed.** A legacy supporter signs in, the server grants their premium, and the paywall reopens anyway. The gate logic read state that had been captured before an `await`, and the grant map it needed had been collapsed to that boolean. The information to make the right decision existed. The architecture had thrown it away one line before the decision.

**The double thank-you.** Two translation keys, one rendered unconditionally, one rendered when `legacySupporter` was true. An exclusive ternary that someone, at some point, had flattened into an AND.

## Taking Charge: Kill the Plans Cheaply

My first instinct was the agent instinct too: patch the three symptoms. Write a fix for the error mapping, add a re-check after sign-in, swap the AND for a ternary. Ship it Friday.

I wrote a plan instead, and made the agents attack it. Three times, review agents tore the plan apart. Revision one's gate could deadlock against the sign-in flow; killed. Revision two's recheck had a hole for in-flight purchases; killed. Revision three's surface-detection strategy was wrong; killed. Each revision cost an afternoon, not a sprint.

By revision four the plan had become something better than a bug-fix list: a checkout state machine where a reducer owns every legal transition and a saga owns every side effect. Every async fact carries a flow ID so stale results get dropped instead of applied. A bigger model, designed at another model's higher reasoning tier, then reviewed again before anyone touched code.

That is the first half of taking charge: never let the first plan that sounds right ship. Make something try to destroy it first. Plans are the cheapest thing in software to rewrite. I have told a related war story before, in [When the AI Agent Won't Listen](https://applicaudia.se/blog/ai-agent-wont-listen/); this is the same fight one layer up.

## Gates That Catch What Humans Miss

The second half: no work ships until it survives adversarial review, and every verdict gets recorded. Our workflow runs a fresh review agent before and after every implementation stage, each with a different lens: correctness, over-engineering, and a re-verification pass over the fixes.

On this one milestone, the gates caught four things no casual review would have:

**The error-code collision.** The web SDK defines cancel error code `1`. It also defines `ErrorChargingPayment = 1`, on a different error class thrown by the purchase flow itself. Our gate reviewer read the SDK type definitions and found the collision. A failed payment charge would have been classified as "user cancelled", the error would have been suppressed, and the customer charged with nothing to show for it. The fix shape-detects the flow error and maps it as what it is, a failed charge.

**The unawaited promise.** The paywall wrapper had been returning the SDK's promise without `await` since it was written. An `async` function that returns a promise instead of awaiting it looks fine, type-checks fine, and silently routes every rejection around the try/catch that was supposed to handle it.

**The test that mocked the wrong SDK.** The test suite had a mock resolving against a different physical copy of the SDK than the production code loads (nested `node_modules` resolution). Sixteen tests passed for the wrong reason.

**The second truth table.** The over-engineering gate, the one that asks what to delete, found I had written a second copy of the entitlement truth table while cleaning up the first. It was right. I deleted the new module and consolidated into the shared header instead.

Every one of these is documented in a gate table with the agent, date, findings, and resolution. The audit trail is the artifact. When someone asks six months from now why the error mapper shape-detects flow errors, the answer is in the file, with the date.

## What Paying Down the AI Tech Debt Looked Like

The first milestone of the epic landed as one commit:

- the grant map now flows into client state verbatim, instead of being collapsed to a boolean
- a single `hasPaidGrants()` function in the shared header owns the entitlement truth table
- the restore path and the paywall share one error normalizer
- the cancelled-payment case is its own kind instead of a string-matching guess

All 759 jest tests, 523 vitest tests, and two TypeScript configs green. The remaining milestones wire the state machine in, one commit at a time, each green.

The three user-facing bugs? The `[object Object]` is gone because one mapper owns error classification and it cannot produce that string. The double thanks is a ternary, scheduled with the mobile migration. The paywall reopen dies with the state machine, when the gate reads state after its last await instead of before. The symptoms were the cheap part. Rebuilding the data model underneath them was the job.

## The Rules I Now Apply

After this epic, my standing rules for agentic development look like this:

1. **Reviews kill plans before code exists.** Three dead plan revisions cost less than one wrong implementation. If nobody attacked the plan, it is not a plan, it is a guess.
2. **Every symptom patch must answer "what is the underlying data model?"** If the fix cannot be stated in terms of the data model, it is a patch on a patch, and it goes in the tech-debt ledger instead of the branch. That ledger currently holds 106 entries and climbing.
3. **Gates are fresh, adversarial, and recorded.** A reviewer that has never seen the code, with one job (correctness, or deletion, or verification), before and after every stage. Verdicts land in a table, not in chat scrollback.
4. **Symptoms get triaged, not shipped.** Three paywall bugs became one epic because the symptoms shared a cause. Fixing them individually would have fixed none of them.

The agents did nothing wrong, exactly. Every commit was defensible. That is the trap: seven consecutive reasonable pull requests, and every one of them defensible, while the ground under them turns to sand. Only the engineer with the whole data model in their head can stop and say: this is sand, and here is how we dig out.

## FAQ

### Do AI coding agents really create more tech debt than human developers?

They create a different shape of it. Agents are tireless, locally-reasoning patch writers: given a bug, they produce a fix that is correct for that bug in that context. What they rarely do, unprompted, is push back and redesign the layer that generated the bug. Humans do that badly too, but agents will do it forever without complaint, which makes the accumulation faster.

### How do you review AI-generated code effectively?

With other agents, adversarially, before and after implementation, and with each reviewer carrying one narrow lens. A correctness reviewer that also worries about over-engineering does neither well. Then record every verdict in a durable file so the reasoning survives the session.

### What is the fastest way to pay down AI-generated tech debt?

Find the data model underneath the symptoms and centralize it. In our case, one collapsed boolean was feeding five different decision points; restoring the full grant map and writing one truth function deleted whole categories of defensive code. A patch on a broken model just adds another place the broken model leaks. Fix the model once and the defensive code downstream can be deleted.

---

*This post is part of the [Applicaudia blog](https://applicaudia.se/blog/). For more articles and insights from Applicaudia AB, visit [applicaudia.se](https://applicaudia.se).*
