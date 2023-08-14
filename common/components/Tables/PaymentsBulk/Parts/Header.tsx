import { QuestionCircleOutlined, SelectOutlined } from '@ant-design/icons'
import { Button, Popover } from 'antd'
import moment from 'moment'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { DomainSelect } from '@common/components/UI/Select/Domain'
import { ServiceMonthSelect } from '@common/components/UI/Select/Service'
import { StreetSelect } from '@common/components/UI/Select/Street'
import { AppRoutes } from '@utils/constants'

import s from '../style.module.scss'

const Header: React.FC<{
  onFilter?: (domainId, streetId, monthNumber) => void
}> = ({ onFilter }) => {
  const router = useRouter()

  const { data: user } = useGetCurrentUserQuery()

  const [domainId, setDomainId] = useState<string>(null)
  const [streetId, setStreetId] = useState<string>(null)
  const [monthNumber, setMonthNumber] = useState<number>(null)

  const { data: services } = useGetAllServicesQuery({
    userId: user?._id.toString(),
    domainId,
    streetId,
  })

  const onDomainSelect = (value) => setDomainId(value)
  const onStreetSelect = (value) => setStreetId(value)
  const onMonthSelect = (value) => setMonthNumber(value)

  useEffect(() => {
    onFilter && onFilter(domainId, streetId, monthNumber)
  }, [domainId, streetId, monthNumber])

  const popover = (
    <ul>
      {services
        ?.filter((service) => moment(service.date).month() === monthNumber)
        .map((service) => (
          <li key={service._id}>
            {/* TODO: proper popover list item design */}
            {moment(service.date).format('DD MMMM YYYY')} -{' '}
            {service.description}
          </li>
        ))}
    </ul>
  )

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
        <DomainSelect onSelect={onDomainSelect} />
        <StreetSelect onSelect={onStreetSelect} domainId={domainId} />
        <span>
          <ServiceMonthSelect
            onSelect={onMonthSelect}
            domainId={domainId}
            streetId={streetId}
            userId={user?._id.toString()}
          />
          {monthNumber !== null && (
            <Popover content={popover} title="Послуги за місяць">
              <QuestionCircleOutlined style={{ marginLeft: 8 }} />
            </Popover>
          )}
        </span>
      </div>

      <Button className={s.myPayments} type="link" onClick={() => {}}>
        Зберегти
      </Button>
    </div>
  )
}

export default Header
