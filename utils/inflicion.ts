export function getInflicionValue(mainSum, inflicionPrice) {
  const percent = inflicionPrice - 100
  const inflicionValue = (mainSum * percent) / 100
  if (inflicionValue < 0) return '0.00'
  return inflicionValue.toFixed(2)
}
