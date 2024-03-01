import React from 'react'
import { Select } from 'antd'
import classNames from 'classnames'
import s from './style.module.scss'

export interface ISelectorOption {
  label: string
  value: any
}

export interface ISelectorProps {
  options?: ISelectorOption[]
  selected?: any
  onChange?: (value: any, option: any) => any
  onSelect?: (value: any, option: any) => any
  onDeselect?: (value: any, option: any) => any
  onClear?: () => void
  placeholder?: string
  style?: React.CSSProperties
  className?: string
}

const filterOption = (
  input: string,
  option?: { label: string; value: string }
) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

export const Selector: React.FC<ISelectorProps> = (props) => {
  return (
    <Select
      style={props.style}
      className={classNames(s.Selector, props.className)}
      placeholder={props.placeholder || 'Виберіть...'}
      value={props.selected}
      options={props.options}
      onChange={props.onChange}
      onSelect={props.onSelect}
      onDeselect={props.onDeselect}
      onClear={props.onClear}
      filterOption={filterOption}
      showSearch
      allowClear
    />
  )
}
