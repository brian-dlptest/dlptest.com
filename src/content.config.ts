import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Astro 6 content layer. One collection: `news` — data-security industry
// posts ported from the legacy WordPress site, plus future AI-drafted posts.
//
// The schema mirrors the WordPress RSS metadata we already have. `slug` lets
// us preserve the legacy permalinks (each post lives at `/<slug>/`), so SEO
// equity from the old site carries over.
const news = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/news" }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    pubDate: z.coerce.date(),
    categories: z.array(z.string()).default([]),
    excerpt: z.string().default(""),
    heroImage: z.string().url().optional(),
    sourceUrl: z.string().url().optional(),
  }),
});

export const collections = { news };
