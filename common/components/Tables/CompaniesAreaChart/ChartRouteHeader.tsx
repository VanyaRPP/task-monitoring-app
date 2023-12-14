import { QuestionCircleOutlined, SelectOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'

const ChartRoutHeader: React.FC = () => {
  const router = useRouter()
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Button type="link" onClick={() => router.push(AppRoutes.CHART_AREAS)}>
        Мої надавачі послуг
        <SelectOutlined />
        <Tooltip title="Показує заповненість компаніями загальної площі у відсотках">
          <QuestionCircleOutlined />
        </Tooltip>
      </Button>
    </div>
  )
}
export default ChartRoutHeader
