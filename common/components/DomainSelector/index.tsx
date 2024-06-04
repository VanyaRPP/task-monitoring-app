import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { IDomain } from '@common/modules/models/Domain'
import { isAdminCheck } from '@utils/helpers'
import { Select } from 'antd'
import React from 'react'
import s from './style.module.scss'

interface Props {
  setDomainId: (domainId: string) => void
  domains: IDomain[]
}

const DomainSelector: React.FC<Props> = ({ setDomainId, domains }) => {
  const { data: user } = useGetCurrentUserQuery()

  if (isAdminCheck(user?.roles) && domains?.length > 1) {
    const options = domains.map((domain) => ({
      value: domain._id,
      label: domain.name,
    }))

    const defaultValue = domains[0]._id

    return (
      <Select
        options={options}
        defaultValue={defaultValue}
        className={s.domainSelector}
        onChange={setDomainId}
      />
    )
  }
  return null
}

export default DomainSelector
