import React, { FC } from 'react'
import DashboardHeader from '../DashboardHeader'
import PaymentsBlock from './blocks/payments'
import ServicesBlock from './blocks/services'
import s from './style.module.scss'
<<<<<<< HEAD
import Tasks from './blocks/tasks'
import { useGetUserByEmailQuery } from 'common/api/userApi/user.api'
import { useSession } from 'next-auth/react'
import CategoriesBlock from './blocks/categories'
import { TaskButton } from '../UI/Buttons'

const Dashboard: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const session = useSession()
  const userResponse = useGetUserByEmailQuery(session?.data?.user?.email)
  const userRole = userResponse?.data?.data?.role
=======
import RealEstateBlock from './blocks/realEstates'
import { Roles } from '@utils/constants'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
>>>>>>> origin/dev

const Dashboard: FC = () => {
  return (
    <>
<<<<<<< HEAD
      <div className={s.Header}>
        <h1>Дошка</h1>
        <div>
          <Button
            ghost
            type="primary"
            onClick={() => setIsModalVisible(!isModalVisible)}
          >
            Створити завдання
          </Button>
          <TaskButton />
        </div>
      </div>

=======
      <DashboardHeader />
>>>>>>> origin/dev
      <div className={s.Container}>
        <PaymentsBlock />
        <ServicesBlock />
        <RealEstate />
      </div>
    </>
  )
}

export function RealEstate() {
  const { data: userResponse } = useGetCurrentUserQuery()
  const userRole = userResponse?.role

  return userRole === Roles.ADMIN && <RealEstateBlock />
}

export default Dashboard
