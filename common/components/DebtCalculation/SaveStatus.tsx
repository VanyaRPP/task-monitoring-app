import {
  CheckCircleOutlined,
  CloudSyncOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { useDebtCalculationContext } from './'

const DRAFT_HINT =
  'Правки лягають у браузер одразу, а в базу — через півтори секунди після ' +
  'того, як ви перестаєте друкувати. Кнопки «Зберегти» немає навмисно.'

/** Autosave state. Stays silent until something has happened. */
const SaveStatus: React.FC = () => {
  const { saveState, savedAt } = useDebtCalculationContext()

  if (saveState === 'idle') return null

  if (saveState === 'error') {
    return (
      <Tooltip title="Чернетка лишилась у браузері — наступна правка спробує зберегти ще раз">
        <Tag icon={<ExclamationCircleOutlined />} color="error">
          Не збережено
        </Tag>
      </Tooltip>
    )
  }

  if (saveState === 'pending' || saveState === 'saving') {
    return (
      <Tooltip title={DRAFT_HINT}>
        <Tag icon={<CloudSyncOutlined />} color="processing">
          Збереження…
        </Tag>
      </Tooltip>
    )
  }

  return (
    <Tooltip title={DRAFT_HINT}>
      <Tag icon={<CheckCircleOutlined />} color="success">
        Збережено{savedAt ? ` о ${dayjs(savedAt).format('HH:mm')}` : ''}
      </Tag>
    </Tooltip>
  )
}

export default SaveStatus
