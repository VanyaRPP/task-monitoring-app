import { SelectOutlined, LoadingOutlined } from '@ant-design/icons'
import {
  useAddPaymentMutation,
  useGetPaymentNumberQuery,
} from '@common/api/paymentApi/payment.api'
import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import MonthServiceSelect from '@common/components/Forms/AddPaymentForm/MonthServiceSelect'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import { AppRoutes, Operations } from '@utils/constants'
import { getPaymentProviderAndReciever, toRoundFixed } from '@utils/helpers'
import { Button, message, Spin } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'
import styles from './styles.module.scss'

const InvoicesHeader = () => {
  const router = useRouter()
  const { form, companies, service } = useInvoicesPaymentContext()
  const [addPayment] = useAddPaymentMutation()
  const { data: newInvoiceNumber = 1 } = useGetPaymentNumberQuery({})
  const [isLoading, setIsLoading] = useState(false)

  const handleClickSaveButton = async () => {
    try {
      setIsLoading(true)
      await handleSave()
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    const values = await form.validateFields()

    const payments = values.payments?.map((payment, index) => {
      const { provider, reciever } = getPaymentProviderAndReciever(
        companies?.find(({ _id }) => payment.company?._id === _id)
      )

      const invoice = Object.values(payment.invoice || {}).filter(
        ({ sum }) => sum
      )

      const generalSum = invoice.reduce(
        (acc: number, invoice: IPaymentField) => {
          return acc + (+invoice.sum || 0)
        },
        0
      )

      return {
        invoiceNumber: newInvoiceNumber + index,
        type: Operations.Debit,
        domain: service?.domain?._id,
        street: service?.street?._id,
        company: payment.company?._id,
        monthService: service?._id,
        invoiceCreationDate: new Date(),
        description: '',
        generalSum: +toRoundFixed(generalSum),
        provider,
        reciever,
        invoice,
      }
    })

    const responses = await Promise.all(payments.map(addPayment))
    const allSuccessful = responses.every((response) => response.data?.success)

    responses.forEach((response) => {
      if (response.data?.success) {
        message.success(
          `Додано рахунок для компанії ${response.data?.data.reciever.companyName}`
        )
      } else {
        message.error(`Помилка при додаванні рахунку для компанії`)
      }
    })

    if (allSuccessful) router.push(AppRoutes.PAYMENT)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Button type="link" onClick={() => router.push(AppRoutes.PAYMENT_BULK)}>
        Інвойси
        <SelectOutlined />
      </Button>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <DomainsSelect form={form} />
        <AddressesSelect
          form={form}
          // dropdownStyle={{ minWidth: 'max-content' }}
        />
        <MonthServiceGeneralInfo />
      </div>

      <Button
        type="link"
        disabled={isLoading}
        onClick={handleClickSaveButton}
        className={styles.saveButton}
      >
        {isLoading ? (
          <Spin indicator={<LoadingOutlined spin />} size="small" />
        ) : (
          `Зберегти`
        )}
      </Button>
    </div>
  )
}

function MonthServiceGeneralInfo() {
  const { form } = useInvoicesPaymentContext()

  // const serviceId = Form.useWatch('monthService', form)

  return (
    <span style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ minWidth: '120px' }}>
        <MonthServiceSelect form={form} />
      </div>
      {/* {serviceId && (
        <Popover
          content={<PopoverMonthService serviceId={serviceId} />}
          title="Послуги за місяць"
        >
          <QuestionCircleOutlined style={{ marginLeft: 16 }} />
        </Popover>
      )} */}
    </span>
  )
}

export default InvoicesHeader
