import { readFile, readdir } from "node:fs/promises";
import { createCountryChecker } from "../src/lib/country-checker.mjs";

const coverage = JSON.parse(await readFile(new URL("../src/data/country-coverage.json", import.meta.url), "utf8"));
const providerFiles = (await readdir(new URL("../src/content/providers/", import.meta.url))).filter((name) => name.endsWith(".json"));
const providers = await Promise.all(providerFiles.map(async (name) => {
  const provider = JSON.parse(await readFile(new URL(`../src/content/providers/${name}`, import.meta.url), "utf8"));
  return { slug: provider.slug, name: provider.name, model: provider.model };
}));

const checker = createCountryChecker(providers, coverage);
if (checker.results.length !== providers.length) throw new Error("Seller view does not include every provider.");
if (checker.countrySummaries.length !== coverage.countries.length) throw new Error("Country summary does not include every country.");

checker.country = "US";
if (checker.counts.documented !== 15 || checker.counts.review !== 0 || checker.counts.unavailable !== 1) {
  throw new Error("US seller results must show 15 supported providers, no unknowns, and Mollie as the only unavailable provider.");
}
const mollie = checker.results.find((provider) => provider.slug === "mollie");
if (mollie?.status !== "unavailable") throw new Error("Mollie must remain unavailable to US-based sellers.");

checker.country = "IN";
if (checker.counts.documented !== 4 || checker.counts.limited !== 1) throw new Error("India seller counts changed unexpectedly.");

checker.scope = "buyer";
if (checker.results.length !== providers.length || checker.counts.documented < 10) throw new Error("India buyer view is incomplete.");

checker.model = "direct-payments";
if (checker.results.some((provider) => provider.model !== "direct-payments")) throw new Error("Provider type filter failed.");

console.log("Country checker seller, buyer, summary, and provider filters passed.");
