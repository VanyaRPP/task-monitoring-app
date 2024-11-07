import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

import AddStreetModal from '@components/AddStreetModal'
import { AppRoutes } from '@utils/constants'

export interface Props {
  showAddButton?: boolean
  streetActions: {
    edit: boolean
    preview: boolean
  }
  setStreetActions: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
      preview: boolean
    }>
  >
  enableStreetsHeaderButton?: boolean
}

const StreetsHeader: React.FC<Props> = ({
  showAddButton = false,
  streetActions,
  setStreetActions,
  enableStreetsHeaderButton,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const closeModal = () => setIsModalOpen(false)
  const openModal = () => {
    setIsModalOpen(true),
      setStreetActions({ ...streetActions, preview: false, edit: true })
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button
        type="link"
        onClick={() => {
          enableStreetsHeaderButton && router.push(AppRoutes.STREETS)
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
      {isModalOpen && (
        <AddStreetModal closeModal={closeModal} streetActions={streetActions} />
      )}
    </div>
  )
}

export default StreetsHeader
