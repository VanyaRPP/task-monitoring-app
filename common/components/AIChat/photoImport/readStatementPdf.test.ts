import { layoutStatement } from '@common/services/aiAssistant/documents/pdf'
import {
  FixtureRow,
  statementPage,
} from '@common/services/aiAssistant/documents/pdf.fixture'
import { parseStatementCells } from '@utils/debt-calculation/statement'
import { groupStatements, IReadPhoto } from './grouping'
import type { IPdfReadResult } from './readerApi'
import { readStatementPdf } from './readStatementPdf'

// Two made-up flats of one building, three pages each in real exports; two
// pages here, with every kind of payment cell.
const FLAT_7: FixtureRow[][] = [
  [
    {
      period: '8/2018',
      opening: '1200,00',
      correction: '0,00',
      charged: '150,00',
      subsidy: '0',
      closing: '1350,00',
    },
    {
      period: '9/2018',
      opening: '1350,00',
      correction: '5,00',
      charged: '150,00',
      bank: '400,00',
      subsidy: '0',
      closing: '1095,00',
    },
  ],
  [
    {
      period: '10/2018',
      opening: '1095,00',
      correction: '0,00',
      charged: '150,00',
      payment: '95,00',
      subsidy: '0',
      closing: '1150,00',
    },
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
  ],
]
const FLAT_9: FixtureRow[][] = [
  [
    {
      period: '8/2018',
      opening: '80,00',
      correction: '0,00',
      charged: '210,00',
      subsidy: '0',
      closing: '290,00',
    },
    {
      period: '9/2018',
      opening: '290,00',
      correction: '0,00',
      charged: '210,00',
      payment: '500,00',
      subsidy: '0',
      closing: '0,00',
    },
  ],
]

const candidate = {
  id: 'co-7',
  companyName: 'Квартира №7 Коваль О.',
  domainId: 'd-1',
  domainName: 'ОСББ Тестове',
}

/** What /api/documents/read answers for a PDF: the server's layout, plus companies. */
const served = (address: string, pages: FixtureRow[][]): IPdfReadResult => ({
  ...layoutStatement(pages.map((rows) => statementPage(address, rows))),
  candidates: [candidate],
  suggestedCompanyId: address.endsWith('кв. 7') ? 'co-7' : null,
})

const readAll = async (files: Record<string, IPdfReadResult>) => {
  const read: IReadPhoto[] = []
  for (const [name, result] of Object.entries(files)) {
    const pdf = await readStatementPdf(
      { name, url: `data:application/pdf;base64,${name}` },
      {
        readPdf: async () => ({ ok: true, data: result }),
        onProgress: jest.fn(),
      }
    )
    if (pdf) read.push({ ...pdf, jobId: name })
  }
  return groupStatements(read)
}

describe('readStatementPdf', () => {
  it('turns each PDF into one flat statement with the company it points to', async () => {
    const groups = await readAll({
      'кв. 7.pdf': served('вул. Тестова буд. 3 кв. 7', FLAT_7),
      'кв. 9.pdf': served('вул. Тестова буд. 3 кв. 9', FLAT_9),
    })

    expect(groups).toHaveLength(2)
    const [flat7, flat9] = groups
    expect(flat7.header.address).toBe('вул. Тестова буд. 3 кв. 7')
    expect(flat7.suggestedCompanyId).toBe('co-7')
    expect(flat7.issues).toEqual([])
    expect(flat7.rows).toEqual([
      {
        year: 2018,
        month: 8,
        opening: 1200,
        correction: 0,
        charged: 150,
        paid: 0,
        closing: 1350,
      },
      {
        year: 2018,
        month: 9,
        opening: 1350,
        correction: 5,
        charged: 150,
        paid: 400,
        closing: 1095,
      },
      {
        year: 2018,
        month: 10,
        opening: 1095,
        correction: 0,
        charged: 150,
        paid: 95,
        closing: 1150,
      },
      // «Ел. банк» and «Оплата» of one month add up to what was paid.
      {
        year: 2018,
        month: 11,
        opening: 1150,
        correction: 0,
        charged: 175.5,
        paid: 1025.5,
        closing: 300,
      },
    ])
    expect(flat9.rows.map(({ paid }) => paid)).toEqual([0, 500])
  })

  it('gives the card exactly what the same table read off a photo gives', async () => {
    const [fromPdf] = await readAll({
      'кв. 7.pdf': served('вул. Тестова буд. 3 кв. 7', FLAT_7),
    })

    // The photo reader hands over the same table as `cell|cell|…` lines.
    const { columns, pages } = served('вул. Тестова буд. 3 кв. 7', FLAT_7)
    const [fromPhoto] = groupStatements([
      {
        jobId: 'photo',
        name: 'кв. 7.jpg',
        header: fromPdf.header,
        candidates: fromPdf.candidates,
        suggestedCompanyId: fromPdf.suggestedCompanyId,
        strips: pages.map((rows) => parseStatementCells(columns, rows).rows),
        issues: [],
      },
    ])

    const { key: _pdfKey, photoNames: _pdfNames, ...pdfCard } = fromPdf
    const { key: _photoKey, photoNames: _photoNames, ...photoCard } = fromPhoto
    expect(pdfCard).toEqual(photoCard)
  })

  it('asks for photos of a scanned PDF and skips one that is no statement', async () => {
    const onProgress = jest.fn()
    const scan = await readStatementPdf(
      { name: 'скан.pdf', url: '' },
      {
        readPdf: async () => ({
          ok: true,
          data: {
            ...served('', [[]]),
            documentType: 'unknown',
            hasText: false,
          },
        }),
        onProgress,
      }
    )
    expect(scan).toBeNull()
    expect(onProgress).toHaveBeenLastCalledWith({
      status: 'failed',
      error: expect.stringContaining('це скан'),
    })

    const contract = await readStatementPdf(
      { name: 'договір.pdf', url: '' },
      {
        readPdf: async () => ({
          ok: true,
          data: { ...served('', [[]]), documentType: 'unknown' },
        }),
        onProgress,
      }
    )
    expect(contract).toBeNull()
    expect(onProgress).toHaveBeenLastCalledWith({ status: 'unrecognized' })
  })

  it('reports a file the server could not open', async () => {
    const onProgress = jest.fn()
    await readStatementPdf(
      { name: 'зламаний.pdf', url: '' },
      {
        readPdf: async () => ({
          ok: false,
          kind: 'error',
          message: 'Не вдалося відкрити PDF',
        }),
        onProgress,
      }
    )
    expect(onProgress).toHaveBeenLastCalledWith({
      status: 'failed',
      error: 'Не вдалося відкрити PDF',
    })
  })
})
