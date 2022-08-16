import { Select } from 'antd'
import { Option } from 'antd/lib/mentions'
import React, { useEffect, useState } from 'react'
import ListOneTask from '../ListOneTask'
import { BackButton, TaskButton } from '../UI/Buttons'
import s from './style.module.scss'

const TouchBar = () => {
  // const [select, setSelect] = useState('card')
  // //
  // const onChange = async (e : )
  return (
    <div className={s.TouchBar}>
      <BackButton />
      {/* <Select className={s.Select} onChange={(e) => setSelect(e.target.value)}> */}
      {/* <Select className={s.Select}>
        <Option value="list">Список</Option>
        <Option value="card">Картка</Option>
      </Select> */}
      <TaskButton />
    </div>
  )
}

export default TouchBar
