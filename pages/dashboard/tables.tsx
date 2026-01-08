import MainLayout from '@common/components/Layouts/Main'
import DashboardPage from '@common/components/DashboardPage'
import { AppRoutes } from '@utils/constants'

export default function TablesPage() {
  return (
    <MainLayout
      path={[
        { title: 'Панель управління', path: AppRoutes.INDEX },
        { title: 'Всі таблиці', path: AppRoutes.TABLES },
      ]}
    >
      <DashboardPage />
    </MainLayout>
  )
}
