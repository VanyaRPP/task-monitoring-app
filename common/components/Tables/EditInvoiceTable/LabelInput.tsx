import { Input, InputProps } from 'antd'
import React from 'react'

// Renders defaultLabel as the visible value while the form field has not been
// populated yet. Once the seed-effect (in the parent) writes a value into the
// form, antd Form.Item passes that value here and the fallback stops kicking
// in. Without this, the input would briefly flash empty between mount and the
// first effect tick.
export const LabelInput: React.FC<InputProps & { defaultLabel?: string }> = ({
  defaultLabel,
  value,
  onChange,
  disabled,
}) => (
  <Input
    value={value !== undefined && value !== null ? value : defaultLabel}
    onChange={onChange}
    disabled={disabled}
  />
)
