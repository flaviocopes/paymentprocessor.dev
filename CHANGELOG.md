# Changelog

Material changes to paymentprocessor.dev are recorded here using calendar dates.

## 2026-09-01

### Changed

- Marked Stripe Managed Payments as generally available (growth stage). Removed public-preview language from the profile, calculator confidence, Payments comparison, migration summaries, and country-coverage note. Seller eligibility remains limited to documented business locations (~39 countries, including Australia) and digital-product categories. First-party tax-country copy still disagrees (“75+” / “more than 75” vs “more than 80”); both figures are labeled where mentioned.
- Documented Gumroad’s automatic high-volume direct-sale break (5% + $0.50 after $20,000 paid sales in a calendar month) in pricing assumptions and calculator unmodeled fees; kept the modeled 12.9% + $0.80 standard-card formula.
- Noted Lemon Squeezy’s Sold through Link, LLC (f/k/a Lemon Squeezy LLC) legal naming and the blog’s Managed Payments early-access / migration direction, without calling Lemon Squeezy deprecated.
- Recorded Braintree Drop-in SDK deprecation effective 2026-09-01, with processing support through 2027-09-01.
- Clarified Square Free non-API online pricing (3.3% + 30¢) versus the modeled API / Plus / Premium 2.9% + $0.30 rate.
- Refreshed overdue company intelligence for Adyen (H1 2026; Talon.One and Orb closings; interim CFO), Block / Square (Q2 2026 Square metrics; DOJ accrual note), PayPal (2Q 2026), and Braintree parent metrics.
- Rechecked the security incident tracker through 2026-09-01: no new catalog-provider platform cyber incidents after 2026-08-28. Skipped the July 2026 Cash App AG settlement as out of inclusion scope (consumer-protection / fraud-controls settlement, not a cyber incident). Dodo Metabase status unchanged after recheck.
- Bumped lastReviewed / source review dates and calculator reviewedOn across the published provider catalog after the 2026-09-01 pricing recheck; modeled percentages and fixed fees are unchanged.

## 2026-08-28

### Added

- Added a security incident tracker with eight sourced records from the past six months, covering confirmed incidents, exploited flaws, disclosed vulnerabilities, and security-related disruptions.
- Added clear impact, scope, status, merchant-action, and evidence fields to every record, with separate labels for catalog providers, integrations, and adjacent payment infrastructure.
- Added incident-tracker validation, navigation, sitemap coverage, and an inclusion policy that excludes unsupported claims and distinguishes a vulnerable integration from a provider-platform breach.

## 2026-07-31

### Added

- Added a dedicated features and buyer-payment-method table to the Paddle versus Stripe Payments comparison, covering cards, Apple Pay, Google Pay, PayPal, regional and bank methods, subscriptions, invoicing, indirect-tax remittance, and hosted or embedded checkout.
- Added explicit **supported**, **limited**, **add-on**, and **not supported** states with eligibility and integration caveats so payment-method availability is not presented as universal.
- Added an implementation, developer-experience, and buyer-experience comparison to all four provider matchups. The fixed rubric separates the fastest first-payment path from a production SaaS integration and examines checkout code, server and webhook work, subscription lifecycle, fulfillment, tax operations, testing tools, buyer self-service, and customization.
- Added the implementation-load rubric to the research methodology, including the principle that a no-code first payment does not imply no-code fulfillment, billing, reconciliation, or compliance.
- Added Stripe Link's cross-merchant saved checkout to the Paddle versus Stripe feature table and added checkout-conversion evidence to the implementation comparison.
- Added an all-provider Merchant of Record matrix directly to the comparison hub, covering pricing, best fit, eligible products, checkout, buyer payment methods, subscriptions, invoicing, payouts, seller and buyer coverage, and evidence freshness across all eight providers.

### Changed

- Added Stripe Link and dynamic payment methods as a conditional Stripe Payments strength. The profile and comparison now distinguish possible conversion upside from a guaranteed sales lift.
- Added supporting Stripe results and the MemberPress case study alongside an independent test that found low Link adoption and no significant conversion lift, with a recommendation to A/B test average revenue per checkout session for the actual audience.
- Expanded and refreshed the primary sources for payment methods, provider quickstarts, checkout integrations, subscription webhooks, customer portals, automated entitlements, Stripe Link, and checkout-conversion testing.

## 2026-07-30

### Added

- Added a sourced multi-currency comparison for all eight Merchant of Record providers, covering checkout presentment, the currency buyers are actually charged, seller balances, payout currencies, and buyer- and seller-side FX costs.
- Added 24 representative currency routes across three markets: US with USD, EU with EUR, and markets outside the US and EU with CHF.
- Added the same three market examples to every Merchant of Record provider profile, including conversion counts, fee disclosures, and explicit labels where conversion details are not publicly disclosed.
- Added content-schema and validation rules for currency evidence, market-example completeness, and source review dates.

### Changed

- Renamed the publication from **Payment Stack Guide** to **Choose a Payment Processor** across navigation, page titles, structured metadata, social metadata, copyright text, and the Open Graph image.
- Reordered Merchant of Record cards and currency charts by editorial popularity: Paddle, Lemon Squeezy, Gumroad, Polar, FastSpring, Stripe Managed Payments, Dodo Payments, and Creem.
- Clarified double-conversion routes for FastSpring, Lemon Squeezy, Paddle, Polar, Gumroad, and other providers, including which party may pay each fee.

### Removed

- Removed GoCardless from the provider catalog, comparison tools, country coverage, calculator rules, and company explorer.

## 2026-07-29

### Launched

- Launched paymentprocessor.dev with evidence-backed Merchant of Record and direct-payment provider profiles, legal-seller decision paths, provider comparisons, company intelligence, country coverage, cost and migration tools, a payments learning library, and canonical migration guidance.
