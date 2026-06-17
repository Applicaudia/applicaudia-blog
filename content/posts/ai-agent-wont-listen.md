---
title: "When the AI Agent Won't Listen: A Squash Merge, a Wasted Hour, and Why We Still Need Engineers"
date: "2026-06-24"
excerpt: "An AI agent refused my git method, did its own thing for 45 minutes, then arrived at the exact same result. A war story about squash-merge phantom conflicts, and why senior engineers still matter."
tags: ["AI-assisted development", "git", "agentic", "lessons"]
---

# When the AI Agent Won't Listen: A Squash Merge, a Wasted Hour, and Why We Still Need Engineers

I gave an AI coding agent a specific instruction. Create a branch, run a merge dance there, hand me back the result. The agent refused. It warned me that "stuff would be lost," substituted its own approach, worked for about 45 minutes, and then arrived at the byte-identical answer I had asked for in the first place.

This is that story. It is also a genuine, reusable git technique for a problem that bites everyone who uses squash merges in a team. The lesson is not "agents are bad." The lesson is that when a senior engineer hands you a method, you run it before you decide it is wrong. Agents are not exempt. That is why we still need engineers.

## The Setup: Same Work, Two Histories

A pull request, let us call it `peterson_stretch`, needed to merge into `devel`. Both branches contained the exact same chunk of work, an "instruments delete" feature. But they had absorbed it in two different ways.

`devel` had received that work as a **squash merge**: the entire feature collapsed into a single new commit with no connection to the original commits that built it. `peterson_stretch` had received the same work through a **normal merge**, which preserved the real commit history and the shared ancestry points.

The content was identical. The ancestry was not. Git does not compare file contents to decide whether to merge cleanly. It walks the commit graph. Because the squash threw away the common ancestors, git could no longer see that the work was already present on both sides. It braced for a fight that, content-wise, had already happened.

## What I Asked For

I have hit this before. There is a reliable move. I call it the mom dance.

You create a throwaway branch, say `mom`, from a known-good point. You merge the branch with the **full, real history** into the branch that carries the **squashed** version. This re-attaches the ancestry the squash discarded. Git can now see the shared history again, recognizes the work is already there, and auto-resolves what used to be a wall of conflicts.

The instruction to the agent was simple: create the `mom` branch, do the squash-merge dance there, then merge `mom` into `peterson_stretch`.

## The Refusal

The agent declined. It told me it would not create the `mom` branch and warned that going down that path would lose work.

So it did its own thing. It ran a direct `git merge origin/devel` into `peterson_stretch` and dutifully reported seven conflicting files. It then spent roughly 45 minutes resolving conflicts one by one, committing the result, and verifying tests.

Here is the kicker. When the dust settled, I compared the agent's resolution against the `mom` branch result I had preserved. **Zero diff lines.** Every file the agent had painstakingly resolved matched, byte for byte, the answer the mom dance would have produced in a fraction of the time. The agent's own notes, recorded afterward, captured the convergence plainly: the files it resolved were identical to the direct-merge resolution, with zero lines of difference each.

Worse, of the seven files git flagged, only three had any genuine new content. The other four were already correct on our side. Git reported them as conflicts purely because of the sha divergence. The agent resolved them by taking our version, which changed nothing. Four of the seven "conflicts" were ghosts.

## The Git Technique

Here is the reusable part, independent of any agent.

When a merge throws conflicts but you suspect the two sides already share the same code, test the signal. Diff the pre-change point against the squashed target, on the conflicted files:

```bash
git diff <pre-squash-commit>..<squashed-target> -- path/to/conflicted/file
```

If that diff is **empty**, the content is already the same. The conflict is not real. It is ancestry divergence, the squash having discarded the history git needs to see the match.

The fix is the mom dance. Merge the side that kept the **full history** into the side that took the **squash**. That single merge re-attaches the common ancestors. Re-run the original merge afterward, and the phantom conflicts disappear. Git recognizes the shared history and auto-resolves.

```bash
# from the squashed side
git checkout -b mom <known-good-point>
git merge <full-history-branch>      # re-attach ancestry
git checkout <target-branch>
git merge mom                         # now clean
```

One caveat the hard way: do not trust a single command that crashed mid-run. The agent's first wrong conclusion came from a shell that died before executing, leaving it to report "trivial merge" from empty output. If a command reports success, confirm it actually ran.

## Why We Still Need Engineers

I taught the agent something that day, and it cost us both time. The `mom` branch I had asked for would have produced the same result in minutes. The agent did not lack the capability. It lacked the judgment to run the senior engineer's method before deciding it was wrong.

That is the whole point. Agents are fast, tireless, and genuinely useful. They are also confidently willing to substitute their own approach for yours, sometimes with a warning that your way will lose work. When that happens, the expensive part is not the code. It is the hour spent rediscovering what the human already knew.

We still need engineers because someone has to know which method to trust, when to insist on it, and when to recognize that "stuff would be lost" is sometimes the agent telling you a story instead of a fact.

---

*This post is part of the [Applicaudia blog](https://applicaudia.se/blog/). For more articles and insights from Applicaudia AB, visit [applicaudia.se](https://applicaudia.se).*
