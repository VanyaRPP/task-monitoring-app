import { layoutStatement, readPdfStatement } from './pdf'
import { FixtureRow, statementPage } from './pdf.fixture'

jest.mock('unpdf', () => ({ getDocumentProxy: jest.fn() }))

// A made-up flat; the layout is that of a real export.
const ADDRESS = 'вул. Тестова буд. 3 кв. 7'

const FIRST_PAGE: FixtureRow[] = [
  {
    period: '8/2018',
    opening: '1200,00',
    correction: '0,00',
    charged: '150,00',
    subsidy: '0',
    closing: '1350,00',
  },
  // A correction, and a payment through the bank.
  {
    period: '9/2018',
    opening: '1350,00',
    correction: '5,00',
    charged: '150,00',
    bank: '400,00',
    subsidy: '0',
    closing: '1095,00',
  },
  // A payment at the cash desk only.
  {
    period: '10/2018',
    opening: '1095,00',
    correction: '0,00',
    charged: '150,00',
    payment: '95,00',
    subsidy: '0',
    closing: '1150,00',
  },
]
const SECOND_PAGE: FixtureRow[] = [
  // Both payment columns in one month.
  {
    period: '11/2018',
    opening: '1150,00',
    correction: '0,00',
    charged: '175,50',
    bank: '1000,00',
    payment: '25,50',
    subsidy: '0',
    closing: '300,00',
  },
  {
    period: '12/2018',
    opening: '300,00',
    correction: '0,00',
    charged: '175,50',
    subsidy: '0',
    closing: '475,50',
  },
]

describe('layoutStatement', () => {
  const statement = layoutStatement([
    statementPage(ADDRESS, FIRST_PAGE),
    statementPage(ADDRESS, SECOND_PAGE, {
      totals: {
        correction: '5,00',
        charged: '801,00',
        bank: '1400,00',
        payment: '120,50',
        subsidy: '0',
      },
    }),
  ])

  it('reads the header and the titles printed on two lines', () => {
    expect(statement.documentType).toBe('debtMonthlyStatement')
    expect(statement.hasText).toBe(true)
    expect(statement.header).toEqual({
      address: ADDRESS,
      apartment: '7',
      ownerName: null,
      accountNumber: null,
    })
    expect(statement.columns).toEqual([
      'М/Рік',
      'Вхідне сальдо',
      'Коректура',
      'Нарахування',
      'Ел. банк',
      'Оплата',
      'Субсидія',
      'Вихідне сальдо',
    ])
  })

  it('puts each figure under its own column and leaves blank cells empty', () => {
    expect(statement.pages).toEqual([
      [
        '8/2018|1200,00|0,00|150,00|||0|1350,00',
        '9/2018|1350,00|5,00|150,00|400,00||0|1095,00',
        '10/2018|1095,00|0,00|150,00||95,00|0|1150,00',
      ],
      [
        '11/2018|1150,00|0,00|175,50|1000,00|25,50|0|300,00',
        // The totals line under the table is not a month.
        '12/2018|300,00|0,00|175,50|||0|475,50',
      ],
    ])
  })

  it('keeps the columns for a page that repeats no titles', () => {
    const continued = layoutStatement([
      statementPage(ADDRESS, FIRST_PAGE),
      statementPage(ADDRESS, SECOND_PAGE, { titles: false }),
    ])
    expect(continued.pages[1][0]).toBe(
      '11/2018|1150,00|0,00|175,50|1000,00|25,50|0|300,00'
    )
  })

  it('tells a scan, with no text, from a PDF that is not a statement', () => {
    expect(
      layoutStatement([[], [{ str: ' ', x: 0, y: 0, width: 1 }]])
    ).toMatchObject({
      documentType: 'unknown',
      hasText: false,
    })
    expect(
      layoutStatement([
        [
          { str: 'Договір оренди №12', x: 20, y: 800, width: 120 },
          { str: '1/2024 сторони домовились', x: 20, y: 780, width: 160 },
        ],
      ])
    ).toMatchObject({ documentType: 'unknown', hasText: true, pages: [] })
  })
})

describe('readPdfStatement', () => {
  it('reads the positions from the PDF text and skips marked content', async () => {
    const { getDocumentProxy } = jest.requireMock('unpdf')
    const page = statementPage(ADDRESS, FIRST_PAGE.slice(0, 1))
    getDocumentProxy.mockResolvedValue({
      numPages: 1,
      getPage: async () => ({
        getTextContent: async () => ({
          items: [
            { type: 'beginMarkedContent', id: 'mc0' },
            ...page.map(({ str, x, y, width }) => ({
              str,
              width,
              transform: [1, 0, 0, 1, x, y],
            })),
          ],
        }),
      }),
    })

    const statement = await readPdfStatement(new Uint8Array([1]))

    expect(statement.pages).toEqual([
      ['8/2018|1200,00|0,00|150,00|||0|1350,00'],
    ])
  })
})
