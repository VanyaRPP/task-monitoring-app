// Shared by the browser print path and the puppeteer download so both lay the
// invoice out on the same page box with the same glyphs. Client-safe: no Node
// imports here.

export const INVOICE_PAGE_MARGIN = {
  top: '12mm',
  right: '14mm',
  bottom: '12mm',
  left: '14mm',
} as const

const { top, right, bottom, left } = INVOICE_PAGE_MARGIN

export const INVOICE_PAGE_CSS = `@page { size: A4; margin: ${top} ${right} ${bottom} ${left}; }`

const FONT_DIR = '/fonts/invoice'

const SUBSETS: { name: string; range: string }[] = [
  {
    name: 'cyrillic-ext',
    range: 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F',
  },
  {
    name: 'cyrillic',
    range: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
  },
  {
    name: 'latin-ext',
    range:
      'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  },
  {
    name: 'latin',
    range:
      'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  },
]

type FontKind = 'sans' | 'serif' | 'mono'

const INVOICE_FONTS: Record<
  FontKind,
  { family: string; file: string; weight: string }
> = {
  sans: { family: 'Invoice Sans', file: 'inter', weight: '100 900' },
  serif: { family: 'Invoice Serif', file: 'noto-serif', weight: '100 900' },
  mono: { family: 'Invoice Mono', file: 'jetbrains-mono', weight: '100 800' },
}

export const INVOICE_FONT_FAMILIES = Object.values(INVOICE_FONTS).map(
  (f) => f.family
)

// Every stack ends in Invoice Sans, so a glyph the first face lacks (₴ in
// JetBrains Mono) still never falls through to an OS font.
const STACKS: Record<FontKind, string> = {
  sans: `'Invoice Sans'`,
  serif: `'Invoice Serif', 'Invoice Sans'`,
  mono: `'Invoice Mono', 'Invoice Sans'`,
}

const SERIF_NAMES = new Set([
  'serif',
  'georgia',
  'cambria',
  'times',
  'times new roman',
  'garamond',
  'noto serif',
  'pt serif',
  'ui-serif',
])
const MONO_PATTERN = /mono|courier|consolas|menlo|monaco|code|^monospace$/

const CSS_WIDE = /^(inherit|initial|unset|revert|revert-layer)$|var\(/

function classifyStack(stack: string): FontKind {
  for (const raw of stack.split(',')) {
    const name = raw
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .toLowerCase()
    if (MONO_PATTERN.test(name)) return 'mono'
    if (SERIF_NAMES.has(name)) return 'serif'
    if (name) return 'sans'
  }
  return 'sans'
}

// Why the rewrite and not aliasing system names with @font-face: stacks also
// come from antd (-apple-system, BlinkMacSystemFont — SF Pro on a Mac, absent
// on the server) and from UA defaults (monospace for <pre>), and neither can be
// redefined. Pinning every declaration to one of three bundled families means
// print and download can only ever render the same glyphs.
export function pinInvoiceFonts(css: string): string {
  return css.replace(/font-family\s*:\s*([^;}]+)/gi, (decl, value: string) => {
    const important = /!important/i.test(value)
    const stack = value.replace(/!important/i, '').trim()
    if (CSS_WIDE.test(stack)) return decl
    const pinned = STACKS[classifyStack(stack)]
    return `font-family: ${pinned}${important ? ' !important' : ''}`
  })
}

// UA stylesheet defaults bypass the rewrite above. :where() keeps these at
// zero specificity so any template rule still wins.
export const INVOICE_FONT_BASE_CSS = [
  `:where(html) { font-family: ${STACKS.sans}; }`,
  `:where(pre, code, kbd, samp, tt) { font-family: ${STACKS.mono}; }`,
  `:where(input, textarea, select, button) { font-family: inherit; }`,
].join('\n')

export const INVOICE_FONT_CSS = Object.values(INVOICE_FONTS)
  .flatMap(({ family, file, weight }) =>
    SUBSETS.map(
      ({ name, range }) =>
        `@font-face { font-family: '${family}'; font-style: normal; font-weight: ${weight}; font-display: block; src: url('${FONT_DIR}/${file}-${name}-wght-normal.woff2') format('woff2'); unicode-range: ${range}; }`
    )
  )
  .join('\n')
