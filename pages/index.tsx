import { useSession } from 'next-auth/react'
import HomePage from '../common/components/HomePage'
import DashboardPage from '../common/components/DashboardPage'

const Home: React.FC = () => {
  const { status } = useSession()

  return status === 'authenticated' ? <DashboardPage /> : <HomePage />
}

export default Home
