import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { Radio, Card } from 'antd'

const RoleSwitcher: React.FC = () => {
  const { data, isLoading } = useGetCurrentUserQuery()

  return (
    <Card loading={isLoading} size="small" title="Моя роль">
      <Radio.Group>
        {data?.roles?.map((i) => (
          <Radio.Button value={i} key={i}>
            {i}
          </Radio.Button>
        ))}
      </Radio.Group>
    </Card>
  )
}

export default RoleSwitcher
