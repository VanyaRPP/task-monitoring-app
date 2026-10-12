/**
 * @jest-environment node
 */
import { readdirSync } from 'fs'
import path from 'path'
import postcss, { AtRule, Node, Rule } from 'postcss'
import { compile } from 'sass'
import {
  INVOICE_FONT_FAMILIES,
  INVOICE_PAGE_CSS,
} from '@utils/pdf/invoicePageStyle'
import { buildStandaloneHtml, stripPageRules } from '../captureInvoiceHtml'

const TEMPLATES_DIR = __dirname
const GLOBALS = path.resolve(__dirname, '../../../../../styles/globals.scss')

const templateStylesheets = readdirSync(TEMPLATES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((dir) =>
    readdirSync(path.join(TEMPLATES_DIR, dir.name))
      .filter((file) => file.endsWith('.scss'))
      .map((file) => ({
        name: dir.name,
        file: path.join(TEMPLATES_DIR, dir.name, file),
      }))
  )

// Everything collectAppCss() can pick up while an invoice is on screen.
const stylesheets = [...templateStylesheets, { name: 'globals', file: GLOBALS }]

const compileCss = (file: string) => compile(file).css

const isInPrint = (rule: Rule) => {
  let node: Node | undefined = rule.parent
  while (node) {
    if (node.type === 'atrule' && /print/.test((node as AtRule).params)) {
      return true
    }
    node = node.parent
  }
  return false
}

const classesOf = (selector: string) => selector.match(/\.[\w-]+/g) ?? []

describe('invoice page box', () => {
  it('finds every template stylesheet', () => {
    expect(templateStylesheets.map((s) => s.name).sort()).toEqual(
      expect.arrayContaining([
        'azure',
        'classic',
        'editorial',
        'ledger',
        'monoline',
        'official',
        'olimp',
        'softcard',
        'swiss',
        'techstudio',
      ])
    )
  })

  it.each(stylesheets)(
    '$name declares no @page of its own (margins live in INVOICE_PAGE_MARGIN)',
    ({ file }) => {
      expect(compileCss(file)).not.toMatch(/@page\b/)
    }
  )

  it.each(stylesheets)(
    '$name: the captured invoice has exactly one page box — ours',
    ({ file }) => {
      const html = buildStandaloneHtml('<div>x</div>', compileCss(file))

      expect(html.match(/@page\b/g)).toHaveLength(1)
      expect(html).toContain(INVOICE_PAGE_CSS)
    }
  )

  it.each(stylesheets)(
    '$name: every font in the captured invoice is a bundled one',
    ({ file }) => {
      const html = buildStandaloneHtml('<div>x</div>', compileCss(file))
      const ownFaces = html.match(/@font-face\s*\{[^}]*\}/g) ?? []
      // Only the bundled faces may exist — an app face (Work Sans) renamed
      // into an invoice family would silently change the glyphs.
      for (const face of ownFaces) {
        expect(face).toMatch(/url\('\/fonts\/invoice\//)
      }
      const css = html.replace(/@font-face\s*\{[^}]*\}/g, '')
      const stacks = [...css.matchAll(/font-family\s*:\s*([^;}]+)/g)]
        .map((m) => m[1].replace(/!important/, '').trim())
        .filter((stack) => !/^(inherit|initial|unset)$|var\(/.test(stack))

      expect(stacks.length).toBeGreaterThan(0)
      for (const stack of stacks) {
        for (const name of stack.split(',')) {
          expect(INVOICE_FONT_FAMILIES).toContain(
            name.trim().replace(/^'|'$/g, '')
          )
        }
      }
    }
  )

  it.each(templateStylesheets)(
    '$name: scrollable table wrappers stop clipping in print',
    ({ file }) => {
      const root = postcss.parse(compileCss(file))
      const scrollable = new Set<string>()
      const visibleInPrint = new Set<string>()

      root.walkRules((rule) => {
        const overflow = rule.nodes
          .filter((n) => n.type === 'decl' && /^overflow(-x)?$/.test(n.prop))
          .map((n) =>
            n.type === 'decl' ? n.value.replace(/\s*!important/, '') : ''
          )
        const target = classesOf(rule.selector).at(-1)
        if (!target) return

        if (isInPrint(rule)) {
          if (overflow.includes('visible')) visibleInPrint.add(target)
        } else if (overflow.includes('auto') || overflow.includes('scroll')) {
          scrollable.add(target)
        }
      })

      // An overflow box clips the table's outer border at the page edge.
      const clipped = [...scrollable].filter((c) => !visibleInPrint.has(c))
      expect(clipped).toEqual([])
    }
  )
})

describe('stripPageRules', () => {
  it('drops top-level and nested @page rules but keeps the rest', () => {
    const css = [
      '@page { margin: 0 !important; }',
      '@media print { @page :first { margin: 0; } .a { color: red; } }',
      '.b { margin: 0; }',
      "@font-face { font-family: 'Work Sans'; src: url(/w.ttf); }",
    ].join('\n')

    const stripped = stripPageRules(css)

    expect(stripped).not.toMatch(/@page\b|@font-face/)
    expect(stripped).toContain('.a { color: red; }')
    expect(stripped).toContain('.b { margin: 0; }')
  })
})
