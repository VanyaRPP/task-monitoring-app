import { QuestionCircleOutlined, SelectOutlined } from '@ant-design/icons'
import { Button, Form, Popover } from 'antd'
import { useRouter } from 'next/router'

import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import MonthServiceSelect from '@common/components/Forms/AddPaymentForm/MonthServiceSelect'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import { AppRoutes } from '@utils/constants'

const InvoicesHeader = () => {
  const router = useRouter()
  const { form } = useInvoicesPaymentContext()

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

      <Button
        type="link"
        onClick={async () => {
          const rest = await form.validateFields()
          debugger
          rest
        }}
      >
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
  // const { service } = useService({ serviceId })

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
