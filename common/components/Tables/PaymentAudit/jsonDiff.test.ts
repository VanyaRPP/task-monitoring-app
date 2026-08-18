import { buildJsonSideDiff, toJsonText } from './jsonDiff'

const textOf = (lines: { text: string; filler: boolean }[]) =>
  lines
    .filter((line) => !line.filler)
    .map((line) => line.text)
    .join('\n')

const markedAs = (lines: { text: string; marker: string }[], marker: string) =>
  lines.filter((line) => line.marker === marker).map((line) => line.text.trim())

describe('buildJsonSideDiff', () => {
  it('keeps both sides byte-identical to what the JSON tab prints', () => {
    const before = { a: 1, b: 2 }
    const after = { a: 1, c: 3 }
    const diff = buildJsonSideDiff(before, after)

    expect(textOf(diff.before)).toBe(toJsonText(before))
    expect(textOf(diff.after)).toBe(toJsonText(after))
  })

  it('aligns both sides row for row with fillers', () => {
    const diff = buildJsonSideDiff({ a: 1 }, { a: 1, b: 2 })

    expect(diff.before).toHaveLength(diff.after.length)
    expect(diff.before.filter((line) => line.filler)).toHaveLength(1)
    expect(diff.after.filter((line) => line.filler)).toHaveLength(0)
  })

  it('marks removed lines with - and added lines with +', () => {
    const diff = buildJsonSideDiff({ a: 1, b: 2 }, { a: 1, c: 3 })

    expect(markedAs(diff.before, '-')).toEqual(['"b": 2'])
    expect(markedAs(diff.after, '+')).toEqual(['"c": 3'])
    expect(markedAs(diff.before, '+')).toEqual([])
    expect(markedAs(diff.after, '-')).toEqual([])
  })

  it('marks a changed value on both sides', () => {
    const diff = buildJsonSideDiff({ generalSum: 500 }, { generalSum: 600 })

    expect(markedAs(diff.before, '-')).toEqual(['"generalSum": 500'])
    expect(markedAs(diff.after, '+')).toEqual(['"generalSum": 600'])
  })

  it('marks nothing when the snapshots are identical', () => {
    const diff = buildJsonSideDiff({ a: 1 }, { a: 1 })

    expect(diff.before.every((line) => line.marker === ' ')).toBe(true)
    expect(diff.after.every((line) => line.marker === ' ')).toBe(true)
    expect(diff.before.some((line) => line.filler)).toBe(false)
  })

  it('handles a missing side', () => {
    const diff = buildJsonSideDiff(undefined, { a: 1 })

    expect(diff.before.every((line) => line.filler)).toBe(true)
    expect(diff.after.every((line) => line.marker === '+')).toBe(true)
  })
})
