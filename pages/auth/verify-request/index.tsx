import { useRouter } from 'next/router'
import { AppRoutes } from '../../../utils/constants'
import { Button } from 'antd'
import s from './style.module.scss'

const Verify: React.FC = () => {
  const router = useRouter()

  return (
    <div>
      <h2 className={s.Header}>Підтвердіть свою електронну пошту</h2>
      <p className={s.Text}>
        Ми надіслали Вам повідомлення на вашу електронну пошту.
        <br />
        Підтвердіть свою електронну адресу, дотримуючись інструкцій у
        повідомленні.
      </p>

      <div className={s.Buttons}>
        {/* <Button
          type="primary"
          size="large"
          style={{ width: '100px' }}
          onClick={() => {
            // TODO: redirect to user email page
          }}
          className={s.Buttons}
        >
          Підтвердити
        </Button> */}

        {/* <div className={s.Divider} /> */}

        <Button
          type="primary"
          ghost
          size="large"
          style={{ width: '100px' }}
          onClick={() => router.push(AppRoutes.INDEX)}
          className={s.Buttons}
        >
          Повернутись
        </Button>
      </div>
    </div>
  )
}

export default Verify
