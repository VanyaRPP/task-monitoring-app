import { AppRoutes } from '@utils/constants'
import { useSession } from 'next-auth/react'
import Router from 'next/router'
import Preloader from '../UI/Buttons/Preloader'

const withAuthRedirect = (Component: React.ComponentType) => {
  const ProtectedComponent = (props: any) => {
    const { status } = useSession({
      required: true,
      onUnauthenticated() {
        Router.push(AppRoutes.AUTH_SIGN_IN)
      },
    })

    if (status === 'loading') {
      return <Preloader />
    }

    return <Component {...props} />
  }

  return ProtectedComponent
}

export default withAuthRedirect
