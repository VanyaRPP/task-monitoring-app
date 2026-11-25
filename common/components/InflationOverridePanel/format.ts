/** One decimal with a comma, as Derzhstat tables are printed: 104,6. */
export const formatIndex = (value?: number | null): string =>
  value == null ? '—' : value.toFixed(1).replace('.', ',')
