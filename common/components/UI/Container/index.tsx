import { FC } from 'react'
import s from './style.module.scss'

interface Props {
  children: React.ReactNode
  row: boolean
}

const Container: FC<Props> = ({ children, row }) => {
  return (
    <div className={row ? s.ContainerRov : s.ContainerColumn}>{children}</div>
  )
}

export default Container
