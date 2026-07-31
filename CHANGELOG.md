# Changelog

Material changes to paymentprocessor.dev are recorded here using calendar dates.

## 2026-07-31

### Added

- Added a dedicated features and buyer-payment-method table to the Paddle versus Stripe Payments comparison, covering cards, Apple Pay, Google Pay, PayPal, regional and bank methods, subscriptions, invoicing, indirect-tax remittance, and hosted or embedded checkout.
- Added explicit **supported**, **limited**, **add-on**, and **not supported** states with eligibility and integration caveats so payment-method availability is not presented as universal.
- Added an implementation, developer-experience, and buyer-experience comparison to all four provider matchups. The fixed rubric separates the fastest first-payment path from a production SaaS integration and examines checkout code, server and webhook work, subscription lifecycle, fulfillment, tax operations, testing tools, buyer self-service, and customization.
- Added the implementation-load rubric to the research methodology, including the principle that a no-code first payment does not imply no-code fulfillment, billing, reconciliation, or compliance.
- Added Stripe Link's cross-merchant saved checkout to the Paddle versus Stripe feature table and added checkout-conversion evidence to the implementation comparison.

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
