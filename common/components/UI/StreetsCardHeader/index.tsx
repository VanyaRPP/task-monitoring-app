import React, { useState } from 'react'
import s from './style.module.scss'
import { Button } from 'antd'
import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { AppRoutes } from '@utils/constants'
import { useRouter } from 'next/router'
import AddStreetModal from '@common/components/AddStreetModal'

const StreetsCardHeader = () => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    pathname,
    query: { email },
  } = router

  return (
    <>
      <div className={s.tableHeader}>
        <Button
          type="link"
          onClick={() => {
            router.push(AppRoutes.STREETS)
          }}
        >
          Вулиці
          <SelectOutlined className={s.Icon} />
        </Button>
        <Button type="link" onClick={() => setIsModalOpen(true)}>
          <PlusOutlined /> Додати
        </Button>
      </div>
      {isModalOpen && (
        <AddStreetModal closeModal={() => setIsModalOpen(false)} />
      )}
    </>
  )
}
export default StreetsCardHeader
