import { FC } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from 'antd'
import { createFromIconfontCN } from '@ant-design/icons'


interface Props {
  provider: any
}
const IconFont = createFromIconfontCN({
  scriptUrl: [
    '//at.alicdn.com/t/font_8d5l8fzk5b87iudi.js',
    '//at.alicdn.com/t/font_1788044_0dwu4guekcwr.js',
    '//at.alicdn.com/t/font_1788592_a5xf2bdic3u.js',
  ],
})

const SinginBtn: FC<Props> = ({ provider }) => {

  return (
    <Button
      style={{ margin: 5 }}
      onClick={() => signIn(provider?.id)}
      block
    >
      <IconFont
        style={{ fontSize: '1.2rem' }}
        type={`icon-${provider?.name.toLowerCase()}`}
      // type='linkedin'
      />

      Sign in with {provider?.name}
    </Button>
  )
}

export default SinginBtn