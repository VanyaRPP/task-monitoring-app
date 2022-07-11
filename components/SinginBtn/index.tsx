import { FC } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from 'antd'
import { GoogleOutlined, GithubFilled, FacebookFilled } from '@ant-design/icons'

interface Props {
  provider: any
}

const Icons = {
  google: <GoogleOutlined style={{ fontSize: '1.2rem' }} />,
  github: <GithubFilled style={{ fontSize: '1.2rem' }} />,
  facebook: <FacebookFilled style={{ fontSize: '1.2rem' }} />,
}

const SinginBtn: FC<Props> = ({ provider }) => {
  return (
    <Button
      style={{ margin: 5, display: 'flex', paddingLeft: '4rem' }}
      onClick={() => signIn(provider?.id)}
      block
    >
      {Icons[provider?.name.toLowerCase()]}
      Sign in with {provider?.name}
    </Button>
  )
}

export default SinginBtn
