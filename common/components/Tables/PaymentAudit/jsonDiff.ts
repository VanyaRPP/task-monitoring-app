import { alignSequences, repairRuns } from './diffAlign'

export type JsonDiffMarker = ' ' | '-' | '+'

export interface JsonDiffLine {
  text: string
  marker: JsonDiffMarker
  filler: boolean
}

export interface JsonSideDiff {
  before: JsonDiffLine[]
  after: JsonDiffLine[]
}

export const toJsonText = (value: unknown): string =>
  value === null || value === undefined ? '' : JSON.stringify(value, null, 2)

const FILLER: JsonDiffLine = { text: '', marker: ' ', filler: true }

const matchKey = (line: string): string => line.replace(/,$/, '')

const propertyKey = (line: string): string => {
  const property = line.match(/^(\s*)("(?:[^"\\]|\\.)*")\s*:/)
  return property
    ? `${property[1].length}:${property[2]}`
    : `${line.search(/\S|$/)}:~`
}

export const buildJsonSideDiff = (
  before: unknown,
  after: unknown
): JsonSideDiff => {
  const beforeText = toJsonText(before)
  const afterText = toJsonText(after)
  const beforeLines = beforeText ? beforeText.split('\n') : []
  const afterLines = afterText ? afterText.split('\n') : []

  const aligned = repairRuns(
    alignSequences(beforeLines, afterLines, matchKey),
    propertyKey
  )

  const isEdit = (pair: { left?: string; right?: string }): boolean =>
    pair.left !== undefined &&
    pair.right !== undefined &&
    matchKey(pair.left) !== matchKey(pair.right)

  return {
    before: aligned.map((pair) =>
      pair.left === undefined
        ? FILLER
        : {
            text: pair.left,
            marker: pair.right === undefined || isEdit(pair) ? '-' : ' ',
            filler: false,
          }
    ),
    after: aligned.map((pair) =>
      pair.right === undefined
        ? FILLER
        : {
            text: pair.right,
            marker: pair.left === undefined || isEdit(pair) ? '+' : ' ',
            filler: false,
          }
    ),
  }
}
