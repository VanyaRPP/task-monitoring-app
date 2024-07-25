import Icon from '@ant-design/icons'
import Logo from '@assets/svg/Logo'
import { GetProps } from 'antd'

/**
 * Compact SPACEHUB logo icon component (logo only)
 */
export const LogoIcon: React.FC<
  Partial<Omit<GetProps<typeof Icon>, 'component'>>
> = (props) => {
  return <Icon component={Logo} {...props} />
}
