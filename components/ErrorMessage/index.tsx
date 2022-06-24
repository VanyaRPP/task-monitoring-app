import { message } from 'antd'
import React from 'react'

interface Props {
  error: string
}

const ErrorMessage: React.FC<Props> = ({ error }) => {
  return (
    <>
      {message.error(error)}
    </>
  )
}

export default ErrorMessage