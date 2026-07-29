const statusOrder = { documented: 0, limited: 1, review: 2, unavailable: 3 };
const emptyCounts = () => ({ documented: 0, limited: 0, review: 0, unavailable: 0 });

function scopeData(record, scope) {
  return scope === "buyer" ? record.buyer : record;
}

function statusFor(record, country, scope) {
  const data = scopeData(record, scope);
  if (data.unavailable.includes(country)) return "unavailable";
  if (data.limited.includes(country)) return "limited";
  if (data.documented.includes(country)) return "documented";
  return "review";
}

function labelFor(status, scope) {
  if (status === "documented") return scope === "buyer" ? "Can pay" : "Can apply";
  if (status === "limited") return "Limited";
  if (status === "unavailable") return "Not available";
  return "Ask provider";
}

export function createCountryChecker(providers, coverage) {
  const providerMap = new Map(providers.map((provider) => [provider.slug, provider]));

  return {
    country: "US",
    model: "all",
    scope: "seller",
    get countryName() {
      return coverage.countries.find((country) => country.code === this.country)?.name || this.country;
    },
    get countryPrompt() {
      return this.scope === "buyer" ? "Where is your customer?" : "Where is your business registered?";
    },
    get resultTitle() {
      return this.scope === "buyer" ? `Can customers in ${this.countryName} pay?` : `Can your ${this.countryName} business apply?`;
    },
    get resultSummary() {
      if (this.scope === "buyer") {
        return `${this.counts.documented} providers show general customer coverage. Check payment methods and currency before launch.`;
      }
      return `${this.counts.documented} providers list this country for signup. Approval still depends on your business and product.`;
    },
    get results() {
      return coverage.providers
        .map((record) => {
          const provider = providerMap.get(record.slug);
          if (!provider) return null;
          const data = scopeData(record, this.scope);
          const status = statusFor(record, this.country, this.scope);
          return {
            slug: record.slug,
            name: provider.name,
            model: provider.model,
            status,
            statusLabel: labelFor(status, this.scope),
            note: data.note,
            source: data.source
          };
        })
        .filter(Boolean)
        .filter((row) => this.model === "all" || row.model === this.model)
        .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.name.localeCompare(b.name));
    },
    get counts() {
      return this.results.reduce((counts, row) => {
        counts[row.status] += 1;
        return counts;
      }, emptyCounts());
    },
    get countrySummaries() {
      return coverage.countries.map((country) => {
        const counts = coverage.providers.reduce((summary, record) => {
          const provider = providerMap.get(record.slug);
          if (!provider || (this.model !== "all" && provider.model !== this.model)) return summary;
          summary[statusFor(record, country.code, this.scope)] += 1;
          return summary;
        }, emptyCounts());
        return { ...country, counts, total: Object.values(counts).reduce((total, count) => total + count, 0) };
      });
    }
  };
}
