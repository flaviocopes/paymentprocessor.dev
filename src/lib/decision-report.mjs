const positive = (value) => Math.max(0, Number(value) || 0);
const bounded = (value, maximum = 100) => Math.min(maximum, positive(value));

const defaults = {
  inputs: {
    currentSlug: "stripe-payments",
    targetSlug: "paddle",
    monthlyRevenue: 25000,
    monthlyTransactions: 500,
    subscriptionShare: 80,
    internationalShare: 20,
    fxShare: 10,
    monthlyDisputes: 1,
    currentMonthlyFees: 1100,
    currentOperatingCost: 300
  },
  quote: {
    percentage: 5,
    fixed: 0.5,
    monthly: 0,
    internationalPercentage: 0,
    fxPercentage: 0,
    subscriptionPercentage: 0,
    disputeFee: 0,
    monthlyMinimum: 0,
    operatingCost: 100,
    payoutDelayDays: 14,
    reservePercentage: 0,
    reserveHoldDays: 0
  },
  migration: {
    developerDays: 5,
    operationsDays: 3,
    hourlyCost: 100,
    vendorMigrationFee: 0,
    overlapMonths: 1,
    tokenTransfer: "unknown",
    subscriptionImport: "assisted",
    reauthenticationShare: 10
  }
};

const clone = (value) => JSON.parse(JSON.stringify(value));

export function calculateQuote(inputs, quote) {
  const revenue = positive(inputs.monthlyRevenue);
  const transactions = positive(inputs.monthlyTransactions);
  const subscriptionShare = bounded(inputs.subscriptionShare);
  const internationalShare = bounded(inputs.internationalShare);
  const fxShare = bounded(inputs.fxShare);
  const disputes = positive(inputs.monthlyDisputes);

  const breakdown = {
    percentage: revenue * (positive(quote.percentage) / 100),
    fixed: transactions * positive(quote.fixed),
    international: revenue * (internationalShare / 100) * (positive(quote.internationalPercentage) / 100),
    fx: revenue * (fxShare / 100) * (positive(quote.fxPercentage) / 100),
    subscriptions: revenue * (subscriptionShare / 100) * (positive(quote.subscriptionPercentage) / 100),
    disputes: disputes * positive(quote.disputeFee),
    monthly: positive(quote.monthly),
    minimumShortfall: 0,
    operations: positive(quote.operatingCost)
  };
  const usageFees = breakdown.percentage + breakdown.fixed + breakdown.international + breakdown.fx + breakdown.subscriptions + breakdown.disputes;
  breakdown.minimumShortfall = Math.max(0, positive(quote.monthlyMinimum) - usageFees);
  const vendorFees = Object.entries(breakdown)
    .filter(([key]) => key !== "operations")
    .reduce((sum, [, value]) => sum + value, 0);
  const total = vendorFees + breakdown.operations;

  return {
    breakdown,
    vendorFees,
    total,
    effectiveRate: revenue > 0 ? (total / revenue) * 100 : 0
  };
}

function migrationRisk(migration, currentProvider, targetProvider) {
  let score = 0;
  const signals = [];

  if (migration.tokenTransfer === "recheckout") {
    score += 5;
    signals.push("Existing buyers may need to enter payment details again.");
  } else if (migration.tokenTransfer === "unknown") {
    score += 2;
    signals.push("Payment-method portability is not confirmed by both providers.");
  } else {
    signals.push("A provider-assisted payment-method transfer is assumed confirmed.");
  }

  if (migration.subscriptionImport === "unavailable") {
    score += 5;
    signals.push("A subscription-state import is assumed unavailable.");
  } else if (migration.subscriptionImport === "manual") {
    score += 3;
    signals.push("Subscription state must be mapped manually.");
  } else if (migration.subscriptionImport === "unknown") {
    score += 2;
    signals.push("Subscription import support remains unconfirmed.");
  } else {
    score += 1;
    signals.push("An assisted subscription import is assumed.");
  }

  const reauthenticationShare = bounded(migration.reauthenticationShare);
  if (reauthenticationShare > 20) score += 3;
  else if (reauthenticationShare > 5) score += 1;

  if (currentProvider?.model && targetProvider?.model && currentProvider.model !== targetProvider.model) {
    score += 2;
    signals.push("The legal-seller model changes, so tax, invoicing, disputes, and buyer support need an explicit handoff.");
  }
  if (positive(migration.overlapMonths) === 0) {
    score += 2;
    signals.push("No parallel-running window is budgeted.");
  }

  const label = score <= 3 ? "Lower modeled risk" : score <= 7 ? "Moderate modeled risk" : "Higher modeled risk";
  return { score, label, signals };
}

function routeName(provider) {
  if (!provider) return "";
  if (provider.name === "Stripe Payments") return "Stripe Billing";
  return provider.name;
}

function encodeReport(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeReport(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function createDecisionReportState(providers, publicRules, migrationLinks) {
  return {
    ...clone(defaults),
    shareStatus: "",
    storageStatus: "",
    get currentProvider() {
      return providers.find((provider) => provider.slug === this.inputs.currentSlug);
    },
    get targetProvider() {
      return providers.find((provider) => provider.slug === this.inputs.targetSlug);
    },
    get targetModelLabel() {
      return this.targetProvider?.model === "merchant-of-record" ? "Merchant of Record" : "You remain the merchant";
    },
    get targetQuote() {
      return calculateQuote(this.inputs, this.quote);
    },
    get currentMonthlyTotal() {
      return positive(this.inputs.currentMonthlyFees) + positive(this.inputs.currentOperatingCost);
    },
    get monthlySavings() {
      return this.currentMonthlyTotal - this.targetQuote.total;
    },
    get annualRunRateSavings() {
      return this.monthlySavings * 12;
    },
    get laborCost() {
      return (positive(this.migration.developerDays) + positive(this.migration.operationsDays)) * 8 * positive(this.migration.hourlyCost);
    },
    get migrationCost() {
      return this.laborCost
        + positive(this.migration.vendorMigrationFee)
        + (positive(this.migration.overlapMonths) * this.targetQuote.total);
    },
    get firstYearBenefit() {
      return this.annualRunRateSavings - this.migrationCost;
    },
    get paybackMonths() {
      return this.monthlySavings > 0 ? this.migrationCost / this.monthlySavings : null;
    },
    get recurringRevenueAtRisk() {
      const subscriptionRevenue = positive(this.inputs.monthlyRevenue) * (bounded(this.inputs.subscriptionShare) / 100);
      return subscriptionRevenue * (bounded(this.migration.reauthenticationShare) / 100);
    },
    get risk() {
      return migrationRisk(this.migration, this.currentProvider, this.targetProvider);
    },
    get decision() {
      if (this.monthlySavings <= 0) {
        return {
          label: "Stay unless the operating benefits justify the premium",
          note: "The target costs more under the entered assumptions. Negotiate the quote or document a non-price reason to switch.",
          tone: "hold"
        };
      }
      if ((this.paybackMonths ?? Infinity) <= 12 && this.risk.score <= 7 && this.firstYearBenefit > 0) {
        return {
          label: "Build a provider-validated switch plan",
          note: "The modeled savings recover migration cost inside a year. Confirm transfer, reserve, and contract assumptions before committing.",
          tone: "go"
        };
      }
      return {
        label: "Reduce migration risk or improve the quote first",
        note: "The target may save money, but the current migration assumptions weaken the first-year case.",
        tone: "review"
      };
    },
    get cashFlow() {
      const revenue = positive(this.inputs.monthlyRevenue);
      const netAfterFees = Math.max(0, revenue - this.targetQuote.vendorFees);
      const reservePercentage = bounded(this.quote.reservePercentage);
      const reserveHoldDays = positive(this.quote.reserveHoldDays);
      const payoutDelayDays = positive(this.quote.payoutDelayDays);
      const firstMonthReserve = revenue * (reservePercentage / 100);
      const steadyReserve = (revenue / 30) * reserveHoldDays * (reservePercentage / 100);
      const payoutFloat = (netAfterFees / 30) * payoutDelayDays;
      const workingCapital = steadyReserve + payoutFloat;
      const firstPayout = Math.max(0, netAfterFees - firstMonthReserve);
      return {
        netAfterFees,
        firstMonthReserve,
        steadyReserve,
        payoutFloat,
        workingCapital,
        firstPayout,
        cashConversion: revenue > 0 ? (firstPayout / revenue) * 100 : 0
      };
    },
    get currentBarWidth() {
      const maximum = Math.max(1, this.currentMonthlyTotal, this.targetQuote.total);
      return `${(this.currentMonthlyTotal / maximum) * 100}%`;
    },
    get targetBarWidth() {
      const maximum = Math.max(1, this.currentMonthlyTotal, this.targetQuote.total);
      return `${(this.targetQuote.total / maximum) * 100}%`;
    },
    get quoteRows() {
      return [
        ["Percentage fee", this.targetQuote.breakdown.percentage],
        ["Per-transaction fee", this.targetQuote.breakdown.fixed],
        ["International uplift", this.targetQuote.breakdown.international],
        ["Currency conversion", this.targetQuote.breakdown.fx],
        ["Subscription uplift", this.targetQuote.breakdown.subscriptions],
        ["Disputes", this.targetQuote.breakdown.disputes],
        ["Monthly platform fee", this.targetQuote.breakdown.monthly],
        ["Minimum-commitment shortfall", this.targetQuote.breakdown.minimumShortfall],
        ["Your operating cost", this.targetQuote.breakdown.operations]
      ];
    },
    get canonicalRoute() {
      const source = routeName(this.currentProvider);
      const destination = routeName(this.targetProvider);
      return migrationLinks.find((route) => route.source === source && route.destination === destination);
    },
    get checklist() {
      const items = [
        { label: "Get payment-method portability confirmed in writing by both providers", status: this.migration.tokenTransfer === "confirmed" ? "confirmed" : "open" },
        { label: "Confirm how customer, price, invoice, and subscription objects will be imported", status: this.migration.subscriptionImport === "assisted" ? "confirmed" : "open" },
        { label: "Map checkout, webhooks, refunds, disputes, entitlements, and customer-portal behavior", status: "open" },
        { label: "Export customer, transaction, tax, invoice, and payout records before cutover", status: "open" },
        { label: "Test new sales, renewals, plan changes, cancellations, refunds, and failed-payment recovery", status: "open" },
        { label: "Agree a rollback point and reconcile both providers during the overlap window", status: positive(this.migration.overlapMonths) > 0 ? "budgeted" : "open" },
        { label: "Verify payout timing, reserves, minimums, termination terms, and post-exit access", status: "open" }
      ];
      if (this.currentProvider?.model !== this.targetProvider?.model) {
        items.splice(3, 0, { label: "Document the legal-seller, tax, invoicing, dispute, and billing-support handoff", status: "open" });
      }
      if (bounded(this.migration.reauthenticationShare) > 0) {
        items.splice(2, 0, { label: "Prepare buyer communication and recovery for customers who must re-authenticate", status: "open" });
      }
      return items;
    },
    get publicRule() {
      return publicRules.find((rule) => rule.slug === this.inputs.targetSlug);
    },
    usePublicBaseline(showMessage = true) {
      const rule = this.publicRule;
      if (!rule) {
        if (showMessage) this.shareStatus = "No single public baseline is modeled for this provider. Enter the quote you received.";
        return;
      }
      this.quote.percentage = positive(rule.percentage);
      this.quote.fixed = positive(rule.fixed);
      this.quote.monthly = positive(rule.monthly);
      this.quote.monthlyMinimum = 0;
      this.quote.internationalPercentage = positive(rule.internationalPercentage);
      this.quote.fxPercentage = positive(rule.fxPercentage);
      this.quote.subscriptionPercentage = positive(rule.subscriptionPercentage);
      this.quote.disputeFee = positive(rule.disputeFee);
      if (showMessage) this.shareStatus = `Loaded the reviewed public baseline for ${rule.name}. Payout and reserve terms still need your contract.`;
    },
    snapshot() {
      return {
        version: 1,
        inputs: clone(this.inputs),
        quote: clone(this.quote),
        migration: clone(this.migration)
      };
    },
    applySnapshot(snapshot) {
      if (!snapshot || snapshot.version !== 1) return false;
      this.inputs = { ...clone(defaults.inputs), ...(snapshot.inputs || {}) };
      this.quote = { ...clone(defaults.quote), ...(snapshot.quote || {}) };
      this.migration = { ...clone(defaults.migration), ...(snapshot.migration || {}) };
      return true;
    },
    save() {
      try {
        localStorage.setItem("payment-stack-decision-report", JSON.stringify(this.snapshot()));
        this.storageStatus = "Saved on this device.";
      } catch {
        this.storageStatus = "This browser blocked local saving.";
      }
    },
    loadSaved() {
      try {
        const saved = localStorage.getItem("payment-stack-decision-report");
        if (!saved || !this.applySnapshot(JSON.parse(saved))) {
          this.storageStatus = "No saved report found on this device.";
          return;
        }
        this.storageStatus = "Saved report loaded.";
      } catch {
        this.storageStatus = "The saved report could not be read.";
      }
    },
    async share() {
      const url = new URL(window.location.href);
      url.hash = `report=${encodeReport(this.snapshot())}`;
      window.history.replaceState({}, "", url);
      try {
        await navigator.clipboard.writeText(url.toString());
        this.shareStatus = "Shareable report link copied. It contains the entered assumptions, not private provider documents.";
      } catch {
        this.shareStatus = "The report is now encoded in this page URL. Copy it from the address bar.";
      }
    },
    init() {
      const encoded = window.location.hash.startsWith("#report=") ? window.location.hash.slice(8) : "";
      if (!encoded) return;
      try {
        if (this.applySnapshot(decodeReport(encoded))) this.shareStatus = "Shared report loaded from the URL.";
      } catch {
        this.shareStatus = "This shared report link is incomplete or invalid.";
      }
    },
    print() {
      window.print();
    },
    reset() {
      this.inputs = clone(defaults.inputs);
      this.quote = clone(defaults.quote);
      this.migration = clone(defaults.migration);
      this.shareStatus = "Example assumptions restored.";
      this.storageStatus = "";
      window.history.replaceState({}, "", window.location.pathname);
    },
    money(value) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
    },
    preciseMoney(value) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value || 0);
    },
    percent(value) {
      return `${(value || 0).toFixed(2)}%`;
    },
    months(value) {
      return value === null ? "No payback" : `${value.toFixed(1)} mo`;
    }
  };
}
