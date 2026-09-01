import { useMemo } from 'react'
import { theme } from 'antd'

export interface DiffSidePalette {
  line: string
  word: string
}

export interface DiffColors {
  before: DiffSidePalette
  after: DiffSidePalette
  filler: string
}

export const GITHUB_DIFF_LIGHT: DiffColors = {
  before: { line: '#ffebe9', word: '#ffcecb' },
  after: { line: '#e6ffec', word: '#abf2bc' },
  filler: '#f6f8fa',
}

export const GITHUB_DIFF_DARK: DiffColors = {
  before: { line: 'rgba(248, 81, 73, 0.15)', word: 'rgba(248, 81, 73, 0.4)' },
  after: { line: 'rgba(63, 185, 80, 0.15)', word: 'rgba(63, 185, 80, 0.4)' },
  filler: 'rgba(110, 118, 129, 0.1)',
}

const parseColor = (color: string): [number, number, number] | null => {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const value =
      hex[1].length === 3
        ? hex[1]
            .split('')
            .map((channel) => channel + channel)
            .join('')
        : hex[1]
    return [0, 2, 4].map((offset) =>
      parseInt(value.slice(offset, offset + 2), 16)
    ) as [number, number, number]
  }

  const rgb = color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null
}

export const isDarkSurface = (color: string): boolean => {
  const rgb = parseColor(color)
  if (!rgb) return false

  const [r, g, b] = rgb
  return 0.299 * r + 0.587 * g + 0.114 * b < 128
}

export const pickDiffColors = (surface: string): DiffColors =>
  isDarkSurface(surface) ? GITHUB_DIFF_DARK : GITHUB_DIFF_LIGHT

export const useDiffColors = (): DiffColors => {
  const { token } = theme.useToken()
  return useMemo(
    () => pickDiffColors(token.colorBgContainer),
    [token.colorBgContainer]
  )
}
