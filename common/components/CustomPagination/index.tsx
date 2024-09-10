import { Button, Select, Space } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { FC, MouseEventHandler } from 'react'
import { DefaultOptionType } from 'antd/es/select'

interface Props {
  selectOptions: DefaultOptionType[]
  selectValue?: any
  onPrevButtonClick?: MouseEventHandler<HTMLElement>
  onNextButtonClick?: MouseEventHandler<HTMLElement>
  onSelectChange?: (value: any) => void
  prevButtonDisabled?: boolean
  nextButtonDisabled?: boolean
  prevButtonText?: string
  nextButtonText?: string
}

const Pagination: FC<Props> = ({
  selectOptions,
  selectValue,
  onPrevButtonClick,
  onNextButtonClick,
  onSelectChange,
  prevButtonDisabled,
  nextButtonDisabled,
  prevButtonText,
  nextButtonText,
}) => {
  return (
    <Space>
      <Button
        type="link"
        onClick={onPrevButtonClick}
        disabled={prevButtonDisabled}
      >
        <LeftOutlined />
        {prevButtonText}
      </Button>
      <Select
        options={selectOptions}
        value={selectValue}
        onChange={onSelectChange}
      />
      <Button
        type="link"
        onClick={onNextButtonClick}
        disabled={nextButtonDisabled}
      >
        {nextButtonText}
        <RightOutlined />
      </Button>
    </Space>
  )
}

export default Pagination
