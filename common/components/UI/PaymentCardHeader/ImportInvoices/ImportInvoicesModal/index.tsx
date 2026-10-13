import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
import CompanySelect from '@components/Forms/AddPaymentForm/CompanySelect'
import { useResolveMonthServiceId } from '@components/Forms/AddPaymentForm/useResolveMonthServiceId'
import Modal from '@components/UI/ModalWindow'
import AddressesSelect from '@components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import PaymentTypeSelect from '@components/UI/Reusable/PaymentTypeSelect'
import useCompany from '@modules/hooks/useCompany'
import {
  getPaymentProviderAndReciever,
  normalizeCurrency,
} from '@utils/helpers'
import { Form, Input, message } from 'antd'
import { useState } from 'react'
import { attachMonthServices, buildImportPayments } from './buildImportPayments'

const ImportInvoicesModal = ({ closeModal }) => {
  const [addPayment, { isLoading }] = useAddPaymentMutation()
  const [form] = Form.useForm()
  const [isValueChanged, setIsValueChanged] = useState(false)
  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const companyId = Form.useWatch('company', form)
  const paymentMethod = Form.useWatch('operation', form)
  const { company } = useCompany({ companyId })
  const { data: newInvoiceNumber = 1 } = useGetPaymentNumberQuery({})
  const resolveMonthServiceId = useResolveMonthServiceId()

  const handleSave = async () => {
    const values = await form.validateFields()
    const { provider, reciever } = getPaymentProviderAndReciever(company)

    const payments = buildImportPayments({
      rows: JSON.parse(values.json),
      firstInvoiceNumber: newInvoiceNumber,
      formData: {
        operation: paymentMethod,
        domain: domainId,
        street: streetId,
        company: companyId,
        currency: normalizeCurrency(company?.currency),
      },
      provider,
      reciever,
    })

    const invoices = await attachMonthServices(payments, (placeholder) =>
      resolveMonthServiceId(placeholder, domainId, streetId)
    ).catch((e) => {
      console.error('resolveMonthServiceId failed', e)
      message.error('Не вдалося підготувати місяць послуг')
      return null
    })
    if (!invoices) return

    message.success(`Рахунків до імпорту: ${invoices.length}`)
    // One after another, so the server numbers them in the file's order.
    const saveAll = async () => {
      const responses: Awaited<ReturnType<typeof addPayment>>[] = []
      for (const invoice of invoices) {
        responses.push(await addPayment(invoice))
      }
      return responses
    }
    await saveAll()
      .then((responses) => {
        responses.forEach((response) => {
          if (response?.data?.success) {
            message.success(
              `Додано рахунок для компанії ${response.data.data.reciever.companyName}`
            )
          } else {
            message.error(`Помилка при додаванні рахунку для компанії`)
          }
        })
      })
      .catch((err) => {
        message.error(err?.message)
      })
    closeModal()
  }

  return (
    <Modal
      title="Імпорт інвойсів"
      onOk={handleSave}
      confirmLoading={isLoading}
      changed={() => isValueChanged}
      onCancel={closeModal}
      okText="Імпортувати"
      cancelText={'Закрити'}
    >
      <Form form={form} onValuesChange={() => setIsValueChanged(true)}>
        <DomainsSelect form={form} />
        <AddressesSelect form={form} />
        <CompanySelect form={form} />
        <PaymentTypeSelect />
        <Form.Item name="json" label="Опис">
          <Input.TextArea rows={20} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ImportInvoicesModal
