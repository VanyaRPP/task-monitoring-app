import { Button, message, Steps } from 'antd'
import React, { useState } from 'react'
import ConfirmTask from '../../Forms/ConfirmTask'

const { Step } = Steps

const Steper: React.FC<any> = ({ steps }) => {
  const [current, setCurrent] = useState(0)

  const next = () => {
    setCurrent(current + 1)
  }

  const prev = () => {
    message.error('Error')
  }

  return (
    <>
      <Steps current={current}>
        {steps.map((item) => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      <div className="stepsContent">{steps[current].content}</div>
      <div className="stepsAction">
        {current < 1 && <ConfirmTask next={next} prev={prev} />}
        {current == 1 && (
          <Button type="primary" onClick={() => next()}>
            Наступний крок
          </Button>
        )}
        {/* {current == 2 && (
          <Button type="primary" onClick={() => next()}>
            Отправка форми
          </Button>
        )} */}
      </div>
    </>
  )
}

export default Steper
