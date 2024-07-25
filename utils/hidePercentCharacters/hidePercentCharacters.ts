export const hidePercentCharacters = (input: string): string => {
  const minVisibleLength = 3
  const totalLength = input.length

  // Ensure there are enough characters to hide
  if (totalLength <= 2 * minVisibleLength) {
    return input
  }

  const percentToHide = 0.05
  const hideCount = Math.max(1, Math.floor(totalLength * percentToHide))
  const startIndex = hideCount
  const endIndex = totalLength - hideCount

  // Ensure at least minVisibleLength characters are visible
  const visibleStart = Math.max(startIndex, minVisibleLength)
  const visibleEnd = Math.min(endIndex, totalLength - minVisibleLength)

  return (
    input.slice(0, visibleStart) +
    '*'.repeat(visibleEnd - visibleStart) +
    input.slice(visibleEnd)
  )
}
