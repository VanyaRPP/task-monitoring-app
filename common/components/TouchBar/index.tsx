import React from 'react'
import { BackButton, TaskButton } from '../UI/Buttons'
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