import assert from "node:assert/strict";
import { calculateQuote, createDecisionReportState } from "../src/lib/decision-report.mjs";

const providers = [
  { slug: "stripe-payments", name: "Stripe Payments", model: "direct-payments" },
  { slug: "paddle", name: "Paddle", model: "merchant-of-record" }
];
const publicRules = [{
  slug: "paddle",
  name: "Paddle",
  percentage: 5,
  fixed: 0.5,
  monthly: 0,
  internationalPercentage: 0,
  fxPercentage: 0,
  subscriptionPercentage: 0,
  disputeFee: 0
}];
const migrationLinks = [{
  source: "Stripe Billing",
  destination: "Paddle",
  path: "https://example.com/stripe-to-paddle",
  summary: "Example route"
}];

const quote = calculateQuote(
  {
    monthlyRevenue: 10000,
    monthlyTransactions: 100,
    subscriptionShare: 50,
    internationalShare: 20,
    fxShare: 10,
    monthlyDisputes: 1
  },
  {
    percentage: 2,
    fixed: 0.2,
    internationalPercentage: 1,
    fxPercentage: 1,
    subscriptionPercentage: 0.5,
    disputeFee: 10,
    monthly: 25,
    monthlyMinimum: 400,
    operatingCost: 50
  }
);
assert.equal(quote.breakdown.minimumShortfall, 115);
assert.equal(quote.vendorFees, 425);
assert.equal(quote.total, 475);

const state = createDecisionReportState(providers, publicRules, migrationLinks);
assert.equal(state.targetQuote.total, 1600);
assert.equal(state.migrationCost, 8000);
assert.equal(state.canonicalRoute.path, "https://example.com/stripe-to-paddle");
assert.ok(state.checklist.length >= 8);
assert.ok(state.cashFlow.payoutFloat > 0);

state.quote.monthlyMinimum = 3000;
assert.equal(state.targetQuote.breakdown.minimumShortfall, 1500);
assert.equal(state.targetQuote.total, 3100);

console.log("Decision report calculation tests passed.");
