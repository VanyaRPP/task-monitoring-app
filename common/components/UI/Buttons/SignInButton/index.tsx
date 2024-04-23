import { FC } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from 'antd'
import { GoogleOutlined, GithubFilled, FacebookFilled } from '@ant-design/icons'
import s from './style.module.scss'

interface Props {
  provider: any
}

const Icons = {
  google: <GoogleOutlined />,
  github: <GithubFilled />,
  facebook: <FacebookFilled />,
}

const SingInBtn: FC<Props> = ({ provider }) => {
  return (
    <Button
      className={s.Button}
      data-e2e={provider?.name}
      onClick={() => signIn(provider?.id)}
      block
    >
      <span style={{ fontSize: '1.2rem' }}>
        {Icons[provider?.name.toLowerCase()]}
      </span>
      <span>Увійти з {provider?.name}</span>
    </Button>
  )
}

export default SingInBtn
