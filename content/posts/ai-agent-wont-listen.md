---
title: "When the AI Agent Won't Listen: A Squash Merge, a Wasted Hour, and Why I Still Need Engineers"
date: "2026-06-24"
excerpt: "An AI agent refused my git method, did its own thing for 45 minutes, then arrived at the exact same result. A war story about squash-merge phantom conflicts, and why senior engineers still matter."
tags: ["AI-assisted development", "git", "agentic", "lessons"]
---

# When the AI Agent Won't Listen: A Squash Merge, a Wasted Hour, and Why I Still Need Engineers

I gave an AI coding agent a specific instruction. Create a branch, run a merge dance there, and hand me back the result. The agent refused. It warned me that "stuff would be lost" and substituted its own approach. It worked for about 45 minutes, only to arrive at the exact answer I had asked for in the first place.

This is that story. It is also a genuine, reusable git technique for a problem that bites everyone who uses squash merges in a team. The lesson is not "agents are bad." Rather, when a senior engineer hands you a method, you run it before assuming it is wrong. Agents are not exempt from this discipline. That is why we still need engineers.

## The Setup: Same Work, Two Histories

A pull request, let us call it `peterson_stretch`, needed to merge into `devel`. Both branches contained the exact same chunk of work, an "instruments delete" feature. But they had absorbed it in two different ways.

`devel` had received that work as a **squash merge**. The entire feature was collapsed into a single commit with no connection to the original commits that built it. Meanwhile, `peterson_stretch` had received the same work through a **normal merge**, which preserved the real commit history and shared ancestry.

The content was identical. However, the ancestry was not. Git does not compare file contents to decide whether to merge cleanly. Instead, it walks the commit graph. Because the squash threw away common ancestors, git could no longer see that the work was already present on both sides. Consequently, it braced for a conflict that, content-wise, was already resolved.

## What I Asked For

I have hit this before. There is a reliable move that I call the mom dance.

You create a throwaway branch, say `mom`, from a known-good point. Then you merge the branch with the **full, real history** into the branch that carries the **squashed** version. This re-attaches the ancestry the squash discarded. Git can now see the shared history again. Because it recognizes the work is already there, it auto-resolves what used to be a wall of conflicts.

The instruction to the agent was simple: create the `mom` branch, do the squash-merge dance there, then merge `mom` into `peterson_stretch`.

## The Refusal

The agent declined. It told me it would not create the `mom` branch and warned that going down that path would lose work.

So it did its own thing. It ran a direct `git merge origin/devel` into `peterson_stretch` and dutifully reported seven conflicting files. Then it spent roughly 45 minutes resolving conflicts one by one, committing the result, and verifying tests.

Here is the kicker. When the dust settled, I compared the agent's resolution against the `mom` branch result I had preserved. **Zero diff lines.** Every file the agent had painstakingly resolved matched the mom dance byte for byte. The agent's own post-mortem notes confirmed the convergence: its files matched the direct-merge resolution with zero lines of difference.

Worse, of the seven files git flagged, only three had any genuine new content. The other four were already correct on our side. Git reported them as conflicts purely because of sha divergence. The agent resolved them by taking our version, which changed nothing. Therefore, four of the seven "conflicts" were ghosts.

## The Git Technique

Here is the reusable part, independent of any agent.

When a merge throws conflicts but you suspect both sides already share the same code, test the signal. Diff the pre-change point against the squashed target on the conflicted files:

```bash
git diff <pre-squash-commit>..<squashed-target> -- path/to/conflicted/file
```

If that diff is **empty**, the content is already identical. The conflict is not real. Instead, it is pure ancestry divergence caused by the squash discarding history.

The fix is the mom dance. Merge the side that kept the **full history** into the side that took the **squash**. That single merge re-attaches the common ancestors. Re-run the original merge afterward, and the phantom conflicts disappear as git auto-resolves.

```bash
# from the squashed side
git checkout -b mom <known-good-point>
git merge <full-history-branch>      # re-attach ancestry
git checkout <target-branch>
git merge mom                         # now clean
```

One caveat learned the hard way: do not trust a command that crashed mid-run. The agent's first wrong conclusion came from a shell that died before executing, leaving it to report "trivial merge" from empty output. So if a command reports success, confirm it actually ran.

## Why We Still Need Engineers

I taught the agent something that day, and it cost us both time. The `mom` branch I requested would have produced the same result in minutes. The agent did not lack technical capability. It lacked the judgment to run a senior engineer's method before deciding it was wrong.

That is the whole point. Agents are fast, tireless, and genuinely useful. However, they are also confidently willing to substitute their own approach for yours, sometimes warning that your way will lose work. When that happens, the expensive part is not the code. It is the hour spent rediscovering what the human already knew.

We still need engineers because someone has to know which method to trust and when to insist on it. Engineers recognize when "stuff would be lost" is hallucinated caution rather than fact.

---

*This post is part of the [Applicaudia blog](https://applicaudia.se/blog/). For more articles on app development and engineering, visit [applicaudia.se](https://applicaudia.se).*
