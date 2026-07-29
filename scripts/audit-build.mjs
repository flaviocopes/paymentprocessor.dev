import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

async function walk(directory) {
  const entries = await readdir(directory);
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry);
    return (await stat(path)).isDirectory() ? walk(path) : [path];
  }));
  return nested.flat();
}

const files = await walk(dist);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const routes = new Set(htmlFiles.map((file) => {
  const path = relative(dist, file).split(sep).join("/");
  if (path === "index.html") return "/";
  return `/${path.replace(/index\.html$/, "")}`;
}));

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const route = relative(dist, file);
  assert((html.match(/<h1\b/g) ?? []).length === 1, `${route}: expected exactly one h1.`);
  assert((html.match(/rel="canonical"/g) ?? []).length === 1, `${route}: expected exactly one canonical link.`);
  assert((html.match(/type="application\/ld\+json"/g) ?? []).length === 1, `${route}: expected exactly one JSON-LD block.`);
  assert(!/<img\b(?![^>]*\balt=)[^>]*>/i.test(html), `${route}: image without alt text.`);
  assert(!/<button\b(?![^>]*\btype=)[^>]*>/i.test(html), `${route}: button without an explicit type.`);
  if (html.includes("<table")) assert(html.includes("table-wrap"), `${route}: table is missing a responsive wrapper.`);

  for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    const href = match[1];
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const local = href.split(/[?#]/)[0];
    if (/\.[a-z0-9]+$/i.test(local)) continue;
    const normalized = local === "/" || local.endsWith("/") ? local : `${local}/`;
    assert(routes.has(normalized), `${route}: broken internal link ${href}.`);
  }
}

const contrastPairs = [
  ["#ffffff", "#1717d1", "white on cobalt"],
  ["#d4d4ff", "#1717d1", "light copy on cobalt"],
  ["#aaaaff", "#1717d1", "inverse metadata on cobalt"],
  ["#686886", "#f6f6fc", "muted copy on canvas"],
  ["#73738e", "#ffffff", "metadata on white"]
];
const luminance = (hex) => {
  const channels = hex.match(/[\da-f]{2}/gi).map((value) => parseInt(value, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};
for (const [foreground, background, label] of contrastPairs) {
  const first = luminance(foreground);
  const second = luminance(background);
  const ratio = (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  assert(ratio >= 4.5, `${label}: contrast ratio ${ratio.toFixed(2)} is below 4.5:1.`);
}

const sitemap = await readFile(resolve(dist, "sitemap.xml"), "utf8");
for (const route of routes) assert(sitemap.includes(`https://paymentprocessor.dev${route}`), `sitemap: missing ${route}.`);

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Audited ${htmlFiles.length} built pages: headings, canonicals, JSON-LD, internal links, responsive tables, controls, sitemap, and core color contrast.`);
