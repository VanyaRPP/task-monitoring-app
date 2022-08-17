import { AppstoreOutlined, ProfileOutlined } from '@ant-design/icons'
import { useGetAllTaskQuery } from '@common/api/taskApi/task.api'
import { Button, Radio, Select } from 'antd'
import { Option } from 'antd/lib/mentions'
import React, { useEffect, useState } from 'react'
import task from '../../../pages/task'
import { TaskView } from '../../../utils/constants'
import useLocalStorage from '../../modules/hooks/useLocalStorage'
import { ITask } from '../../modules/models/Task'
import CardOneTask from '../CardOneTask'
import ListOneTask from '../ListOneTask'
import { BackButton, TaskButton } from '../UI/Buttons'
import TaskViewer from '../UI/Buttons/TaskViewer'
import s from './style.module.scss'

const TouchBar = () => {
  return (
    <div className={s.TouchBar}>
      <BackButton />
      <TaskButton />
    </div>
  )
}

export default TouchBar
