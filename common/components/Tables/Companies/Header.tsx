import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import RealEstateModal from '@common/components/UI/RealEstateComponents/RealEstateModal'
import { AppRoutes, Roles } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'

export interface Props {
  showAddButton?: boolean
  currentRealEstate?: IExtendedRealestate
  setCurrentRealEstate?: (realEstate: IExtendedRealestate) => void
}

const CompaniesHeader: React.FC<Props> = ({
  showAddButton = false,
  currentRealEstate,
  setCurrentRealEstate,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: user } = useGetCurrentUserQuery()

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentRealEstate(null)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button type="link" onClick={() => router.push(AppRoutes.REAL_ESTATE)}>
        Об&apos;єкти нерухомості
        <SelectOutlined />
      </Button>

      {showAddButton && isAdminCheck(user?.roles) && (
        <>
          <Button type="link" onClick={openModal}>
            <PlusOutlined /> Додати
          </Button>
          {(isModalOpen || currentRealEstate) && (
            <RealEstateModal
              closeModal={closeModal}
              currentRealEstate={currentRealEstate}
            />
          )}
        </>
      )}
    </div>
  )
}

export default CompaniesHeader
