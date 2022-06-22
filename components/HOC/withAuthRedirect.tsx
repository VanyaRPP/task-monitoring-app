import { useSession } from "next-auth/react"
import Router from 'next/router'
import Loading from "../Loading"

const withAuthRedirect = (Component: React.ComponentType) => {

    const { data: session, status } = useSession()

    const AuthComponent = (props: any) => {
        if (status === 'unauthenticated') {
            return Router.push('/auth/sigin')
        } else if (status === 'loading') {
            return <Loading />
        } else {
            return <Component {...props} />
        }
    }

    return <AuthComponent />
}

export default withAuthRedirect