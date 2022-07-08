import { FC } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '../../../utils/constants'
import { Button } from 'antd'
import styles from './style.module.scss'

const Verify: FC = () => {
  const router = useRouter()

  return (
    <div>
      <h2 className={styles.Header}>Verify your E-Mail</h2>
      <p className={styles.Text}>
        We have sent you a message by email.
        <br />
        Please verify your email by following the instructions in the message.
      </p>

      <div className={styles.Buttons}>
        <Button
          type="primary"
          size="large"
          style={{ width: '100px' }}
          onClick={() => {
            // TODO: redirect to user email page
          }}
        >
          Verify
        </Button>

        <div className={styles.Divider} />

        <Button
          type="default"
          size="large"
          style={{ width: '100px' }}
          onClick={() => router.push(AppRoutes.INDEX)}
        >
          Return
        </Button>
      </div>
    </div>
  )
}

export default Verify
