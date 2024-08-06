import { QuestionCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import s from './style.module.scss'

const StyledTooltip: React.FC<{
  title: React.ReactNode
}> = ({ title }) => {
  return (
    <Tooltip title={title}>
      <QuestionCircleOutlined className={s.tooltipIcon} />
    </Tooltip>
  )
}

export default StyledTooltip
