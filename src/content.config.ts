import { defineCollection, z } from "astro:content";
import { file, glob } from "astro/loaders";

const datedSource = z.object({
  id: z.string().min(2),
  label: z.string().min(4),
  url: z.string().url().startsWith("https://"),
  reviewedOn: z.string().date()
});

const pricing = z.object({
  kind: z.enum(["public", "hybrid", "negotiated", "contradictory", "method-based", "country-method-based", "country-channel-based"]),
  headline: z.string().min(20),
  percentage: z.number().nonnegative().nullable(),
  fixed: z.number().nonnegative().nullable(),
  monthly: z.number().nonnegative().nullable(),
  currency: z.string().length(3),
  assumptions: z.string().min(20),
  sourceIds: z.array(z.string()).min(1)
});

const currencySupport = z.object({
  presentment: z.string().min(20),
  customerCharge: z.string().min(20),
  settlement: z.string().min(20),
  buyerFx: z.string().min(15),
  merchantFx: z.string().min(15),
  moneyPath: z.string().min(10),
  marketExamples: z.array(z.object({
    market: z.enum(["us", "eu", "other"]),
    path: z.string().min(10),
    conversions: z.enum(["0", "1", "2", "2+", "not-disclosed"]),
    cost: z.string().min(20)
  })).length(3),
  sourceIds: z.array(z.string()).min(1)
});

const providerSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(2),
  model: z.enum(["merchant-of-record", "direct-payments"]),
  serviceModel: z.string().min(3),
  legalSeller: z.enum(["provider", "merchant"]),
  stage: z.enum(["established", "growth", "public-preview"]),
  summary: z.string().min(60),
  pricing,
  currencySupport: currencySupport.optional(),
  sellerCoverage: z.string().min(30),
  buyerCoverage: z.string().min(30),
  products: z.string().min(30),
  features: z.object({
    checkout: z.string().min(15),
    subscriptions: z.string().min(15),
    invoicing: z.string().min(15),
    paymentMethods: z.string().min(15),
    payouts: z.string().min(15)
  }),
  responsibilities: z.array(z.object({
    area: z.string().min(8),
    owner: z.enum(["provider", "merchant", "shared"]),
    note: z.string().min(15)
  })).min(4),
  strengths: z.array(z.string().min(8)).min(3),
  limitations: z.array(z.string().min(8)).min(3),
  bestFor: z.array(z.string().min(5)).min(3),
  avoidIf: z.array(z.string().min(8)).min(2),
  lastReviewed: z.string().date(),
  nextReview: z.string().date(),
  sources: z.array(datedSource).min(2)
}).superRefine((provider, context) => {
  const expectedSeller = provider.model === "merchant-of-record" ? "provider" : "merchant";
  if (provider.legalSeller !== expectedSeller) {
    context.addIssue({ code: "custom", path: ["legalSeller"], message: `${provider.model} requires legalSeller=${expectedSeller}.` });
  }
  if (provider.nextReview <= provider.lastReviewed) {
    context.addIssue({ code: "custom", path: ["nextReview"], message: "nextReview must follow lastReviewed." });
  }
  const sourceIds = new Set(provider.sources.map((source) => source.id));
  for (const sourceId of provider.pricing.sourceIds) {
    if (!sourceIds.has(sourceId)) {
      context.addIssue({ code: "custom", path: ["pricing", "sourceIds"], message: `Unknown pricing source ${sourceId}.` });
    }
  }
  if (provider.model === "merchant-of-record" && !provider.currencySupport) {
    context.addIssue({ code: "custom", path: ["currencySupport"], message: "Merchant of Record profiles require currencySupport." });
  }
  for (const sourceId of provider.currencySupport?.sourceIds ?? []) {
    if (!sourceIds.has(sourceId)) {
      context.addIssue({ code: "custom", path: ["currencySupport", "sourceIds"], message: `Unknown currency-support source ${sourceId}.` });
    }
  }
  if (provider.currencySupport) {
    const exampleMarkets = new Set(provider.currencySupport.marketExamples.map((example) => example.market));
    for (const market of ["us", "eu", "other"] as const) {
      if (!exampleMarkets.has(market)) {
        context.addIssue({ code: "custom", path: ["currencySupport", "marketExamples"], message: `Missing ${market} currency market example.` });
      }
    }
  }
  for (const source of provider.sources) {
    if (source.reviewedOn > provider.lastReviewed) {
      context.addIssue({ code: "custom", path: ["sources"], message: `${source.id} was reviewed after the provider profile.` });
    }
  }
});

const comparisonSchema = z.object({
  slug: z.string(),
  title: z.string(),
  providers: z.array(z.string()).length(2),
  summary: z.string(),
  recommendation: z.string(),
  differences: z.array(z.object({ area: z.string(), first: z.string(), second: z.string(), whyItMatters: z.string() })).min(4),
  features: z.array(z.object({
    category: z.string(),
    feature: z.string(),
    first: z.object({
      availability: z.enum(["supported", "limited", "add-on", "not-supported"]),
      note: z.string()
    }),
    second: z.object({
      availability: z.enum(["supported", "limited", "add-on", "not-supported"]),
      note: z.string()
    })
  })).min(5).optional(),
  scenarios: z.array(z.object({ when: z.string(), choose: z.string(), reason: z.string() })).min(3),
  lastReviewed: z.string().date(),
  sources: z.array(z.string()).min(2)
});

const guideSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  dek: z.string(),
  category: z.enum(["foundations", "operations", "growth", "risk", "migration"]).optional(),
  readingTime: z.string().optional(),
  audience: z.array(z.string()).optional(),
  takeaways: z.array(z.string()).min(3).optional(),
  decisionChecklist: z.array(z.string()).min(4).optional(),
  sections: z.array(z.object({ heading: z.string(), body: z.array(z.string()).min(1) })).min(3),
  lastReviewed: z.string().date(),
  sources: z.array(datedSource).min(1)
});

const migrationLinkSchema = z.object({
  source: z.string(),
  destination: z.string(),
  path: z.string().startsWith("https://migratingto.dev/guides/"),
  summary: z.string().min(40),
  status: z.enum(["available", "needs-review"]),
  lastReviewed: z.string().date()
});

const fieldStorySchema = z.object({
  title: z.string().min(10),
  sourceType: z.enum(["reddit", "indie-hackers", "founder-blog", "company-blog", "engineering-blog", "case-study"]),
  perspective: z.enum(["community", "first-person", "provider-authored", "customer-story"]),
  url: z.string().url().startsWith("https://"),
  summary: z.string().min(60),
  caveat: z.string().min(30),
  relatedGuides: z.array(z.string()).min(1),
  providerSlugs: z.array(z.string()).default([]),
  reviewedOn: z.string().date()
});

const companyIntelligenceSchema = z.object({
  name: z.string().min(2),
  providerSlugs: z.array(z.string()).min(1),
  entityType: z.enum(["private", "public", "subsidiary", "private-equity-backed"]),
  ownershipLabel: z.string().min(8),
  parentCompany: z.string().nullable(),
  ticker: z.string().nullable(),
  founded: z.number().int().min(1900).max(2100).nullable(),
  foundedNote: z.string().min(20),
  headquarters: z.string().min(3),
  leaders: z.array(z.object({
    name: z.string().min(2),
    title: z.string().min(2),
    context: z.string().min(10)
  })).min(1),
  founders: z.array(z.string().min(2)).min(1),
  team: z.object({
    value: z.string().min(2),
    asOf: z.string().date().nullable(),
    note: z.string().min(15)
  }),
  funding: z.object({
    status: z.enum(["venture-backed", "community-backed", "private-equity-backed", "public-company", "acquired", "undisclosed"]),
    headline: z.string().min(12),
    details: z.string().min(30),
    investors: z.array(z.string()).default([])
  }),
  financials: z.object({
    scope: z.enum(["company", "parent-company", "product", "not-disclosed"]),
    period: z.string().min(4),
    headline: z.string().min(12),
    metrics: z.array(z.object({ label: z.string().min(2), value: z.string().min(2) })).min(1),
    note: z.string().min(25)
  }),
  events: z.array(z.object({ date: z.string(), label: z.string().min(15) })).min(1),
  lastReviewed: z.string().date(),
  nextReview: z.string().date(),
  sources: z.array(datedSource).min(2)
}).superRefine((company, context) => {
  if (company.nextReview <= company.lastReviewed) {
    context.addIssue({ code: "custom", path: ["nextReview"], message: "nextReview must follow lastReviewed." });
  }
  for (const source of company.sources) {
    if (source.reviewedOn !== company.lastReviewed) {
      context.addIssue({ code: "custom", path: ["sources"], message: `${source.id} is not aligned with lastReviewed.` });
    }
  }
});

const providers = defineCollection({ loader: glob({ pattern: "**/*.json", base: "./src/content/providers" }), schema: providerSchema });
const comparisons = defineCollection({ loader: glob({ pattern: "**/*.json", base: "./src/content/comparisons" }), schema: comparisonSchema });
const guides = defineCollection({ loader: glob({ pattern: "**/*.json", base: "./src/content/guides" }), schema: guideSchema });
const migrationLinks = defineCollection({ loader: file("./src/content/migration-links.json"), schema: migrationLinkSchema });
const fieldStories = defineCollection({ loader: file("./src/content/field-stories.json"), schema: fieldStorySchema });
const companyIntelligence = defineCollection({ loader: file("./src/content/company-intelligence.json"), schema: companyIntelligenceSchema });

export const collections = { providers, comparisons, guides, migrationLinks, fieldStories, companyIntelligence };
