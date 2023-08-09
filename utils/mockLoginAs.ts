import { getServerSession } from 'next-auth'
import { Roles } from '@utils/constants'

export const mockLoginAs = async (mockUser: {
  email: string
  roles: Roles[]
}): Promise<void> =>
  await (getServerSession as any).mockResolvedValueOnce({ user: mockUser })
