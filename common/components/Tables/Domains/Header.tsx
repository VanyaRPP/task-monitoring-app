import {
  PlusOutlined,
  QuestionCircleOutlined,
  SelectOutlined,
} from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

import AddDomainModal from '@common/components/UI/DomainsComponents/DomainModal'
import { AppRoutes } from '@utils/constants'

const DomainsHeader = () => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button type="link" onClick={() => router.push(AppRoutes.DOMAIN)}>
        Домени
        <SelectOutlined />
        <Tooltip title="Домени - це організації та компанії, що здійснюють управління та мають під собою менші компанії та об'єкти нерухомості. Управляються адміністраторами">
          <QuestionCircleOutlined />
        </Tooltip>
      </Button>

      <>
        <Button type="link" onClick={openModal}>
          <PlusOutlined /> Додати
        </Button>
        <AddDomainModal isModalOpen={isModalOpen} closeModal={closeModal} />
      </>
    </div>
  )
}

export default DomainsHeader
