import { QuestionCircleOutlined, SelectOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'
import { Select } from 'antd'

interface CompaniesAreaChartHeaderProps {
  handleChange: (value: string) => void
  selectValues: Array<{ label: string; value: string }>
}

const CompaniesAreaChartHeader: React.FC<CompaniesAreaChartHeaderProps> = ({
  handleChange,
  selectValues,
}) => {
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
      {selectValues?.length > 1 && (
        <Select
          defaultValue={selectValues?.[0].label}
          style={{ width: 120 }}
          onChange={handleChange}
          options={selectValues}
        />
      )}
    </div>
  )
}

export default CompaniesAreaChartHeader
