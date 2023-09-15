import { QuestionCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'

const StyledTooltip: React.FC<{
  title: React.ReactNode
}> = ({ title }) => {
  return (
    <Tooltip title={title}>
      <QuestionCircleOutlined
        style={{
          position: 'absolute',
          top: '50%',
          right: 0,
          transform: 'translate(-16px, -50%)',
        }}
      />
    </Tooltip>
  )
}

export default StyledTooltip