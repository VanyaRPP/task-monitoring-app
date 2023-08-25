import { QuestionCircleOutlined, SelectOutlined } from '@ant-design/icons'
import { Button, Form, FormInstance, Popover } from 'antd'
import { useRouter } from 'next/router'

import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import MonthServiceSelect from '@common/components/Forms/AddPaymentForm/MonthServiceSelect'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import { AppRoutes } from '@utils/constants'

const InvoicesHeader = () => {
  const router = useRouter()
  const { form } = useInvoicesPaymentContext()

  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)
  const serviceId = Form.useWatch('monthService', form)

  const handleSave = async () => {
    const invoices = await prepareInvoiceObjects(form)
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
        <AddressesSelect form={form} />
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
      <MonthServiceSelect form={form} />
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

const prepareInvoiceObjects = async (form: FormInstance): Promise<any[]> => {
  const values = await form.validateFields()
  const invoices: any[] = Object.values(values.companies)

  return invoices.map((invoice) => ({
    maintenancePrice: {
      amount: invoice.totalArea,
      ...invoice.maintenancePrice,
    },
    placingPrice: {
      amount: invoice.totalArea,
      ...invoice.placingPrice,
    },

    electricityPrice: invoice.electricityPrice,
    waterPrice: invoice.waterPrice,
    waterPart: invoice.waterPart,

    garbageCollectorPrice: {
      price: invoice.garbageCollector,
      sum: invoice.garbageCollector,
    },
    inflictionPrice: {
      price: invoice.inflictionPrice,
      sum: invoice.inflictionPrice,
    },
    // TODO: proper fields
  }))
}
