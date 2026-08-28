# Changelog

Material changes to paymentprocessor.dev are recorded here using calendar dates.

## 2026-08-28

### Changed

- Updated Gumroad fee evidence for the automatic high-volume direct-sale discount once paid sales reach $20,000 in a calendar month, plus refund and PayPal-payout fee notes, while keeping the modeled 12.9% + $0.80 standard-card formula.
- Moved Stripe Managed Payments from public preview to established after the 2026-04-22 general-availability changelog, including seller-coverage, comparison, migration-link, calculator-confidence, and country-coverage wording; product-eligibility limits remain.
- Corrected Dodo Payments settlement evidence so INR is a transaction currency rather than a native payout wallet, and recorded the PayPal paused-vs-marketing-table contradiction alongside ACH/SEPA and recovery unmodeled fees.
- Replaced Paddle's unpublished payment-to-balance FX wording with the published mid-market margins from clause 7.1 of the Master Services Agreement.
- Split Square's US online fee headline between API/Web Payments/Checkout at 2.9% + $0.30 and Free-plan hosted online or invoices at 3.3% + $0.30.
- Documented Braintree Drop-in SDK deprecation (2026-09-01) and unsupported date (2027-09-01), pointing sellers to current Android, iOS, and JavaScript SDKs.
- Refreshed overdue company intelligence for PayPal, Braintree, Adyen, and Block with 2026 interim results, and caught up Mollie EEA expansion, FastSpring–Paysafe MoR partnership, and Lemon Squeezy legal-entity naming.

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
