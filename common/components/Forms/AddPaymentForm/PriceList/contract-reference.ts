import dayjs from 'dayjs'

// Users type the number in different shapes ("15", "№ 15", "No. 15"); the act
// renders its own "№" prefix, so strip any leading one to avoid doubling it.
const stripNumberSign = (value: string): string =>
  value.trim().replace(/^(№|No\.?)\s*/i, '')

/**
 * Builds the phrase the act uses to point at the governing contract, e.g.
 * "Договору № 15 від 01.03.2026". Each part is optional: with nothing stored
 * the act falls back to the generic "Договору" it used before the contract
 * fields existed.
 */
export const getContractReference = (
  contractNumber: string | undefined,
  contractDate: string | Date | undefined,
  isEnglish: boolean
): string => {
  const number = stripNumberSign(contractNumber ?? '')
  const date =
    contractDate && dayjs(contractDate).isValid()
      ? dayjs(contractDate).format('DD.MM.YYYY')
      : ''

  const base = isEnglish ? 'the Agreement' : 'Договору'
  const numberPart = number
    ? isEnglish
      ? ` No. ${number}`
      : ` № ${number}`
    : ''
  const datePart = date ? (isEnglish ? ` dated ${date}` : ` від ${date}`) : ''

  return `${base}${numberPart}${datePart}`
}
