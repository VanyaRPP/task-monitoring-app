import { Button } from 'antd'
import { AppleOutlined, createFromIconfontCN } from '@ant-design/icons'
import { signIn } from 'next-auth/react'
import React, { FC } from 'react'

interface Props {
  provider: any
}
const IconFont = createFromIconfontCN({
  scriptUrl: [
    '//at.alicdn.com/t/font_8d5l8fzk5b87iudi.js',
    '//at.alicdn.com/t/font_1788044_0dwu4guekcwr.js', // icon-javascript, icon-java, icon-shoppingcart (overrided)
    '//at.alicdn.com/t/font_1788592_a5xf2bdic3u.js', // icon-shoppingcart, icon-python
  ],
})

const SinginBtn: FC<Props> = ({ provider }) => {
  return (
    <Button
      onClick={() => signIn(provider?.id)}
      block
    >
      <IconFont
        style={{ fontSize: '1.2rem' }}
        type={`icon-${provider?.name.toLowerCase()}`} />
      Sign in with {provider?.name}
    </Button>
  )
}

export default SinginBtn