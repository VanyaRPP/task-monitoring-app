import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { Radio, Card, Col, Row } from 'antd'
import React from 'react'
import s from '../style.module.scss';

const MyDomainsCard: React.FC = () => {
  const { data: domains = [], isLoading: domainsLoading } = useGetDomainsQuery({});

  return (
    <Row gutter={16}>
      {domains.map((item, index) => (
        <Col span={8} key={item.name}>
          <div className={s.CardInfo}> {/* Wrap the Card component in a div */}
            <Card loading={domainsLoading} title={item.name} bordered={false} className={s.DomainMyCardInfo}>
              <p><strong>Назва:</strong> {item.name}</p>
              <p><strong>Адреса:</strong> {item.address}</p>
              <p><strong>Адміністратори:</strong> {item.adminEmails.join(", ")}</p>     
              <p><strong>Опис:</strong> {item.description}</p>
              <p><strong>Отримувач:</strong> {item.bankInformation}</p>
              <p><strong>Телефон:</strong> {item.phone}</p>
              <p><strong>Пошта:</strong> {item.email}</p>
            </Card>
          </div>
        </Col>
      ))}
    </Row>
  );
};

export default MyDomainsCard;