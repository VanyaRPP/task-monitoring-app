import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { Roles } from '@utils/constants'
import { Card, Col, Row } from 'antd'
import React from 'react'
import s from '../style.module.scss'

const MyDomainsCard: React.FC = () => {
  const { data: user } = useGetCurrentUserQuery()
  const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)
  const { data: domains, isLoading: domainsLoading } = useGetDomainsQuery(
    {},
    { skip: isGlobalAdmin }
  )
  const { data: realEstates } = useGetAllRealEstateQuery(
    {},
    { skip: isGlobalAdmin }
  )
  const companies = realEstates?.data || []

  const getDomainCompanies = (domainId) =>
    companies
      .filter((companyItem) => companyItem.domain._id === domainId)
      .map((item) => item.companyName)
      .join(', ')

  return (
    <Row gutter={16}>
      {domains?.data.map((item) => (
        <Col span={8} key={item.name}>
          <div className={s.CardInfo}>
            {/* Wrap the Card component in a div */}
            <Card
              loading={domainsLoading}
              title={item.name}
              bordered={false}
              className={s.DomainMyCardInfo}
            >
              <p>
                <strong>Адміністратори:</strong> {item.adminEmails.join(', ')}
              </p>
              <p>
                <strong>Опис:</strong> {item.description}
              </p>
              <p>
                <strong>Компанії:</strong>
                {getDomainCompanies(item._id)}
              </p>
            </Card>
          </div>
        </Col>
      ))}
    </Row>
  )
}

export default MyDomainsCard
