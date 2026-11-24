'use client'

import dynamic from 'next/dynamic'
import { useIsAdmin } from '@modules/hooks/useIsAdmin'

const AIChat = dynamic(() => import('@components/AIChat'), { ssr: false })

const LazyAIChat: React.FC = () => {
  const { isAdmin } = useIsAdmin()

  return isAdmin ? <AIChat /> : null
}

export default LazyAIChat
