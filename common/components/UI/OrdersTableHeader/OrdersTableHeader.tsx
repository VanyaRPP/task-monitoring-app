import { PlusOutlined, SelectOutlined } from '@ant-design/icons'
import AddTaskModal from '@common/components/AddTaskModal'
import { IUser } from '@common/modules/models/User'
import { AppRoutes } from '@utils/constants'
import { Button } from 'antd'
import { useRouter } from 'next/router'
import React, { FC, useState } from 'react'
import s from './style.module.scss'

interface Props {
  user: IUser
}

const OrdersTableHeader: FC<Props> = ({ user }) => {
  const Router = useRouter()
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  return (
    <div className={s.TableHeader}>
      <Button
        type="link"
        onClick={() => Router.push(`${AppRoutes.TASK}/user/${user?._id}`)}
      >
        Мої замовлення
        <SelectOutlined />
      </Button>
      <Button
        className={s.Button}
        ghost
        type="link"
        onClick={() => setIsModalVisible(!isModalVisible)}
      >
        <PlusOutlined /> Створити замовлення
      </Button>
      <AddTaskModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
      />
    </div>
  )
}

export default OrdersTableHeader
