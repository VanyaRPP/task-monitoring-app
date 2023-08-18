import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import RealEstateModal from '@common/components/UI/RealEstateComponents/RealEstateModal'
import { AppRoutes, Roles } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'

export interface Props {
  showAddButton?: boolean
}

const CompaniesHeader: React.FC<Props> = ({ showAddButton = false }) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: user } = useGetCurrentUserQuery()

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button type="link" onClick={() => router.push(AppRoutes.REAL_ESTATE)}>
        Об'єкти нерухомості
        <SelectOutlined />
      </Button>

      {showAddButton && isAdminCheck(user?.roles) && (
        <>
          <Button type="link" onClick={openModal}>
            <PlusOutlined /> Додати
          </Button>
          <RealEstateModal isModalOpen={isModalOpen} closeModal={closeModal} />
        </>
      )}
    </div>
  )
}

export default CompaniesHeader
