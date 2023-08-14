import { QuestionCircleOutlined, SelectOutlined } from '@ant-design/icons'
import MonthServiceSelect from '@common/components/Forms/AddPaymentForm/MonthServiceSelect'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import { useInvoicesPaymentContext } from '.'
import { AppRoutes } from '@utils/constants'
import { Button, Form, Popover } from 'antd'
import { useRouter } from 'next/router'
import s from './style.module.scss'

const Header = () => {
  const router = useRouter()
  const { form } = useInvoicesPaymentContext()
  // const streetId = Form.useWatch('street', form)
  // const domainId = Form.useWatch('domain', form)

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
  const serviceId = Form.useWatch('service', form)
  // console.log('serviceId', serviceId)

  return (
    <span>
      <MonthServiceSelect form={form} />
      {serviceId && (
        <Popover content={<PopoverMonthService />} title="Послуги за місяць">
          <QuestionCircleOutlined style={{ marginLeft: 8 }} />
        </Popover>
      )}
    </span>
  )
}

function PopoverMonthService() {
  return (
    <ul>
      asd
      {/* {services
    ?.filter((service) => moment(service.date).month() === monthNumber)
    .map((service) => (
      <li key={service._id}>
        {moment(service.date).format('DD MMMM YYYY')} -{' '}
        {service.description}
      </li>
    ))} */}
    </ul>
  )
}

export default Header
