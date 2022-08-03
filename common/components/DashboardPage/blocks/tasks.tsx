import React, { useMemo, useState } from 'react'
import { Card, Table, Input, Button } from 'antd'
import { useGetAllTaskQuery } from '../../../api/taskApi/task.api'
import { firstTextToUpperCase } from '../../../../utils/helpers'
import {
  useGetUserByEmailQuery,
  useGetUserByIdQuery,
} from '../../../api/userApi/user.api'
import moment from 'moment'
import Router, { useRouter } from 'next/router'
import { AppRoutes } from '../../../../utils/constants'

import s from '../style.module.scss'
import { useSession } from 'next-auth/react'
import MicroInfoProfile from '../../MicroInfoProfile'

const Tasks: React.FC = () => {
  return <></>
}

export default Tasks
