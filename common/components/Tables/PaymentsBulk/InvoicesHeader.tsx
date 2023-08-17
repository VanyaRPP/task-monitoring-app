import { QuestionCircleOutlined, SelectOutlined } from '@ant-design/icons'
import MonthServiceSelect from '@common/components/Forms/AddPaymentForm/MonthServiceSelect'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { AppRoutes } from '@utils/constants'
import { Button, Form, Popover } from 'antd'
import { useRouter } from 'next/router'
import s from './style.module.scss'

const InvoicesHeader = () => {
  const router = useRouter()
  const { form } = useInvoicesPaymentContext()

  return (
    <div className={s.tableHeader}>
      <Button
        className={s.myPayments}
        type="link"
        onClick={() => router.push(AppRoutes.PAYMENT_BULK)}
      >
        Інвойси
        <SelectOutlined className={s.Icon} />
      </Button>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <DomainsSelect form={form} />
        <AddressesSelect form={form} />
        <MonthServiceGeneralInfo />
      </div>

      <Button className={s.myPayments} type="link" onClick={() => {}}>
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
