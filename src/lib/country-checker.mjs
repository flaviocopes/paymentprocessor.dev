const statusOrder = { documented: 0, limited: 1, review: 2, unavailable: 3 };

export function createCountryChecker(providers, coverage) {
  const providerMap = new Map(providers.map((provider) => [provider.slug, provider]));
  return {
    country: "US",
    model: "all",
    get countryName() {
      return coverage.countries.find((country) => country.code === this.country)?.name || this.country;
    },
    get results() {
      return coverage.providers
        .map((record) => {
          const provider = providerMap.get(record.slug);
          if (!provider) return null;
          let status = "review";
          if (record.unavailable.includes(this.country)) status = "unavailable";
          if (record.documented.includes(this.country)) status = record.limited.includes(this.country) ? "limited" : "documented";
          return {
            ...record,
            name: provider.name,
            model: provider.model,
            status,
            statusLabel: status === "documented" ? "Documented market" : status === "limited" ? "Limited / preview" : status === "unavailable" ? "Not supported" : "Verify with provider"
          };
        })
        .filter(Boolean)
        .filter((row) => this.model === "all" || row.model === this.model)
        .sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.name.localeCompare(b.name));
    },
    get counts() {
      return this.results.reduce((counts, row) => ({ ...counts, [row.status]: counts[row.status] + 1 }), { documented: 0, limited: 0, review: 0, unavailable: 0 });
    }
  };
}
