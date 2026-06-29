import {
  PlusOutlined,
  QuestionCircleOutlined,
  SelectOutlined,
} from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import AddDomainModal from '@components/UI/DomainsComponents/DomainModal'
import { AppRoutes, Roles } from '@utils/constants'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

export interface Props {
  currentDomain?: IExtendedDomain | null
  setCurrentDomain?: (domain: IExtendedDomain | null) => void
  setDomainActions: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
    }>
  >
  domainActions: {
    edit: boolean
  }
  children?: React.ReactNode
}

const DomainsHeader: React.FC<Props> = ({
  currentDomain,
  setCurrentDomain,
  domainActions,
  setDomainActions,
  children,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: userResponse } = useGetCurrentUserQuery()
  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = userResponse?.roles?.includes(Roles.DOMAIN_ADMIN)
  const isAdmin = isGlobalAdmin || isDomainAdmin

  const openModal = () => {
    if (setCurrentDomain) setCurrentDomain(null)
    setDomainActions({ edit: true })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    if (setCurrentDomain) setCurrentDomain(null)
    setDomainActions({
      edit: false,
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        position: 'relative',
      }}
    >
      <Button type="link" onClick={() => router.push(AppRoutes.DOMAIN)}>
        Надавачі послуг
        <SelectOutlined />
        <Tooltip title="Надавачі послуг - це організації та компанії, що здійснюють управління та мають під собою менші компанії та об'єкти нерухомості. Управляються адміністраторами">
          <QuestionCircleOutlined />
        </Tooltip>
      </Button>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        {children}
      </div>

      <div>
        {isAdmin && (
          <Button type="link" onClick={openModal}>
            <PlusOutlined /> Додати
          </Button>
        )}
        {(isModalOpen || currentDomain) && (
          <AddDomainModal
            currentDomain={currentDomain as IExtendedDomain}
            closeModal={closeModal}
            editable={domainActions.edit}
          />
        )}
      </div>
    </div>
  )
}

export default DomainsHeader
