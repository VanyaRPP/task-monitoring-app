import { Button, Form, FormInstance, message, Tooltip } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { ServiceType } from '@utils/constants'
import {
  getMaintenanceInvoice,
  getPlacingInvoice,
  getInflicionInvoice,
  getElectricityInvoice,
  getWaterInvoice,
  getWaterPartInvoice,
  getGarbageCollectorInvoice,
  getCleaningInvoice,
  getDiscountInvoice,
} from '@utils/getInvoices'
import { usePaymentContext } from '@components/AddPaymentModal'
import { toArray, toRoundFixed } from '@utils/helpers'
import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { useMemo } from 'react'

const normalizeComparableValue = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? value : +toRoundFixed(value)
  }

  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    !Number.isNaN(+value)
  ) {
    return +toRoundFixed(+value)
  }

  return value
}

interface UpdateInvoiceButtonProps {
  form: FormInstance
  name: string | string[] | number | number[]
  serviceType: ServiceType
  disabled?: boolean
}

const invoiceGetters: {
  [key in ServiceType]?: (props: any) => IPaymentField | undefined
} = {
  [ServiceType.Maintenance]: getMaintenanceInvoice,
  [ServiceType.Placing]: getPlacingInvoice,
  [ServiceType.Inflicion]: getInflicionInvoice,
  [ServiceType.Electricity]: getElectricityInvoice,
  [ServiceType.Water]: getWaterInvoice,
  [ServiceType.WaterPart]: getWaterPartInvoice,
  [ServiceType.GarbageCollector]: getGarbageCollectorInvoice,
  [ServiceType.Cleaning]: getCleaningInvoice,
  [ServiceType.Discount]: getDiscountInvoice,
}

// Fields excluded from the "needs refresh" comparison.
// `sum` is always derived from amount*price, so it's never a real diff.
// `amount` is user-driven for meter-style invoices (electricity, water) — the
// "from-scratch" expected value defaults to lastAmount because the new reading
// is unknown at compute time, but the saved invoice holds the actual reading.
// Without skipping these, the button would flash on every saved meter invoice.
const FIELDS_NEVER_COMPARED = new Set(['type', 'name', 'sum'])
const USER_INPUT_FIELDS_BY_TYPE: Partial<Record<ServiceType, Set<string>>> = {
  [ServiceType.Electricity]: new Set(['amount']),
  [ServiceType.Water]: new Set(['amount']),
}

export default function UpdateInvoiceButton({
  form,
  name: _name,
  serviceType,
  disabled,
}: UpdateInvoiceButtonProps) {
  const { company, service, prevService, prevPayment } = usePaymentContext()
  const name = toArray<string>(_name)

  const currentInvoice = Form.useWatch(['invoice', ...name], form)

  // A Placing row with a valid area was created with the m²×price formula.
  // If the company later gained inflicion=true, getPlacingInvoice would
  // incorrectly switch to the inflicion formula for both comparison and refresh.
  // Strip inflicion from the company view so the m²×price branch is used instead.
  const effectiveCompany = useMemo(() => {
    if (
      serviceType !== ServiceType.Placing ||
      isNaN(+(currentInvoice?.amount ?? NaN)) ||
      +(currentInvoice?.amount ?? 0) <= 0
    ) {
      return company
    }
    return company ? { ...company, inflicion: false } : company
  }, [serviceType, currentInvoice, company])

  const expectedInvoice = useMemo(() => {
    const getInvoice = invoiceGetters[serviceType]
    if (!getInvoice) return null

    const prevInvoicesCollection =
      prevPayment?.invoice?.reduce((acc: any, invoice: IPaymentField) => {
        acc[invoice.name || invoice.type] = invoice
        return acc
      }, {}) || {}

    return getInvoice({
      company: effectiveCompany,
      service,
      prevService,
      currInvoicesCollection: {},
      prevInvoicesCollection,
    })
  }, [effectiveCompany, service, prevService, prevPayment, serviceType])

  const hasChanges = useMemo(() => {
    if (!expectedInvoice) return false

    if (!currentInvoice) return true

    const userInputFields =
      USER_INPUT_FIELDS_BY_TYPE[serviceType] ?? new Set<string>()

    for (const key in expectedInvoice) {
      if (FIELDS_NEVER_COMPARED.has(key)) continue
      if (userInputFields.has(key)) continue

      const expectedValue = expectedInvoice[key as keyof IPaymentField]
      const currentValue = currentInvoice[key as keyof IPaymentField]

      if (expectedValue === undefined || expectedValue === null) continue

      if (currentValue === undefined || currentValue === null) {
        return true
      }

      const expectedRounded = normalizeComparableValue(expectedValue)
      const currentRounded = normalizeComparableValue(currentValue)

      if (expectedRounded !== currentRounded) {
        return true
      }
    }

    return false
  }, [expectedInvoice, currentInvoice, serviceType])

  const handleUpdateClick = () => {
    try {
      const getInvoice = invoiceGetters[serviceType]
      if (!getInvoice) {
        message.error('Функція перерахунку для цього типу сервісу не знайдена.')
        return
      }

      const prevInvoicesCollection =
        prevPayment?.invoice?.reduce((acc: any, invoice: IPaymentField) => {
          acc[invoice.name || invoice.type] = invoice
          return acc
        }, {}) || {}

      const updatedInvoice = getInvoice({
        company: effectiveCompany,
        service,
        prevService,
        currInvoicesCollection: {},
        prevInvoicesCollection,
      })

      if (!updatedInvoice) {
        message.warning('Не вдалося перерахувати рахунок.')
        return
      }

      // Skip the same fields we exclude from the diff: identifiers (type/name),
      // derived (sum — recomputed by Sum.useEffect), and user-driven inputs
      // (amount for electricity/water — clicking Refresh must NOT reset the
      // user's meter reading; only service-driven fields like price/losses
      // should be re-pulled).
      const userInputFields =
        USER_INPUT_FIELDS_BY_TYPE[serviceType] ?? new Set<string>()
      Object.keys(updatedInvoice).forEach((key) => {
        if (FIELDS_NEVER_COMPARED.has(key)) return
        if (userInputFields.has(key)) return
        const value = updatedInvoice[key as keyof IPaymentField]
        if (value !== undefined && value !== null) {
          form.setFieldValue(['invoice', ...name, key], value)
        }
      })

      message.success('Рахунок оновлено успішно.')
    } catch (error) {
      message.error('Помилка оновлення рахунку.')
      console.error(error)
    }
  }

  if (!hasChanges) {
    return null
  }

  return (
    <Tooltip title="Оновити">
      <Button
        icon={<ReloadOutlined />}
        onClick={handleUpdateClick}
        disabled={disabled}
        size="small"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 28,
          width: 28,
          padding: 0,
          borderRadius: 4,
        }}
      />
    </Tooltip>
  )
}
