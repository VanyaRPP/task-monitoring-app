import React from 'react'
import { useSession } from 'next-auth/react'
import { TaskStatuses } from '../../../utils/constants'
import { useGetAllTaskQuery } from '../../api/taskApi/task.api'
import { useGetUserByEmailQuery } from '../../api/userApi/user.api'

interface IUseTaskFiltration {
  createdByMe?: boolean
  status?: TaskStatuses
}

const useTaskFiltration = (params?: IUseTaskFiltration) => {
  const { createdByMe, status } = params
  const { data } = useGetAllTaskQuery('')
  const session = useSession()
  const currentUser = useGetUserByEmailQuery(session?.data?.user?.email)

  const result = data.data.filter((task) => {
    const createdByMeCondition = !(
      createdByMe && task.creator !== currentUser.currentData.data._id
    )
    const statusCondition = !(status && task.status !== status)

    return createdByMeCondition && statusCondition
  })

  return result
}

export default useTaskFiltration
