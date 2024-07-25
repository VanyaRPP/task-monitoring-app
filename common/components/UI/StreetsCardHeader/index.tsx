import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import AddStreetModal from '@components/AddStreetModal'
import { AppRoutes } from '@utils/constants'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import s from './style.module.scss'

interface StreetsCardHeaderProps {
  showAddButton?: boolean
}

const StreetsCardHeader: React.FC<StreetsCardHeaderProps> = ({
  showAddButton = true,
}) => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <div className={s.tableHeader}>
        <Button
          type="link"
          onClick={() => {
            router.push(AppRoutes.STREETS)
          }}
        >
          Адреси
          <SelectOutlined className={s.Icon} />
        </Button>
        {showAddButton && (
          <Button type="link" onClick={handleClick}>
            <PlusOutlined /> Додати
          </Button>
        )}
      </div>
      {isModalOpen && (
        <AddStreetModal closeModal={() => setIsModalOpen(false)} />
      )}
    </>
  )
}
export default StreetsCardHeader
