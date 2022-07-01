import { Result, Button } from 'antd'
import Router from 'next/router'
import { AppRoutes } from '../utils/constants'

const NotFoundPage: React.FC = () => {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Button onClick={() => Router.push(AppRoutes.INDEX)} type="primary">
          Back Home
        </Button>
      }
    />
  )
}

export default NotFoundPage
