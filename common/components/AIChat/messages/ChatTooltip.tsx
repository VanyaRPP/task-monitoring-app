import React from 'react'
import { Tooltip, type TooltipProps } from 'antd'

const TRIGGER: TooltipProps['trigger'] = ['hover', 'focus']

/** antd shows tooltips on hover only; keyboard users need them on focus too. */
const ChatTooltip: React.FC<TooltipProps> = (props) => (
  <Tooltip trigger={TRIGGER} {...props} />
)

export default ChatTooltip
