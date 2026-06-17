---
name: write-blog-post
description: Interactive blog post creation for applicaudia.se/blog/. Grills user for inspiration, drafts markdown articles with front-matter, saves to blog/content/posts/. Use when user says "write blog post", "new article", "blog post", or "create article" for the Applicaudia blog.
---

# Write Blog Post (Applicaudia Blog)

Interactive markdown blog post creation for **applicaudia.se/blog/**. Three phases: **Grill** → **Draft** → **Save**.

> **Workflow:** Drafts are saved as markdown files with front-matter to `blog/content/posts/{slug}.md`. Commit → GitHub Actions auto-deploys to applicaudia.se/blog/.

## Phase 1: Grill (Gather Inspiration)

Interview the user to nail down the article concept. **CRITICAL: Ask exactly ONE question at a time. Wait for the user's answer before asking the next question.** Never batch multiple questions into a single message.

### Questions to ask (in order):

1. **Topic & angle:** "What's this about? A technical deep-dive, tutorial, opinion piece, Applicaudia update, or industry commentary?"
2. **Audience:** "Who is this for? Developers, technical decision-makers, general readers, or a specific niche?"
3. **Key phrase:** Suggest 2–3 candidate focus keyphrases. Ask the user to pick one.
4. **Key points:** "List 3–5 key points you want to cover. Don't worry about order."
5. **Length target:** "Short (~500 words), medium (~1000 words), or long (~2000+ words)?"
6. **Publish timing:** "Publish now (date = today), or schedule for a future date?" If scheduling, confirm the exact date and remind them it goes live at 00:00 UTC on that date (02:00 Sweden summer time), and only on the next weekly CI rebuild after that (so up to ~7 days later). See **Scheduling posts** below.

After gathering all answers, summarize back to the user and confirm before drafting.

## Phase 2: Draft

### Writing Rules (Non-Negotiable)

**Structure:**
- Title as H1 (only one H1)
- Introduction paragraph
- Subheadings (H2, H3) for structure
- Code blocks for technical content
- FAQ section (optional but recommended)

**Front-matter:**
```yaml
---
title: "Post Title"
date: "YYYY-MM-DD"
excerpt: "Brief description for listing page"
tags: ["tag1", "tag2", "tag3"]
---
```

The `date` field controls **go-live**, not just display order:
- `date` today or earlier → post is live on the next build.
- `date` in the future → post is **excluded from the build entirely** (not just hidden). It goes live at the first weekly CI rebuild on/after that date. See **Scheduling posts** below.

**Content:**
- Clear, direct sentences
- Technical depth over marketing fluff
- Exact numbers and specific examples
- Code samples where applicable
- Internal links to other Applicaudia content

**Style:**
- Professional but accessible
- No em-dashes (—) — use commas, semicolons, or parentheses
- Humble tone — solo builder voice, not corporate marketing
- Positive framing — lead with what something does, not what it doesn't

### Draft Format

```markdown
---
title: "Post Title"
date: "2026-06-17"
excerpt: "Brief description for listing page and social sharing"
tags: ["tag1", "tag2", "tag3"]
---

# Post Title

[Introduction paragraph — what this covers and why it matters.]

## Section

[Content with examples and technical depth.]

\`\`\`language
[Code blocks for technical content]
\`\`\`

## Another Section

[Content.]

## FAQ

### Question 1?
[Direct answer.]

### Question 2?
[Direct answer.]

---

*This post is part of the [Applicaudia blog](https://applicaudia.se/blog/). For more articles and insights from Applicaudia AB, visit [applicaudia.se](https://applicaudia.se).*
```

## Phase 3: Save

### Generate Slug

Generate a URL-safe slug from the title:
- Lowercase
- Replace spaces with hyphens
- Remove special characters
- Keep under 50 characters

Example: "Building a Strobe Tuner with Web Audio API" → `building-strobe-tuner-web-audio-api`

### Save to Content Directory

Save the markdown file to `blog/content/posts/{slug}.md`.

**Naming convention:** Use `YYYY-MM-DD-{slug}.md` for easier sorting if preferred, or just `{slug}.md`.

## After Publishing

**Deployment workflow:**
1. Article saved to `blog/content/posts/{slug}.md`
2. Commit to blog repo: `git add content/posts/{slug}.md && git commit -m "article: {title}"`
3. Push to main branch: `git push`
4. GitHub Actions automatically builds and deploys to applicaudia.se/blog/
5. Article live at applicaudia.se/blog/{slug}/ within minutes

**For scheduled (future-dated) posts:** steps 1–3 are the same, but the post is NOT in the deployed bundle yet. It appears only after the first weekly CI rebuild on/after the post's `date`. Tell the user the expected go-live window. The post stays invisible (excluded from the build, no leak) until then.

## Scheduling posts (future publish date)

This blog supports scheduling via the `date` front-matter field. Set `date` to a future day and the post is held back automatically.

**How it works (build-time exclusion):**
- A pre-build script (`blog/scripts/filter-scheduled.ts`) runs before every `bun run build`. It reads each post's `date`, and moves any post whose date is still in the future out of `content/posts/` into a staging dir, then restores them after the build.
- Because Vite's `import.meta.glob` only bundles what's in `content/posts/`, a future-dated post's content never ships in the JS bundle. No leak via view-source or devtools.
- In local `bun run dev` the filter does not run, so all posts (including upcoming ones) are visible while writing.
- Go-live is driven by the weekly CI rebuild (`cron: "17 3 * * 1"` in `blog/.github/workflows/cd.yml`). A post dated, say, Wednesday goes live on the following Monday's build.

**Cutoff timezone:** `date: "YYYY-MM-DD"` is parsed as **UTC midnight**. A post dated `2026-07-01` goes live at `2026-07-01T00:00:00Z` (02:00 Sweden summer time). If the user wants it live earlier in a given timezone, set the date one day earlier.

**Authoring a scheduled post:** just write the file with a future `date` and commit to `main`. No flags, no separate draft field. To force a scheduled post live sooner than the weekly cron, push any commit to `main` (a manual `workflow_dispatch` run builds but does not deploy).

## Content Ideas

**Technical topics:**
- Web Audio API tutorials
- React + Vite patterns
- TypeScript best practices
- CI/CD workflows
- Security fundamentals

**App-adjacent topics:**
- Software development practices
- Cybersecurity basics
- Mobile/web development
- Developer tools and workflows

**Studio updates:**
- New app launches
- Feature deep-dives
- Technical challenges solved
- Development insights

## SEO Notes (Optional)

If SEO optimization is desired:
- Include target keyphrase in title, first paragraph, and one subheading
- Use descriptive excerpt (120-156 characters)
- Add relevant tags (3-5)
- Internal link to other Applicaudia content where relevant

## Context Files

| File | Purpose |
|------|---------|
| `blog/content/posts/` | Where articles are saved |
| `blog/src/utils/markdown.ts` | Markdown processing pipeline |
| `blog/src/components/BlogPost.tsx` | React markdown renderer |
