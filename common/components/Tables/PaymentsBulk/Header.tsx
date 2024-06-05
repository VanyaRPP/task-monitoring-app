import { QuestionCircleOutlined, SelectOutlined } from '@ant-design/icons'
import { Button, Form, FormInstance, Popover, message } from 'antd'
import { useRouter } from 'next/router'

import {
  useAddPaymentMutation,
  useGetPaymentNumberQuery,
} from '@common/api/paymentApi/payment.api'
import { IRealEstate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import MonthServiceSelect from '@common/components/Forms/AddPaymentForm/MonthServiceSelect'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import { AppRoutes, Operations } from '@utils/constants'
import {
  filterInvoiceObject,
  getPaymentProviderAndReciever,
} from '@utils/helpers'

const InvoicesHeader = () => {
  const router = useRouter()
  const { form, companies, service } = useInvoicesPaymentContext()
  const [addPayment] = useAddPaymentMutation()
  const { data: newInvoiceNumber = 1 } = useGetPaymentNumberQuery({})
  const handleSave = async () => {
    const invoices = await prepareInvoiceObjects(
      form,
      service,
      companies,
      newInvoiceNumber
    )

    const promises = invoices.map(addPayment)
    await Promise.all(promises).then((responses) => {
      const allSuccessful = responses.every((response) => response.data.success)

      responses.forEach((response) => {
        if (response.data.success) {
          message.success(
            `Додано рахунок для компанії ${response.data.data.reciever.companyName}`
          )
        } else {
          message.error(`Помилка при додаванні рахунку для компанії`)
        }
      })

      if (allSuccessful) router.push(AppRoutes.PAYMENT)
    })
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
        <div style={{ width: '250px' }}>
          <AddressesSelect
            form={form}
            dropdownStyle={{ minWidth: 'max-content' }}
          />
        </div>
        <MonthServiceGeneralInfo />
      </div>

      <Button type="link" onClick={handleSave}>
        Зберегти
      </Button>
    </div>
  )
}

function MonthServiceGeneralInfo() {
  const { form } = useInvoicesPaymentContext()

  const serviceId = Form.useWatch('monthService', form)

  return (
    <span style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ minWidth: '120px' }}>
        <MonthServiceSelect form={form} />
      </div>
      {serviceId && (
        <Popover
          content={<PopoverMonthService serviceId={serviceId} />}
          title="Послуги за місяць"
        >
          <QuestionCircleOutlined style={{ marginLeft: 16 }} />
        </Popover>
      )}
    </span>
  )
}

function PopoverMonthService(serviceId: any) {
  // const { service } = ({ serviceId })

  return (
    <>
      <strong>TODO:</strong> content
    </>
  )

  // return (
  //   <ul>
  //     {services
  //       ?.filter((service) => moment(service.date).month() === monthNumber)
  //       .map((service) => (
  //         <li key={service._id}>
  //           {moment(service.date).format('DD MMMM YYYY')} -{' '}
  //           {service.description}
  //         </li>
  //       ))}
  //   </ul>
  // )
}

export default InvoicesHeader

const validateInvoice = (invoice, service) => {
  const result: any = {
    maintenancePrice: {
      amount: invoice.totalArea,
      ...invoice.maintenancePrice,
    },
    placingPrice: {
      amount: invoice.totalArea,
      ...invoice.placingPrice,
    },

    electricityPrice: {
      ...invoice.electricityPrice,
      price: service?.electricityPrice,
    },
    inflicionPrice: {
      price: invoice.inflicionPrice,
      sum: invoice.inflicionPrice,
    },
  }

  if (invoice.garbageCollector.sum > 0) {
    result.garbageCollectorPrice = {
      amount: invoice.garbageCollector.amount,
      sum: invoice.garbageCollector.sum,
    }
  }

  if (invoice.cleaningPrice > 0) {
    result.cleaningPrice = {
      price: invoice.cleaningPrice,
      sum: invoice.cleaningPrice,
    }
  }

  if (invoice.discount < 0) {
    result.discount = {
      price: invoice.discount,
      sum: invoice.discount,
    }
  }

  if (invoice.waterPart && invoice.waterPart.sum > 0) {
    result.waterPart = {
      price: invoice.waterPart.price,
      sum: invoice.waterPart.sum,
    }
  } else {
    result.waterPrice = {
      ...invoice.waterPrice,
      price: service?.waterPrice,
    }
  }

  return result
}

const prepareInvoiceObjects = async (
  form: FormInstance,
  service: IService,
  companies: IRealEstate[],
  newInvoiceNumber: number
): Promise<any> => {
  const values = await form.validateFields()
  return Object.keys(values.companies).map((key, index) => {
    const invoice = values.companies[key]
    const company = companies.find(
      (company) => company.companyName === values.companies[key].companyName
    )
    const { provider, reciever } = getPaymentProviderAndReciever(company)

    const filteredInvoice = filterInvoiceObject(
      validateInvoice(invoice, service)
    )
    return {
      invoiceNumber: newInvoiceNumber + index,
      type: Operations.Debit,
      domain: service?.domain,
      street: service?.street,
      company: company?._id,
      monthService: service?._id,
      invoiceCreationDate: new Date(),
      description: '',
      generalSum:
        filteredInvoice
          .reduce((acc, val) => acc + (+val.sum || 0), 0)
          .toFixed(2) || 0,
      provider,
      reciever,
      invoice: filteredInvoice,
    }
  })
}
