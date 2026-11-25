export const ELECTRICITY_VAT_MULTIPLIER = 1.2

export const getPriceWithoutVat = (priceWithVat: number): number =>
  priceWithVat / ELECTRICITY_VAT_MULTIPLIER

export const getTotalWithVat = (totalWithoutVat: number): number =>
  totalWithoutVat * ELECTRICITY_VAT_MULTIPLIER

interface ILossesInput {
  /** Tariff, UAH per kWh, VAT included */
  priceWithVat?: number | null
  /** Consumed, kWh */
  consumed?: number | null
  /** Billed total, UAH without VAT */
  totalWithoutVat?: number | null
}

/**
 * Losses in the transformer, lines and reactive power, %: how much the billed
 * total exceeds "tariff × consumed". `null` until all three inputs are filled -
 * a missing total would otherwise read as -100%.
 */
export const getLossesPercent = ({
  priceWithVat,
  consumed,
  totalWithoutVat,
}: ILossesInput): number | null => {
  if (!priceWithVat || !consumed || !totalWithoutVat) return null

  const totalFromTariff = getPriceWithoutVat(priceWithVat) * consumed

  return (totalWithoutVat / totalFromTariff - 1) * 100
}
