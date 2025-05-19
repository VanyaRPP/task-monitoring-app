import { useGetFeatureFlagsQuery, useUpdateFeatureFlagMutation } from '@common/api/featureFlagsApi/featureFlag.api'
import { Switch, Table } from 'antd'

export const FeatureFlagsTable = () => {
  const { data = [], isLoading} = useGetFeatureFlagsQuery()
  const [updateFlag, { isLoading: isUpdating }] = useUpdateFeatureFlagMutation()

	return (
	
		<Table
      rowKey="_id"
      dataSource={data}
      loading={isLoading}
      columns={[
        {
          title: 'Назва',
          dataIndex: 'name',
        },
        {
          title: 'Опис',
          dataIndex: 'description',
        },
        {
          title: 'Дата створення',
          dataIndex: 'createdAt',
          render: (value) => new Date(value).toLocaleDateString(),
        },
        {
          title: 'Увімкнено',
          dataIndex: 'isEnabled',
          render: (flag, record) => (
            <Switch
              checked={flag.isEnabled}
              onChange={(checked) =>
                updateFlag({ id: record._id, data: { isEnabled: checked } })
              }
							loading={isUpdating}
            />
          ),
        },
      ]}
    />
  )
}