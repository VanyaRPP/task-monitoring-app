export interface AlignedPair<T> {
  left?: T
  right?: T
}

export function alignSequences<T>(
  left: T[],
  right: T[],
  keyOf: (item: T, index: number) => string
): AlignedPair<T>[] {
  const n = left.length
  const m = right.length
  const result: AlignedPair<T>[] = []

  if (n * m > 1_000_000) {
    for (let i = 0; i < Math.max(n, m); i += 1) {
      result.push({ left: left[i], right: right[i] })
    }
    return result
  }

  const a = left.map(keyOf)
  const b = right.map(keyOf)
  const width = m + 1
  const dp = new Int32Array((n + 1) * width)

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i * width + j] =
        a[i] === b[j]
          ? dp[(i + 1) * width + j + 1] + 1
          : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1])
    }
  }

  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result.push({ left: left[i], right: right[j] })
      i += 1
      j += 1
    } else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) {
      result.push({ left: left[i] })
      i += 1
    } else {
      result.push({ right: right[j] })
      j += 1
    }
  }
  while (i < n) {
    result.push({ left: left[i] })
    i += 1
  }
  while (j < m) {
    result.push({ right: right[j] })
    j += 1
  }

  return result
}

export function repairRuns<T>(
  pairs: AlignedPair<T>[],
  keyOf: (item: T) => string
): AlignedPair<T>[] {
  const result: AlignedPair<T>[] = []
  let index = 0

  while (index < pairs.length) {
    if (pairs[index].left && pairs[index].right) {
      result.push(pairs[index])
      index += 1
      continue
    }

    let end = index
    while (end < pairs.length && !(pairs[end].left && pairs[end].right)) {
      end += 1
    }

    const run = pairs.slice(index, end)
    const removals = run.flatMap((pair) => (pair.left ? [pair.left] : []))
    const additions = run.flatMap((pair) => (pair.right ? [pair.right] : []))

    removals.forEach((removed) => {
      const matchIndex = additions.findIndex(
        (added) => keyOf(added) === keyOf(removed)
      )
      if (matchIndex >= 0) {
        result.push({ left: removed, right: additions[matchIndex] })
        additions.splice(matchIndex, 1)
      } else {
        result.push({ left: removed })
      }
    })
    additions.forEach((added) => result.push({ right: added }))

    index = end
  }

  return result
}
