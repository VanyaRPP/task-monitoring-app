import { AppRoutes } from '@utils/constants'
import dynamic from 'next/dynamic'
import Router from 'next/router'
import s from './404.module.scss'

const Result = dynamic(() => import('antd').then(mod => mod.Result), {
  ssr: false,
})

const Button = dynamic(() => import('antd').then(mod => mod.Button), {
  ssr: false,
})

const NotFoundPage: React.FC = () => {
  return (
    <div className={s.NotFound}>
      <div className={s.GlassCard}>
        <Result
          status="404"
          title={<h1 className={s.Title}>404</h1>}
          subTitle={
            <p className={s.SubTitle}>
              Вибачте, сторінка, яку ви відвідали, не існує.
            </p>
          }
          extra={
            <Button
              className={s.Button}
              onClick={() => Router.push(AppRoutes.INDEX)}
            >
              Назад
            </Button>
          }
        />
      </div>
    </div>
  )
}

export default NotFoundPage