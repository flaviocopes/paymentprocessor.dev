const number = (value) => Math.max(0, Number(value) || 0);

export function calculateProviderCost(rule, inputs) {
  const revenue = number(inputs.revenue);
  const transactions = number(inputs.transactions);
  const subscriptionShare = Math.min(100, number(inputs.subscriptionShare));
  const internationalShare = Math.min(100, number(inputs.internationalShare));
  const fxShare = Math.min(100, number(inputs.fxShare));
  const refundShare = Math.min(100, number(inputs.refundShare));
  const disputes = number(inputs.disputes);

  const rawBasePercentage = revenue * (rule.percentage / 100);
  const rawFixed = transactions * rule.fixed;
  let basePercentage = rawBasePercentage;
  let fixed = rawFixed;
  if (rule.capPerTransaction) {
    const domesticShare = 1 - (internationalShare / 100);
    const domesticBase = (rawBasePercentage + rawFixed) * domesticShare;
    const internationalBase = (rawBasePercentage + rawFixed) * (internationalShare / 100);
    const domesticCap = transactions * domesticShare * rule.capPerTransaction;
    const cappedBase = Math.min(domesticBase, domesticCap) + internationalBase;
    const fixedShare = rawBasePercentage + rawFixed > 0 ? rawFixed / (rawBasePercentage + rawFixed) : 0;
    fixed = cappedBase * fixedShare;
    basePercentage = cappedBase - fixed;
  }
  const international = revenue * (internationalShare / 100) * (rule.internationalPercentage / 100);
  const fx = revenue * (fxShare / 100) * (rule.fxPercentage / 100);
  const subscriptions = revenue * (subscriptionShare / 100) * (rule.subscriptionPercentage / 100);
  const dispute = disputes * rule.disputeFee;
  const providerPlan = rule.monthly;
  const externalPlan = rule.model === "direct-payments" ? number(inputs.directPlanCost) : 0;
  const operations = rule.model === "direct-payments"
    ? number(inputs.directOperatingCost)
    : number(inputs.morOperatingCost);

  const paymentFees = basePercentage + fixed + international + fx + subscriptions + dispute + providerPlan;
  const total = paymentFees + externalPlan + operations;
  const refundExposure = (basePercentage + fixed) * (refundShare / 100);
  const effectiveRate = revenue > 0 ? (total / revenue) * 100 : 0;

  return {
    ...rule,
    breakdown: {
      basePercentage,
      fixed,
      international,
      fx,
      subscriptions,
      dispute,
      providerPlan,
      externalPlan,
      operations,
      refundExposure
    },
    paymentFees,
    total,
    effectiveRate
  };
}

export function calculateAll(rules, inputs) {
  return rules
    .map((rule) => calculateProviderCost(rule, inputs))
    .sort((a, b) => a.total - b.total);
}

export function createCalculatorState(rules) {
  return {
    inputs: {
      revenue: 10000,
      transactions: 200,
      subscriptionShare: 100,
      internationalShare: 25,
      fxShare: 10,
      refundShare: 3,
      disputes: 1,
      directPlanCost: 0,
      directOperatingCost: 0,
      morOperatingCost: 0
    },
    view: "all",
    selectedSlugs: ["stripe-payments", "paddle", "creem", "gocardless"].filter((slug) => rules.some((rule) => rule.slug === slug)),
    get allResults() {
      return calculateAll(rules, this.inputs);
    },
    get results() {
      return this.view === "all" ? this.allResults : this.allResults.filter((row) => row.model === this.view);
    },
    get comparisonResults() {
      return this.selectedSlugs.map((slug) => this.allResults.find((row) => row.slug === slug)).filter(Boolean);
    },
    isSelected(slug) {
      return this.selectedSlugs.includes(slug);
    },
    canToggle(slug) {
      return this.isSelected(slug) || this.selectedSlugs.length < 4;
    },
    toggleComparison(slug) {
      if (this.isSelected(slug)) {
        if (this.selectedSlugs.length <= 2) return;
        this.selectedSlugs = this.selectedSlugs.filter((selected) => selected !== slug);
        return;
      }
      if (this.selectedSlugs.length < 4) this.selectedSlugs = [...this.selectedSlugs, slug];
    },
    money(value) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value || 0);
    },
    percent(value) {
      return `${(value || 0).toFixed(2)}%`;
    },
    reset() {
      this.inputs = {
        revenue: 10000,
        transactions: 200,
        subscriptionShare: 100,
        internationalShare: 25,
        fxShare: 10,
        refundShare: 3,
        disputes: 1,
        directPlanCost: 0,
        directOperatingCost: 0,
        morOperatingCost: 0
      };
    }
  };
}

export function createHomepageFeeState(rules, unmodeledProviders = []) {
  return {
    inputs: {
      annualRevenue: 250000,
      averageOrderValue: 50,
      subscriptionShare: 50,
      internationalShare: 20,
      fxShare: 10,
      disputes: 12
    },
    view: "all",
    selectedSlug: "stripe-payments",
    get annualInputs() {
      const annualRevenue = number(this.inputs.annualRevenue);
      const averageOrderValue = Math.max(1, number(this.inputs.averageOrderValue));
      return {
        revenue: annualRevenue,
        transactions: annualRevenue / averageOrderValue,
        subscriptionShare: this.inputs.subscriptionShare,
        internationalShare: this.inputs.internationalShare,
        fxShare: this.inputs.fxShare,
        refundShare: 0,
        disputes: this.inputs.disputes,
        directPlanCost: 0,
        directOperatingCost: 0,
        morOperatingCost: 0
      };
    },
    get allResults() {
      const annualRules = rules.map((rule) => ({ ...rule, monthly: rule.monthly * 12 }));
      return calculateAll(annualRules, this.annualInputs);
    },
    get results() {
      return this.view === "all"
        ? this.allResults
        : this.allResults.filter((result) => result.model === this.view);
    },
    get visibleUnmodeledProviders() {
      return this.view === "all"
        ? unmodeledProviders
        : unmodeledProviders.filter((provider) => provider.model === this.view);
    },
    get maxTotal() {
      return Math.max(1, ...this.results.map((result) => result.total));
    },
    get selectedResult() {
      return this.results.find((result) => result.slug === this.selectedSlug) || this.results[0];
    },
    setView(view) {
      this.view = view;
      if (!this.results.some((result) => result.slug === this.selectedSlug)) {
        this.selectedSlug = this.results[0]?.slug || "";
      }
    },
    select(slug) {
      this.selectedSlug = slug;
    },
    barWidth(result) {
      return `${Math.max(2, (result.total / this.maxTotal) * 100)}%`;
    },
    segmentWidth(value, total) {
      return `${total > 0 ? (value / total) * 100 : 0}%`;
    },
    money(value) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
    },
    compactMoney(value) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
    },
    percent(value) {
      return `${(value || 0).toFixed(2)}%`;
    },
    reset() {
      this.inputs = {
        annualRevenue: 250000,
        averageOrderValue: 50,
        subscriptionShare: 50,
        internationalShare: 20,
        fxShare: 10,
        disputes: 12
      };
    }
  };
}
