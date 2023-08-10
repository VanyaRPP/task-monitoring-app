import { SelectOutlined } from '@ant-design/icons'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { AppRoutes, Roles } from '@utils/constants'
import { Button, Select } from 'antd'
import { DefaultOptionType } from 'antd/lib/select'
import moment from 'moment'
import 'moment/locale/uk'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import s from './style.module.scss'

const PaymentBulkCardHeader: React.FC = () => {
  const router = useRouter()

  const [selectedDomain, setSelectedDomain] = useState<null | string>(null)
  const [selectedStreet, setSelectedStreet] = useState<null | string>(null)
  const [selectedDate, setSelectedDate] = useState<null | string>(null)

  const { data: user } = useGetCurrentUserQuery()
  const { data: companies } = useGetAllRealEstateQuery({})
  const { data: domains } = useGetDomainsQuery({})
  const { data: services } = useGetAllServicesQuery({
    userId: user?._id.toString(),
    domainId: selectedDomain,
    streetId: selectedStreet,
  })

  // TODO: transfer to API? (useGetCompanies({userId}))
  const userCompanies = companies?.filter((company) =>
    company.adminEmails.includes(user.email)
  )

  // TODO: transfer to API? (useGetDomains({userId}))
  const userDomains = domains?.filter((domain) => {
    const isUserOwnerOfDomain = userCompanies?.find(
      (company) => company.domain._id === domain._id
    )
    const isAdminInDomain =
      user.roles.includes(Roles.DOMAIN_ADMIN) &&
      domain.adminEmails.includes(user.email)

    return isUserOwnerOfDomain || isAdminInDomain
  })

  const streets: any[] = userDomains?.find(
    (domain) => domain._id === selectedDomain
  )?.streets

  const { data: payments } = useGetAllPaymentsQuery({
    companyIds: userCompanies?.map((company) => company._id),
    domainIds: userDomains?.map((domain) => domain._id),
    month: new Date(selectedDate).getMonth(),
    limit: 10000,
  })

  const domainOptions = userDomains?.map((domain) => ({
    value: domain._id,
    label: domain.name,
  }))

  const streetOptions = streets?.map((street) => ({
    value: street._id,
    label: `${street.address}, м.${street.city}`,
  }))

  const monthOptions = services?.map((service) => ({
    value: service?.date.toString(),
    label: DateToFormattedMonth(service?.date),
  }))

  // predefine domain
  useEffect(() => {
    if (userDomains?.length === 1) {
      setSelectedDomain(userDomains[0]._id)
    }
  }, [userDomains, setSelectedDomain])

  // predefine street
  useEffect(() => {
    if (streets?.length === 1) {
      setSelectedStreet(streets[0]._id)
    }
  }, [streets, setSelectedStreet])

  // predefine month
  useEffect(() => {
    if (services?.length === 1) {
      setSelectedDate(services[0].date.toString())
    }
  }, [services, setSelectedDate])

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

      <ReusableSelect
        placeholder="Домен"
        options={domainOptions}
        value={
          domainOptions?.find((option) => option.value === selectedDomain)
            ?.label
        }
        onSelect={(value) => setSelectedDomain(value)}
      />
      <ReusableSelect
        placeholder="Вулиця"
        options={streetOptions}
        value={
          streetOptions?.find((option) => option.value === selectedStreet)
            ?.label
        }
        onSelect={(value) => setSelectedStreet(value)}
      />
      <ReusableSelect
        placeholder="Послуги за місяць"
        options={monthOptions}
        value={monthOptions?.find((option) => option.value === selectedDate)}
        onSelect={(value) => setSelectedDate(value)}
      />

      <Button className={s.myPayments} type="link" onClick={() => {}}>
        Зберегти
      </Button>
    </div>
  )
}

// TODO: to separated UI file
export interface Props {
  placeholder?: string
  options?: DefaultOptionType[]
  value?: any
  onSelect?: (value) => void
}

export const ReusableSelect: React.FC<Props> = (props) => {
  return (
    <Select
      className={s.select}
      placeholder={props.placeholder}
      disabled={props.options?.length <= 1}
      options={props.options}
      value={props.value}
      onSelect={props.onSelect}
    />
  )
}

// TODO: to helpers
/**
 * Переводить `Date` в `string` місяця на українській і з великої літери
 * @param {Date} date дата
 * @returns форматований місяць
 */
export const DateToFormattedMonth = (date?: Date): string => {
  const month = moment(date).locale('uk').format('MMMM')
  return month[0].toUpperCase() + month.slice(1)
}

export default PaymentBulkCardHeader
