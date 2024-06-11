import { useGetRealEstatesQuery } from '@common/api/realestateApi/realestate.api'
import { Card, Radio } from 'antd'
import s from '../style.module.scss'

const MyCompany = () => {
  const { data: realEstates, isLoading } = useGetRealEstatesQuery({})
  const data = realEstates?.data || []

  return (
    <Card loading={isLoading} size="small" title="Мої компанії">
      <Radio.Group>
        {data.map((item) => (
          <Radio.Button
            className={s.companyName}
            value={item.companyName}
            key={item.companyName}
          >
            {item.companyName}
          </Radio.Button>
        ))}
      </Radio.Group>
    </Card>
  )
}

export default MyCompany
