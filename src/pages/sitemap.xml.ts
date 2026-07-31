import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const staticRoutes = [
  "/",
  "/start/",
  "/merchant-of-record/",
  "/payment-processors/",
  "/compare/",
  "/compare/merchant-of-record/",
  "/companies/",
  "/changelog/",
  "/migrations/",
  "/tools/provider-matcher/",
  "/tools/country-checker/",
  "/tools/effective-cost/",
  "/tools/migration-decision/",
  "/methodology/",
  "/learn/",
  "/stories/",
  "/glossary/"
];

const xmlEscape = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

export const GET: APIRoute = async ({ site }) => {
  if (!site) return new Response("Site URL is not configured.", { status: 500 });

  const [providers, comparisons, guides] = await Promise.all([
    getCollection("providers"),
    getCollection("comparisons"),
    getCollection("guides")
  ]);
  const dynamicRoutes = [
    ...providers.map((entry) => `/providers/${entry.data.slug}/`),
    ...comparisons.map((entry) => `/compare/${entry.data.slug}/`),
    ...guides.map((entry) => `/guides/${entry.data.slug}/`)
  ];
  const routes = [...staticRoutes, ...dynamicRoutes].sort();
  const body = routes
    .map((route) => `  <url><loc>${xmlEscape(new URL(route, site).toString())}</loc></url>`)
    .join("\n");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
};
