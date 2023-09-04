import { useAddPaymentMutation, useGetPaymentNumberQuery } from '@common/api/paymentApi/payment.api'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { validateField } from '@common/assets/features/validators'
import CompanySelect from '@common/components/Forms/AddPaymentForm/CompanySelect'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import useCompany from '@common/modules/hooks/useCompany'
import { Operations } from '@utils/constants'
import { getPaymentProviderAndReciever } from '@utils/helpers'
import { Button, Form, Input, Modal, Select, message } from 'antd'
import moment from 'moment'

const ImportInvoicesModal = ({ closeModal }) => {
  const [addPayment] = useAddPaymentMutation()
  const [form] = Form.useForm()
  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const companyId = Form.useWatch('company', form)
  const paymentMethod = Form.useWatch('operation', form)
  const { company } = useCompany({ companyId })
  const { data: newInvoiceNumber = 1 } = useGetPaymentNumberQuery({})
  const { data: services } = useGetAllServicesQuery({ domainId, streetId })

  const handleSave = async () => {
    const values = await form.validateFields()

    const invoices = await prepareInvoiceObjects(values, {
      domainId,
      streetId,
      companyId,
      company,
      services,
      paymentMethod,
      newInvoiceNumber,
    })

    const promises = invoices.map(addPayment)
    await Promise.all(promises).then((responses) => {
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
  }

  return (
    <Modal
      open={true}
      title="Імпорт інвойсів"
      onOk={() => {
        handleSave()
        closeModal()
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
        <Form.Item
          name="operation"
          label="Тип оплати"
          rules={validateField('required')}
        >
          <Select
            placeholder="Оберіть тип оплати"
          >
            <Select.Option value={Operations.Credit}>
              Кредит (Оплата)
            </Select.Option>
            <Select.Option value={Operations.Debit}>
              Дебет (Реалізація)
            </Select.Option>
          </Select>
        </Form.Item>
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
  { domainId, streetId, companyId, company, services, paymentMethod, newInvoiceNumber }
) {
  const { provider, reciever } = getPaymentProviderAndReciever(company)

  const invoices = JSON.parse(formData.json).map((i, index) => ({
    invoiceNumber: newInvoiceNumber + index,
    type: paymentMethod,
    invoiceCreationDate: new Date(
      moment(i.monthService, 'DD.MM.YYYY', true).format('YYYY-MM-DD')
    ).toISOString(),
    domain: domainId,
    street: streetId,
    company: companyId,
    monthService:
      services.find(
        (service) =>
          new Date(service.date).getMonth() ===
          new Date(
            moment(i.monthService, 'DD.MM.YYYY', true).format('YYYY-MM-DD')
          ).getMonth()
      ) || '64ea01ca1bf33e3a97b7f289',
    invoice:
      paymentMethod === Operations.Debit
        ? [
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
          ]
        : [],
    provider,
    reciever,
    generalSum: parseStringToFloat(i.generalSum.toString()),
  }))
  return invoices
}

function parseStringToFloat(stringWithComma) {
  const stringWithoutComma = stringWithComma.replace(',', '.')
  return parseFloat(stringWithoutComma)
}
