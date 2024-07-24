import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { isAdminCheck } from '@utils/helpers'
import { Select } from 'antd'
import React from 'react'
import s from './style.module.scss'

interface Props {
  setCompanyId: (companyId: string) => void
}

const PaymentsSelector: React.FC<Props> = ({ setCompanyId }) => {
  const { data: user } = useGetCurrentUserQuery()
  const { data: realEstates } = useGetAllRealEstateQuery({})

  if (isAdminCheck(user?.roles) && realEstates?.data.length > 1) {
    const options = realEstates?.data.map((item) => ({
      value: item._id,
      label: item.companyName,
    }))
    const defaultValue = realEstates?.data[0]._id

    return (
      <Select
        options={options}
        defaultValue={defaultValue}
        className={s.companySelector}
        onChange={setCompanyId}
      />
    )
  }

  return null
}

export default PaymentsSelector
