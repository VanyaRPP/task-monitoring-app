import { Result, Button } from 'antd'
import Router from 'next/router'

const NotFoundPage: React.FC = () => {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={<Button onClick={() => Router.push('/')} type="primary">Back Home</Button>}
    />
  )
}

export default NotFoundPage