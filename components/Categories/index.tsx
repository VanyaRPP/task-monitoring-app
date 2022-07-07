import { List, Skeleton } from 'antd'
import Link from 'next/link'
import { useGetAllCategoriesQuery } from '../../api/categoriesApi/category.api'
import { AppRoutes } from '../../utils/constants'

const Categories: React.FC = () => {
  const { data: categoriesData } = useGetAllCategoriesQuery('')
  const categories = categoriesData?.data

  return (
    <List
      itemLayout="horizontal"
      dataSource={categories}
      renderItem={(category) => (
        <List.Item
          actions={[
            <Link key="more" href={AppRoutes.INDEX}>
              more
            </Link>,
          ]}
        >
          <Skeleton title={false} loading={false} active>
            <List.Item.Meta
              title={<Link href={AppRoutes.INDEX}>{category?.name}</Link>}
              description={category?.desription}
            />
          </Skeleton>
        </List.Item>
      )}
    />
  )
}

export default Categories
