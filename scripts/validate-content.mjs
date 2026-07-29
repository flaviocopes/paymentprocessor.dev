import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const providerDirectory = resolve(root, "src/content/providers");
const candidatePath = resolve(root, "src/data/research-candidates.json");
const comparisonDirectory = resolve(root, "src/content/comparisons");
const guideDirectory = resolve(root, "src/content/guides");
const migrationPath = resolve(root, "src/content/migration-links.json");
const calculatorPath = resolve(root, "src/data/calculator-rules.json");
const fieldStoriesPath = resolve(root, "src/content/field-stories.json");
const companyIntelligencePath = resolve(root, "src/content/company-intelligence.json");
const countryCoveragePath = resolve(root, "src/data/country-coverage.json");
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const reviewDate = process.env.EDITORIAL_REVIEW_DATE ?? new Date().toISOString().slice(0, 10);

const files = (await readdir(providerDirectory)).filter((file) => file.endsWith(".json")).sort();
const providers = await Promise.all(files.map(async (file) => ({
  file,
  data: JSON.parse(await readFile(resolve(providerDirectory, file), "utf8"))
})));

assert(providers.length === 16, `Expected 16 provider profiles; found ${providers.length}.`);
assert(providers.filter(({ data }) => data.model === "merchant-of-record").length === 8, "Expected 8 Merchant of Record profiles.");
assert(providers.filter(({ data }) => data.model === "direct-payments").length === 8, "Expected 8 direct-payment profiles.");

const slugs = new Set();
const names = new Set();
for (const { file, data } of providers) {
  assert(data.slug === file.replace(/\.json$/, ""), `${file}: slug must match filename.`);
  assert(!slugs.has(data.slug), `${file}: duplicate slug ${data.slug}.`);
  assert(!names.has(data.name), `${file}: duplicate provider name ${data.name}.`);
  slugs.add(data.slug);
  names.add(data.name);

  const expectedSeller = data.model === "merchant-of-record" ? "provider" : "merchant";
  assert(data.legalSeller === expectedSeller, `${file}: legalSeller must be ${expectedSeller}.`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(data.lastReviewed), `${file}: invalid lastReviewed.`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(data.nextReview), `${file}: invalid nextReview.`);
  assert(data.nextReview > data.lastReviewed, `${file}: nextReview must follow lastReviewed.`);
  assert(data.lastReviewed <= reviewDate, `${file}: lastReviewed is in the future.`);
  assert(data.nextReview >= reviewDate, `${file}: editorial review is overdue.`);
  assert(data.sources.length >= 2, `${file}: fewer than two sources.`);
  assert(data.responsibilities.length >= 4, `${file}: responsibility matrix is incomplete.`);
  assert(data.strengths.length >= 3 && data.limitations.length >= 3, `${file}: pros/cons are incomplete.`);

  const sourceIds = new Set();
  for (const source of data.sources) {
    assert(source.url.startsWith("https://"), `${file}: source must use HTTPS.`);
    assert(source.reviewedOn === data.lastReviewed, `${file}: ${source.id} review date is stale.`);
    assert(!sourceIds.has(source.id), `${file}: duplicate source id ${source.id}.`);
    assert(!/[?&](ref|aff|affiliate)=/i.test(source.url), `${file}: affiliate parameter found in source URL.`);
    sourceIds.add(source.id);
  }
  for (const sourceId of data.pricing.sourceIds) {
    assert(sourceIds.has(sourceId), `${file}: unknown pricing source ${sourceId}.`);
  }
  if (data.pricing.kind === "contradictory" || data.pricing.kind === "negotiated") {
    assert(data.pricing.percentage === null && data.pricing.fixed === null, `${file}: uncertain pricing must not expose an exact formula.`);
  }
}

const candidates = JSON.parse(await readFile(candidatePath, "utf8"));
assert(candidates.length === 2, `Expected 2 research candidates; found ${candidates.length}.`);
for (const candidate of candidates) {
  assert(candidate.status === "research-candidate", `${candidate.slug}: candidate status is invalid.`);
  assert(!slugs.has(candidate.slug), `${candidate.slug}: candidate is already in the launch catalog.`);
  assert(candidate.sources.length >= 2, `${candidate.slug}: candidate needs at least two starting sources.`);
}

const readJsonDirectory = async (directory) => Promise.all(
  (await readdir(directory)).filter((file) => file.endsWith(".json")).sort().map(async (file) => ({
    file,
    data: JSON.parse(await readFile(resolve(directory, file), "utf8"))
  }))
);

const comparisons = await readJsonDirectory(comparisonDirectory);
assert(comparisons.length === 4, `Expected 4 launch comparisons; found ${comparisons.length}.`);
for (const { file, data } of comparisons) {
  assert(data.slug === file.replace(/\.json$/, ""), `${file}: comparison slug must match filename.`);
  assert(data.providers.length === 2 && data.providers[0] !== data.providers[1], `${file}: comparison pair is invalid.`);
  for (const slug of data.providers) assert(slugs.has(slug), `${file}: unknown provider ${slug}.`);
  for (const scenario of data.scenarios) assert(data.providers.includes(scenario.choose), `${file}: scenario recommends a provider outside the pair.`);
  assert(data.sources.length >= 2 && data.sources.every((url) => url.startsWith("https://")), `${file}: comparison sources are incomplete.`);
}

const guides = await readJsonDirectory(guideDirectory);
assert(guides.length === 13, `Expected 13 practical guides; found ${guides.length}.`);
const guideSlugs = new Set(guides.map(({ data }) => data.slug));
for (const { file, data } of guides) {
  assert(data.slug === file.replace(/\.json$/, ""), `${file}: guide slug must match filename.`);
  assert(data.sections.length >= 3, `${file}: guide needs at least three sections.`);
  assert(data.category && data.readingTime, `${file}: guide needs category and reading time.`);
  assert(data.takeaways?.length >= 3, `${file}: guide needs at least three takeaways.`);
  assert(data.decisionChecklist?.length >= 4, `${file}: guide needs a decision checklist.`);
  for (const source of data.sources) {
    assert(source.url.startsWith("https://"), `${file}: guide source must use HTTPS.`);
    assert(source.reviewedOn === data.lastReviewed, `${file}: guide source review date is stale.`);
  }
}

const fieldStories = JSON.parse(await readFile(fieldStoriesPath, "utf8"));
assert(fieldStories.length >= 15, `Expected at least 15 field stories; found ${fieldStories.length}.`);
const fieldStoryIds = new Set();
for (const story of fieldStories) {
  assert(!fieldStoryIds.has(story.id), `${story.id}: duplicate field story.`);
  fieldStoryIds.add(story.id);
  assert(story.url.startsWith("https://"), `${story.id}: field story URL must use HTTPS.`);
  assert(story.summary.length >= 60 && story.caveat.length >= 30, `${story.id}: summary or caveat is too thin.`);
  assert(story.reviewedOn <= reviewDate, `${story.id}: field story review date is in the future.`);
  for (const slug of story.relatedGuides) assert(guideSlugs.has(slug), `${story.id}: unknown related guide ${slug}.`);
  for (const slug of story.providerSlugs) assert(slugs.has(slug), `${story.id}: unknown related provider ${slug}.`);
}

const companyIntelligence = JSON.parse(await readFile(companyIntelligencePath, "utf8"));
assert(companyIntelligence.length === 15, `Expected 15 company records; found ${companyIntelligence.length}.`);
const companyIds = new Set();
const coveredProviderSlugs = new Map();
for (const company of companyIntelligence) {
  assert(!companyIds.has(company.id), `${company.id}: duplicate company record.`);
  companyIds.add(company.id);
  assert(company.sources.length >= 2, `${company.id}: company record needs at least two sources.`);
  assert(company.lastReviewed <= reviewDate, `${company.id}: company review date is in the future.`);
  assert(company.nextReview > company.lastReviewed, `${company.id}: next company review must follow last review.`);
  assert(company.nextReview >= reviewDate, `${company.id}: company review is overdue.`);
  assert(company.financials.metrics.length >= 1, `${company.id}: financial snapshot is empty.`);
  assert(company.leaders.length >= 1 && company.founders.length >= 1, `${company.id}: leadership history is incomplete.`);
  for (const source of company.sources) {
    assert(source.url.startsWith("https://"), `${company.id}: company source must use HTTPS.`);
    assert(source.reviewedOn === company.lastReviewed, `${company.id}: ${source.id} review date is stale.`);
  }
  for (const slug of company.providerSlugs) {
    assert(slugs.has(slug), `${company.id}: unknown provider ${slug}.`);
    coveredProviderSlugs.set(slug, (coveredProviderSlugs.get(slug) ?? 0) + 1);
  }
}
for (const slug of slugs) assert(coveredProviderSlugs.get(slug) === 1, `${slug}: provider must map to exactly one company record.`);

const migrationLinks = JSON.parse(await readFile(migrationPath, "utf8"));
const migrationPlatforms = ["FastSpring", "Gumroad", "Paddle", "Polar", "Stripe Billing", "Stripe Managed Payments"];
const expectedMigrationIds = new Set(migrationPlatforms.flatMap((source) => migrationPlatforms
  .filter((destination) => destination !== source)
  .map((destination) => `${source.toLowerCase().replaceAll(" ", "-")}-to-${destination.toLowerCase().replaceAll(" ", "-")}`)));
assert(migrationLinks.length === 30, `Expected 30 migration links; found ${migrationLinks.length}.`);
const migrationIds = new Set();
for (const link of migrationLinks) {
  assert(!migrationIds.has(link.id), `${link.id}: duplicate migration link.`);
  migrationIds.add(link.id);
  assert(expectedMigrationIds.has(link.id), `${link.id}: route is outside the six-platform matrix.`);
  assert(link.path === `https://migratingto.dev/guides/${link.id}`, `${link.id}: canonical playbook URL does not match the route.`);
  assert(link.status === "available", `${link.id}: linked playbook is not available.`);
  assert(link.lastReviewed <= reviewDate, `${link.id}: migration review date is in the future.`);
}
for (const id of expectedMigrationIds) assert(migrationIds.has(id), `${id}: migration route is missing.`);

const calculatorRules = JSON.parse(await readFile(calculatorPath, "utf8"));
assert(calculatorRules.length === 13, `Expected 13 calculator formulas; found ${calculatorRules.length}.`);
const calculatorSlugs = new Set();
for (const rule of calculatorRules) {
  assert(!calculatorSlugs.has(rule.slug), `${rule.slug}: duplicate calculator formula.`);
  calculatorSlugs.add(rule.slug);
  const provider = providers.find(({ data }) => data.slug === rule.slug)?.data;
  assert(Boolean(provider), `${rule.slug}: calculator references an unknown provider.`);
  if (!provider) continue;
  assert(provider.model === rule.model, `${rule.slug}: calculator model does not match profile.`);
  assert(provider.pricing.percentage === rule.percentage, `${rule.slug}: calculator percentage differs from the reviewed base price.`);
  assert(provider.pricing.fixed === rule.fixed, `${rule.slug}: calculator fixed fee differs from the reviewed base price.`);
  assert(provider.sources.some((source) => source.url === rule.source), `${rule.slug}: calculator source is not in the provider evidence record.`);
  assert(rule.reviewedOn === provider.lastReviewed, `${rule.slug}: calculator formula is stale relative to the provider profile.`);
}

const countryCoverage = JSON.parse(await readFile(countryCoveragePath, "utf8"));
assert(countryCoverage.countries.length >= 10, "Country checker needs at least ten common business countries.");
assert(countryCoverage.providers.length === providers.length, `Country checker must cover all ${providers.length} providers.`);
const coverageSlugs = new Set();
const countryCodes = new Set(countryCoverage.countries.map((country) => country.code));
for (const record of countryCoverage.providers) {
  assert(slugs.has(record.slug), `${record.slug}: country checker references an unknown provider.`);
  assert(!coverageSlugs.has(record.slug), `${record.slug}: duplicate country checker record.`);
  coverageSlugs.add(record.slug);
  for (const [scope, data] of [["seller", record], ["buyer", record.buyer]]) {
    assert(Boolean(data), `${record.slug}: ${scope} country coverage is missing.`);
    if (!data) continue;
    assert(data.source.startsWith("https://"), `${record.slug}: ${scope} country evidence must use HTTPS.`);
    assert(data.note.length >= 30, `${record.slug}: ${scope} country note is too thin.`);
    const classifiedCodes = [...data.documented, ...data.limited, ...data.unavailable];
    assert(new Set(classifiedCodes).size === classifiedCodes.length, `${record.slug}: a country cannot have more than one ${scope} status.`);
    for (const code of classifiedCodes) {
      assert(countryCodes.has(code), `${record.slug}: ${scope} checker uses unknown country code ${code}.`);
    }
  }
}
for (const slug of slugs) assert(coverageSlugs.has(slug), `${slug}: country checker record is missing.`);

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

const sourceCount = providers.reduce((count, { data }) => count + data.sources.length, 0);
console.log(`Validated ${providers.length} providers, ${companyIntelligence.length} company records, ${comparisons.length} comparisons, ${guides.length} guides, ${fieldStories.length} field stories, ${calculatorRules.length} formulas, ${migrationLinks.length} migration routes, ${countryCoverage.countries.length} country scenarios, and ${candidates.length} research candidates across ${sourceCount} dated provider sources.`);
