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

export default function UpdateInvoiceButton({
  form,
  name: _name,
  serviceType,
  disabled,
}: UpdateInvoiceButtonProps) {
  const { company, service, prevService, prevPayment } = usePaymentContext()
  const name = toArray<string>(_name)

  const expectedInvoice = useMemo(() => {
    const getInvoice = invoiceGetters[serviceType]
    if (!getInvoice) return null

    const prevInvoicesCollection =
      prevPayment?.invoice?.reduce((acc: any, invoice: IPaymentField) => {
        acc[invoice.name || invoice.type] = invoice
        return acc
      }, {}) || {}

    return getInvoice({
      company,
      service,
      prevService,
      currInvoicesCollection: {},
      prevInvoicesCollection,
    })
  }, [company, service, prevService, prevPayment, serviceType])

  const currentInvoice = Form.useWatch(['invoice', ...name], form)

  const hasChanges = useMemo(() => {
    if (!expectedInvoice) return false
    
    if (!currentInvoice) return true

    for (const key in expectedInvoice) {
      if (key === 'type' || key === 'name') continue
      
      const expectedValue = expectedInvoice[key as keyof IPaymentField]
      const currentValue = currentInvoice[key as keyof IPaymentField]

      if (expectedValue === undefined || expectedValue === null) continue

      if (currentValue === undefined || currentValue === null) {
        return true
      }

      const expectedRounded = typeof expectedValue === 'number' 
        ? +toRoundFixed(expectedValue) 
        : expectedValue
      const currentRounded = typeof currentValue === 'number' 
        ? +toRoundFixed(currentValue) 
        : currentValue

      if (expectedRounded !== currentRounded) {
        return true
      }
    }

    return false
  }, [expectedInvoice, currentInvoice])

  const handleUpdateClick = () => {
    try {
      const getInvoice = invoiceGetters[serviceType]
      if (!getInvoice) {
        message.error('Функція перерахунку для цього типу сервісу не знайдена.')
        return
      }

      const currentInvoices = form.getFieldValue('invoice') || []
      const currInvoicesCollection =
        currentInvoices.reduce((acc: any, invoice: IPaymentField) => {
          acc[invoice.name || invoice.type] = invoice
          return acc
        }, {})

      const prevInvoicesCollection =
        prevPayment?.invoice?.reduce((acc: any, invoice: IPaymentField) => {
          acc[invoice.name || invoice.type] = invoice
          return acc
        }, {}) || {}

      const updatedInvoice = getInvoice({
        company,
        service,
        prevService,
        currInvoicesCollection: {},
        prevInvoicesCollection,
      })

      if (!updatedInvoice) {
        message.warning('Не вдалося перерахувати рахунок.')
        return
      }

      Object.keys(updatedInvoice).forEach((key) => {
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

