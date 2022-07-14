import { useSession } from 'next-auth/react'
import HomePage from '../components/HomePage'
import DashboardPage from '../components/DashboardPage'

const Home: React.FC = () => {
  const { status } = useSession()

  return status === 'authenticated' ? <DashboardPage /> : <HomePage />
}

export default Home
