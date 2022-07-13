import { Result, Button } from 'antd'
import Router from 'next/router'
import { AppRoutes } from '../utils/constants'

const style = {
  color: 'var(--textColor)',
  transition: 'color 0.5s ease-in-out',
}

const NotFoundPage: React.FC = () => {
  return (
    <Result
      status="404"
      title={<h3 style={style}>404</h3>}
      subTitle={
        <p style={style}>Sorry, the page you visited does not exist.</p>
      }
      extra={
        <Button onClick={() => Router.push(AppRoutes.INDEX)} type="primary">
          Back Home
        </Button>
      }
    />
  )
}

export default NotFoundPage
