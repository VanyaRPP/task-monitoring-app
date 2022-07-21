import { QuestionCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import { TooltipPlacement } from 'antd/lib/tooltip'
import s from './style.module.scss'

type PropsType = {
  title: string
  text: string
  placement: TooltipPlacement
}

const CustomTooltip: React.FC<PropsType> = ({ title, text, placement }) => {
  return (
    <Tooltip className={s.Tooltip} placement={placement} title={title}>
      <p>{text}</p>
      <QuestionCircleOutlined />
    </Tooltip>
  )
}

export default CustomTooltip
