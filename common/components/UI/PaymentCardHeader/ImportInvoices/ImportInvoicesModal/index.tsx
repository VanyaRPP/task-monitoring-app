import {
  useAddPaymentMutation,
  useGetPaymentNumberQuery,
} from '@common/api/paymentApi/payment.api'
import CompanySelect from '@common/components/Forms/AddPaymentForm/CompanySelect'
import Modal from '@common/components/UI/ModalWindow'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import PaymentTypeSelect from '@common/components/UI/Reusable/PaymentTypeSelect'
import useCompany from '@common/modules/hooks/useCompany'
import { Operations } from '@utils/constants'
import {
  getPaymentProviderAndReciever,
  importedPaymentDateToISOStringDate,
  toRoundFixed,
} from '@utils/helpers'
import { Form, Input, message } from 'antd'

const ImportInvoicesModal = ({ closeModal }) => {
  const [addPayment, { isLoading }] = useAddPaymentMutation()
  const [form] = Form.useForm()
  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const companyId = Form.useWatch('company', form)
  const paymentMethod = Form.useWatch('operation', form)
  const { company } = useCompany({ companyId })
  const { data: newInvoiceNumber = 1 } = useGetPaymentNumberQuery({})

  const handleSave = async () => {
    const values = await form.validateFields()

    const invoices = await prepareInvoiceObjects(values, {
      domainId,
      streetId,
      companyId,
      company,
      paymentMethod,
      newInvoiceNumber,
    })
    message.success(`Рахунків до імпорту: ${invoices.length}`)
    const promises = invoices.map(addPayment)
    await Promise.all(promises)
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
      changesForm={() => form.isFieldsTouched()}
      onCancel={closeModal}
      okText="Імпортувати"
      cancelText={'Закрити'}
    >
      <Form form={form}>
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

function prepareInvoiceObjects(
  formData,
  { domainId, streetId, companyId, company, paymentMethod, newInvoiceNumber }
) {
  const { provider, reciever } = getPaymentProviderAndReciever(company)

  const invoices = JSON.parse(formData.json).map((i, index) => ({
    invoiceNumber: newInvoiceNumber + index,
    type: paymentMethod,
    invoiceCreationDate: importedPaymentDateToISOStringDate(i.monthService),
    domain: domainId,
    street: streetId,
    company: companyId,
    invoice:
      paymentMethod === Operations.Debit ? getInvoiceInfo(i, company) : [],
    provider,
    reciever,
    generalSum: toRoundFixed(i.generalSum.toString()),
  }))

  return invoices
}

function getInvoiceInfo(i, company) {
  const res = [
    {
      type: 'maintenancePrice',
      amount: company?.totalArea,
      price: (+toRoundFixed(i.maintenancePrice) / company?.totalArea).toFixed(
        2
      ),
      sum: toRoundFixed(i.maintenancePrice),
    },
    {
      type: 'placingPrice',
      amount: company?.totalArea,
      price: (+toRoundFixed(i.placingPrice) / company?.totalArea).toFixed(2),
      sum: toRoundFixed(i.placingPrice),
    },
    {
      type: 'electricityPrice',
      lastAmount: toRoundFixed(i.electricityPriceLastAmount),
      amount: toRoundFixed(i.electricityPriceAmount),
      price: toRoundFixed(i.electricityPricePrice),
      sum: toRoundFixed(i.electricityPriceSum),
    },
    {
      type: 'waterPrice',
      price: toRoundFixed(i.waterPriceSum),
      sum: toRoundFixed(i.waterPriceSum),
    },
  ]

  if (company?.inflicion) {
    res.push({
      type: 'inflicionPrice',
      price: '0',
      sum: toRoundFixed(i.inflicionPrice),
    })
  }

  if (i.custom) {
    res.push({
      type: 'custom',
      sum: toRoundFixed(i.custom),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      name: 'Донарахування',
    })
  }

  return res
}
