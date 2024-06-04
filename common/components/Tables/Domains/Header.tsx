import {
  PlusOutlined,
  QuestionCircleOutlined,
  SelectOutlined,
} from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

import AddDomainModal from '@common/components/UI/DomainsComponents/DomainModal'
import { IDomain } from '@common/modules/models/Domain'
import { AppRoutes } from '@utils/constants'

export interface Props {
  currentDomain?: IDomain
  setCurrentDomain?: (domain: IDomain) => void
}

const DomainsHeader: React.FC<Props> = ({
  currentDomain,
  setCurrentDomain,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentDomain(null)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button type="link" onClick={() => router.push(AppRoutes.DOMAIN)}>
        Надавачі послуг
        <SelectOutlined />
        <Tooltip title="Надавачі послуг - це організації та компанії, що здійснюють управління та мають під собою менші компанії та об'єкти нерухомості. Управляються адміністраторами">
          <QuestionCircleOutlined />
        </Tooltip>
      </Button>

      <>
        <Button type="link" onClick={openModal}>
          <PlusOutlined /> Додати
        </Button>
        {(isModalOpen || currentDomain) && (
          <AddDomainModal
            currentDomain={currentDomain}
            closeModal={closeModal}
          />
        )}
      </>
    </div>
  )
}

export default DomainsHeader
