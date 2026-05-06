import {
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Button, Input } from 'antd'

const ACCENT_COLOR = '#642AB5'
const BUTTON_HEIGHT = 28

interface AddServiceFormProps {
  isAdding: boolean
  newServiceName: string
  setNewServiceName: (v: string) => void
  startAdd: () => void
  cancelAdd: () => void
  submitAdd: () => void
  isCreating: boolean
  disabled?: boolean
}

export const AddServiceForm: React.FC<AddServiceFormProps> = ({
  isAdding,
  newServiceName,
  setNewServiceName,
  startAdd,
  cancelAdd,
  submitAdd,
  isCreating,
  disabled,
}) => {
  if (!isAdding) {
    return (
      <Button
        type="primary"
        icon={<PlusOutlined />}
        disabled={disabled}
        onClick={startAdd}
        style={{ height: BUTTON_HEIGHT }}
      >
        Додати послугу
      </Button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Input
        size="small"
        placeholder="Назва послуги"
        value={newServiceName}
        onChange={(e) => setNewServiceName(e.target.value)}
        onPressEnter={submitAdd}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancelAdd()
        }}
        style={{ height: BUTTON_HEIGHT }}
        autoFocus
      />
      <Button
        type="text"
        size="small"
        loading={isCreating}
        icon={
          <CheckOutlined
            style={{
              color: ACCENT_COLOR,
              stroke: ACCENT_COLOR,
              strokeWidth: 60,
            }}
          />
        }
        onClick={submitAdd}
      />
      <Button
        type="text"
        size="small"
        disabled={isCreating}
        icon={<CloseOutlined style={{ strokeWidth: 60 }} />}
        onClick={cancelAdd}
      />
    </div>
  )
}
