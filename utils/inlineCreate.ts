// Sentinel for "create a new entity from a typed name on submit" (lazy create).
// A Select field holding `new::<name>` means the user typed a brand-new name
// that has no id yet; the owning form materializes the real entity on submit
// (see AddPaymentModal). Kept as a string sentinel so the Select can render the
// chosen new value like any other option without extra state.
const NEW_PREFIX = 'new::'

// Note: the name is stored verbatim (no trim) so a controlled inline name input
// can keep whitespace while the user types a multi-word name. Trim where the
// value is consumed (see materializeQuickEntities in AddPaymentModal).
export const makeNewEntityValue = (name: string): string =>
  `${NEW_PREFIX}${name}`

export const isNewEntityValue = (value?: unknown): value is string =>
  typeof value === 'string' && value.startsWith(NEW_PREFIX)

export const getNewEntityName = (value: string): string =>
  isNewEntityValue(value) ? value.slice(NEW_PREFIX.length) : value
