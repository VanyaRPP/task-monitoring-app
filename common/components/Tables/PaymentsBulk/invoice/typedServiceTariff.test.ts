import { resolveTypedServiceTariff } from './typedServiceTariff'

const SERVICE_ID = '68a0000000000000000000a1'
const FIELD_NAME = 'elektrykasklad'

const entry = (price: unknown, over: Record<string, unknown> = {}) => ({
  _id: SERVICE_ID,
  label: 'Електрика (склад)',
  fieldName: FIELD_NAME,
  price,
  ...over,
})

const target = { serviceId: SERVICE_ID, fieldName: FIELD_NAME }

describe('resolveTypedServiceTariff', () => {
  it('бере індивідуальний тариф компанії, коли він заданий', () => {
    expect(
      resolveTypedServiceTariff(
        {
          company: { customServices: [entry(6)] },
          service: { customServices: [entry(8)] },
        },
        target
      )
    ).toBe(6)
  })

  it('падає на місячний тариф, коли в компанії 0 (авто-роздача бекендом)', () => {
    expect(
      resolveTypedServiceTariff(
        {
          company: { customServices: [entry(0)] },
          service: { customServices: [entry(8)] },
        },
        target
      )
    ).toBe(8)
  })

  it.each([[null], [undefined], ['']])(
    'падає на місячний тариф, коли в компанії price = %p',
    (price) => {
      expect(
        resolveTypedServiceTariff(
          {
            company: { customServices: [entry(price)] },
            service: { customServices: [entry(8)] },
          },
          target
        )
      ).toBe(8)
    }
  )

  it('падає на місячний тариф, коли компанія не має запису послуги', () => {
    expect(
      resolveTypedServiceTariff(
        {
          company: { customServices: [] },
          service: { customServices: [entry(8)] },
        },
        target
      )
    ).toBe(8)
  })

  it('матчить за _id, навіть коли fieldName збігається в різних послуг', () => {
    const otherMeter = entry(99, { _id: '68a0000000000000000000b2' })

    expect(
      resolveTypedServiceTariff(
        {
          company: { customServices: [otherMeter, entry(6)] },
          service: { customServices: [entry(8)] },
        },
        target
      )
    ).toBe(6)
  })

  it('не бере тариф іншого лічильника з тим самим fieldName', () => {
    expect(
      resolveTypedServiceTariff(
        {
          company: {
            customServices: [entry(99, { _id: '68a0000000000000000000b2' })],
          },
          service: { customServices: [entry(8)] },
        },
        target
      )
    ).toBe(8)
  })

  it('матчить за fieldName для легасі-записів без _id', () => {
    expect(
      resolveTypedServiceTariff(
        {
          company: { customServices: [entry(6, { _id: undefined })] },
          service: { customServices: [] },
        },
        target
      )
    ).toBe(6)
  })

  it('повертає 0, коли тарифу немає ніде', () => {
    expect(
      resolveTypedServiceTariff({ company: {}, service: {} }, target)
    ).toBe(0)
    expect(resolveTypedServiceTariff({}, target)).toBe(0)
  })
})
