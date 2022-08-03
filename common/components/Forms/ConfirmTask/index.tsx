import { Button } from 'antd'
import React from 'react'
import s from './style.module.scss'

const ConfirmTask: React.FC<any> = ({ next, prev }) => {
  return (
    <>
      <div className={s.Buttons}>
        <Button type="primary" onClick={() => next()}>
          Сподобалось
        </Button>
        <Button type="primary" onClick={() => prev()}>
          Не сподобалось
        </Button>
      </div>
    </>
  )
}

export default ConfirmTask
