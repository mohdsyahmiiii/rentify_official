// Malaysian Ringgit currency utilities
export const CURRENCY = {
  code: "MYR",
  symbol: "RM",
  name: "Malaysian Ringgit",
  locale: "ms-MY",
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: "currency",
    currency: CURRENCY.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000) {
    return new Intl.NumberFormat(CURRENCY.locale, {
      style: "currency",
      currency: CURRENCY.code,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount)
  }
  return formatCurrency(amount)
}

export function parseCurrency(value: string): number {
  // Remove currency symbols and parse
  const cleanValue = value.replace(/[RM\s,]/g, "")
  return Number.parseFloat(cleanValue) || 0
}

// Convert from other currencies to MYR (you can update these rates)
export const EXCHANGE_RATES = {
  USD_TO_MYR: 4.7,
  EUR_TO_MYR: 5.1,
  SGD_TO_MYR: 3.5,
  GBP_TO_MYR: 5.9,
}
