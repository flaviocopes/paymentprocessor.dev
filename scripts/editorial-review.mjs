import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const reviewDate = process.env.EDITORIAL_REVIEW_DATE ?? new Date().toISOString().slice(0, 10);
const providerDirectory = resolve(root, "src/content/providers");
const providerFiles = (await readdir(providerDirectory)).filter((file) => file.endsWith(".json"));
const providers = await Promise.all(providerFiles.map(async (file) => JSON.parse(await readFile(resolve(providerDirectory, file), "utf8"))));
const calculatorRules = JSON.parse(await readFile(resolve(root, "src/data/calculator-rules.json"), "utf8"));
const migrationLinks = JSON.parse(await readFile(resolve(root, "src/content/migration-links.json"), "utf8"));
const fieldStories = JSON.parse(await readFile(resolve(root, "src/content/field-stories.json"), "utf8"));
const companyIntelligence = JSON.parse(await readFile(resolve(root, "src/content/company-intelligence.json"), "utf8"));
const today = new Date(`${reviewDate}T00:00:00Z`);
const daysUntil = (date) => Math.ceil((new Date(`${date}T00:00:00Z`) - today) / 86_400_000);

const dueProviders = providers
  .map((provider) => ({ name: provider.name, date: provider.nextReview, days: daysUntil(provider.nextReview) }))
  .filter((item) => item.days <= 30)
  .sort((a, b) => a.days - b.days);
const oldestCalculatorReview = calculatorRules.map((rule) => rule.reviewedOn).sort()[0];
const oldestMigrationReview = migrationLinks.map((link) => link.lastReviewed).sort()[0];
const dueCompanies = companyIntelligence
  .map((company) => ({ name: company.name, date: company.nextReview, days: daysUntil(company.nextReview) }))
  .filter((item) => item.days <= 30)
  .sort((a, b) => a.days - b.days);

console.log(`# Editorial review report — ${reviewDate}`);
console.log(`\nProvider profiles: ${providers.length}`);
console.log(`Company records: ${companyIntelligence.length}`);
console.log(`Calculator formulas: ${calculatorRules.length} (oldest review ${oldestCalculatorReview})`);
console.log(`Migration links: ${migrationLinks.length} (oldest review ${oldestMigrationReview})`);
console.log(`Field stories: ${fieldStories.length} (reviewed ${fieldStories.map((story) => story.reviewedOn).sort()[0]})`);
if (dueProviders.length) {
  console.log("\nDue within 30 days:");
  for (const item of dueProviders) console.log(`- ${item.name}: ${item.date} (${item.days < 0 ? `${Math.abs(item.days)} days overdue` : `${item.days} days`})`);
} else {
  console.log("\nNo provider profile is due within 30 days.");
}

if (dueCompanies.length) {
  console.log("\nCompany records due within 30 days:");
  for (const item of dueCompanies) console.log(`- ${item.name}: ${item.date} (${item.days < 0 ? `${Math.abs(item.days)} days overdue` : `${item.days} days`})`);
} else {
  console.log("\nNo company record is due within 30 days.");
}

if (dueProviders.some((item) => item.days < 0) || dueCompanies.some((item) => item.days < 0)) process.exitCode = 1;
