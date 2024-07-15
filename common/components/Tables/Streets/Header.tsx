import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

import AddStreetModal from '@common/components/AddStreetModal'
import { AppRoutes } from '@utils/constants'

export interface Props {
  showAddButton?: boolean
}

const StreetsHeader: React.FC<Props> = ({ showAddButton = false }) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button
        type="link"
        onClick={() => {
          router.push(AppRoutes.STREETS)
        }}
      >
        Адреси
        <SelectOutlined />
      </Button>

      {showAddButton && (
        <Button type="link" onClick={openModal}>
          <PlusOutlined /> Додати
        </Button>
      )}
      {isModalOpen && <AddStreetModal closeModal={closeModal} />}
    </div>
  )
}

export default StreetsHeader
