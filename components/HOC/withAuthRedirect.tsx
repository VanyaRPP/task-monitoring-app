import { useSession } from 'next-auth/react'
import Router from 'next/router'
import Loading from '../Loading'

const withAuthRedirect = (Component: React.ComponentType) => {
  const ProtectedComponent = (props: any) => {
    const { status } = useSession({
      required: true,
      onUnauthenticated() {
        Router.push('/api/auth/signin')
      },
    })

    if (status === 'loading') {
      return <Loading />
    }

    return <Component {...props} />
  }

  return ProtectedComponent
}

export default withAuthRedirect
