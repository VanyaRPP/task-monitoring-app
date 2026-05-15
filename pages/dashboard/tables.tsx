import MainLayout from '@common/components/Layouts/Main'
import DashboardPage from '@common/components/DashboardPage'
import { AppRoutes } from '@utils/constants'
import Head from 'next/head'

export default function TablesPage() {
  return (
    <>
      <Head>
        <title>Всі таблиці</title>
      </Head>
      <MainLayout
        path={[
          { title: 'Панель управління', path: AppRoutes.INDEX },
          { title: 'Всі таблиці', path: AppRoutes.TABLES },
        ]}
      >
        <DashboardPage />
      </MainLayout>
    </>
  )
}
