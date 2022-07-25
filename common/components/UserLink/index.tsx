import Link from 'next/link'
import { IUser } from '../../modules/models/User'

const UserLink: React.FC<{ user: IUser }> = ({ user }) => {
  if (user) {
    return <Link href={`/profile/${user?._id}`}>{user?.name}</Link>
  }

  return null
}

export default UserLink
