import { useSession } from 'next-auth/react'
import React from 'react'
import HomePage from '../components/HomePage'
import DashboardPage from '../components/DashboardPage'

export default function Home() {
  const { status } = useSession()

  return status === 'authenticated' ? <DashboardPage /> : <HomePage />
}
