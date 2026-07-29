const text = (provider) => [
  provider.name,
  provider.serviceModel,
  provider.summary,
  provider.products,
  provider.sellerCoverage,
  provider.buyerCoverage,
  ...provider.bestFor,
  ...provider.strengths,
  ...provider.limitations
].join(" ").toLowerCase();

const containsAny = (haystack, needles) => needles.some((needle) => haystack.includes(needle));

const productSignals = {
  saas: ["saas", "subscription", "software"],
  digital: ["digital", "download", "creator", "license", "course"],
  physical: ["physical", "retail", "in-person", "omnichannel"],
  marketplace: ["marketplace", "platform", "connected account"],
  omnichannel: ["omnichannel", "in-person", "point-of-sale", "retail"],
  invoices: ["invoice", "bank payment", "direct debit", "b2b"]
};

const prioritySignals = {
  global: ["global", "international", "200+", "local acquiring", "currencies"],
  bank: ["bank", "ach", "direct debit", "pay-by-bank"],
  omnichannel: ["omnichannel", "in-person", "point-of-sale", "acquirer"]
};

export function scoreProvider(provider, inputs) {
  const blob = text(provider);
  let score = 28;
  const reasons = [];

  if (inputs.model !== "open") {
    if (provider.model === inputs.model) {
      score += 34;
      reasons.push(inputs.model === "merchant-of-record" ? "Matches your preference to outsource legal-seller and indirect-tax responsibility." : "Keeps your company as the legal seller with direct payment control.");
    } else {
      score -= 32;
    }
  }

  const signals = productSignals[inputs.product] || [];
  if (containsAny(blob, signals)) {
    score += 18;
    reasons.push(`Its documented product focus overlaps with your ${inputs.product.replaceAll("-", " ")} use case.`);
  } else if (inputs.product === "physical" && provider.model === "merchant-of-record") {
    score -= 35;
  }

  if (inputs.scale === "solo") {
    if (provider.stage === "growth" || provider.pricing.percentage !== null) score += 10;
    if (provider.pricing.kind === "negotiated") score -= 9;
  }
  if (inputs.scale === "enterprise") {
    if (provider.stage === "established") score += 12;
    if (containsAny(blob, ["enterprise", "global acquirer", "implementation", "omnichannel"])) score += 8;
  }

  if (inputs.administration === "high") {
    if (provider.model === "merchant-of-record") {
      score += 18;
      reasons.push("Outsourcing seller-side administration matches the high local workload you entered.");
    } else {
      score -= 8;
    }
  } else if (inputs.administration === "manageable") {
    if (provider.model === "direct-payments") {
      score += 14;
      reasons.push("Direct payments fit your ability to retain the local tax, invoicing, and accounting work.");
    } else {
      score -= 6;
    }
  }

  if (inputs.priority === "simplicity") {
    if (provider.model === "merchant-of-record") {
      score += 18;
      reasons.push("The MoR model bundles more payment, tax, and transaction operations.");
    }
    if (provider.pricing.percentage !== null) score += 5;
  } else if (inputs.priority === "control") {
    if (provider.model === "direct-payments") {
      score += 20;
      reasons.push("Direct payments preserve more checkout, merchant, and customer control.");
    }
  } else {
    const priorityTerms = prioritySignals[inputs.priority] || [];
    if (containsAny(blob, priorityTerms)) {
      score += 22;
      reasons.push(`Its documented strengths align with your ${inputs.priority.replaceAll("-", " ")} priority.`);
    }
  }

  if (inputs.pricing === "public") {
    if (provider.pricing.percentage !== null && provider.pricing.fixed !== null) {
      score += 15;
      reasons.push("A public base formula is available for initial cost modeling.");
    } else {
      score -= 18;
    }
  }

  const fitSignal = Math.max(18, Math.min(96, score));
  let watchout = provider.limitations[0];
  if (inputs.administration === "high" && provider.model === "direct-payments") {
    watchout = "You marked local seller administration as heavy. Verify whether the retained work offsets the lower direct-payment fee.";
  } else if (inputs.administration === "manageable" && provider.model === "merchant-of-record") {
    watchout = "You marked local seller administration as manageable. Verify that the broader bundled role still justifies the MoR fee.";
  }
  return {
    ...provider,
    fitSignal,
    reasons: [...new Set(reasons)].slice(0, 3),
    watchout
  };
}

export function createProviderMatcher(providers) {
  return {
    inputs: {
      model: "open",
      product: "saas",
      scale: "growing",
      administration: "unknown",
      priority: "simplicity",
      pricing: "any"
    },
    get matches() {
      return providers
        .map((provider) => scoreProvider(provider, this.inputs))
        .sort((a, b) => b.fitSignal - a.fitSignal || a.name.localeCompare(b.name))
        .slice(0, 5);
    },
    reset() {
      this.inputs = { model: "open", product: "saas", scale: "growing", administration: "unknown", priority: "simplicity", pricing: "any" };
    }
  };
}
