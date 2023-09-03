import { useAddPaymentMutation } from '@common/api/paymentApi/payment.api'
import CompanySelect from '@common/components/Forms/AddPaymentForm/CompanySelect'
import JsonViewer from '@common/components/UI/JsonViewer'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import useCompany from '@common/modules/hooks/useCompany'
import { Operations } from '@utils/constants'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { Button, Form, Input, Modal } from 'antd'

const ImportInvoicesModal = ({ closeModal }) => {
  const [addPayment] = useAddPaymentMutation()
  const [form] = Form.useForm()
  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const companyId = Form.useWatch('company', form)
  const { company } = useCompany({ companyId })

  const handleSave = async () => {
    const values = await form.validateFields()

    const invoices = await prepareInvoiceObjects(values, {
      domainId,
      streetId,
      companyId,
      company,
    })
    const promises = invoices.map(addPayment)
    const response = await Promise.all(promises)
  }

  return (
    <Modal
      open={true}
      title="Імпорт інвойсів"
      onOk={() => {
        handleSave()
        // closeModal()
      }}
      onCancel={() => {
        closeModal()
      }}
      okText="Імпортувати"
      cancelText={'Закрити'}
    >
      <Form form={form}>
        <DomainsSelect form={form} />
        <AddressesSelect form={form} />
        <CompanySelect form={form} />
        <JsonViewer json={null} />
      </Form>
    </Modal>
  )
}

export default ImportInvoicesModal

function prepareInvoiceObjects(
  formData,
  { domainId, streetId, companyId, company }
) {
  const { provider, reciever } = getPaymentProviderAndReciever(company)

  const invoices = JSON.parse(formData.json).map((i, index) => ({
    invoiceNumber: index + 1,
    type: Operations.Credit,
    invoiceCreationDate: new Date(i.monthService).toISOString(),
    domain: domainId,
    street: streetId,
    company: companyId,
    // monthService: '64ea01ca1bf33e3a97b7f289',
    invoice: [
      {
        type: 'maintenancePrice',
        sum: parseStringToFloat(i.maintenancePrice),
      },
      {
        type: 'placingPrice',
        sum: parseStringToFloat(i.placingPrice),
      },
      {
        type: 'electricityPrice',
        lastAmount: parseStringToFloat(i.electricityPriceLastAmount),
        amount: parseStringToFloat(i.electricityPriceAmount),
        price: parseStringToFloat(i.electricityPricePrice),
        sum: parseStringToFloat(i.electricityPriceSum),
      },
      {
        type: 'waterPrice',
        sum: parseStringToFloat(i.waterPriceSum),
      },
      {
        type: 'inflicionPrice',
        sum: parseStringToFloat(i.inflicionPrice),
      },
    ],
    provider,
    reciever,
    generalSum: parseStringToFloat(i.generalSum),
  }))
  return invoices
}

function parseStringToFloat(stringWithComma) {
  const stringWithoutComma = stringWithComma.replace(',', '.')
  return parseFloat(stringWithoutComma)
}
