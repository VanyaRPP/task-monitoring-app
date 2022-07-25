import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { IUser } from '../../modules/models/User'

const UserLink: React.FC<{ user: IUser }> = ({ user }) => {
  const { data: session } = useSession()

  if (user) {
    return (
      <Link
        href={
          user?.email === session?.user?.email
            ? '/profile/'
            : `/profile/${user?._id}`
        }
      >
        {user?.name}
      </Link>
    )
  }

  return null
}

export default UserLink
