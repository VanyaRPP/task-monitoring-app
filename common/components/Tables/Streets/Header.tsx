import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

import AddStreetModal from '@common/components/AddStreetModal'
import { AppRoutes } from '@utils/constants'
import { IStreet } from '@common/api/streetApi/street.api.types'

export interface Props {
  showAddButton?: boolean
  currentStreet?: IStreet
  setCurrentStreet?: (service: IStreet) => void
  streetActions?: {
    edit: boolean
    preview: boolean
  }
  setStreetActions: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
      preview: boolean
    }>
  >
}

const StreetsHeader: React.FC<Props> = ({
  showAddButton = false,
  currentStreet,
  setCurrentStreet,
  streetActions,
  setStreetActions,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentStreet(null)
    setStreetActions({
      edit: false,
      preview: false,
    })
  }

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
      {(isModalOpen || currentStreet) && (
        <AddStreetModal
          currentStreet={currentStreet}
          closeModal={closeModal}
          streetActions={streetActions}
        />
      )}
    </div>
  )
}

export default StreetsHeader
