import { previewOpened, previewReply } from './previewReply'

const step = (...toolNames: string[]) => ({
  toolResults: toolNames.map((toolName) => ({ toolName })),
})

describe('previewOpened', () => {
  it('ends the turn once a form was opened', () => {
    expect(previewOpened({ steps: [step('previewExpenses')] })).toBe(true)
  })

  it('lets the model go on after a lookup, or a preview that failed', () => {
    // A failed tool has no result, only an error: the model asks back.
    expect(previewOpened({ steps: [step('findCompanies')] })).toBe(false)
    expect(previewOpened({ steps: [step()] })).toBe(false)
  })
})

describe('previewReply', () => {
  it('retells an expense list, with its warnings', () => {
    const reply = previewReply('previewExpenses', {
      summary: {
        type: 'debit',
        target: 'Steel Balls',
        lines: 34,
        total: 233271.11,
        currency: 'UAH',
      },
      warnings: ['«Прибирання»: 13*200 = 2600, а вказано 2500'],
    })

    expect(reply).toContain('Я відкрив форму витрат для «Steel Balls»: 34 поз.')
    expect(reply).toMatch(/233\s271,11 UAH/)
    expect(reply).toContain('⚠️ «Прибирання»: 13*200 = 2600, а вказано 2500')
    expect(reply).toContain('натисни «Зберегти»')
  })

  it('names what an invoice will create and the missing email', () => {
    const reply = previewReply('previewInvoice', {
      summary: {
        company: 'Гугл про',
        month: 10,
        year: 2026,
        generalSum: 1008,
        currency: 'USD',
        lines: [
          {
            name: 'Software engineering',
            quantity: 168,
            price: 6,
            sum: 1008,
            description: 'жовтень',
          },
        ],
        willCreate: { domain: 'Олег', company: 'Гугл про', street: null },
        missingCompanyEmail: true,
      },
    })

    expect(reply).toContain('для «Гугл про» за 10.2026: 1 поз.')
    expect(reply).toMatch(
      /• Software engineering \(168 × 6\) — 1\s008 — жовтень/
    )
    expect(reply).toContain(
      'буде створено надавача «Олег», компанію «Гугл про»'
    )
    expect(reply).toContain('Впиши пошту компанії')
    expect(reply).not.toContain('Сума 0')
  })

  it('warns that a zero invoice of an existing company has no tariffs yet', () => {
    const reply = previewReply('previewInvoice', {
      summary: {
        company: 'Acme',
        month: 3,
        year: 2026,
        generalSum: 0,
        lines: [],
        willCreate: {},
      },
    })

    expect(reply).toContain('Послугу за цей місяць ще не заповнено')
  })

  it('says an existing address opened nothing', () => {
    expect(
      previewReply('previewStreet', {
        summary: {
          address: 'вул. Шевченка, 5',
          domain: 'ОСББ',
          alreadyExists: true,
        },
      })
    ).toBe('Адреса «вул. Шевченка, 5» у «ОСББ» вже є — форму не відкривав.')
  })

  it('writes nothing for a tool that opens no form', () => {
    expect(previewReply('findCompanies', { companies: [] })).toBe('')
  })
})
