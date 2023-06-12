import React, { useState } from 'react';
import s from './style.module.scss';
import { Button, Tooltip } from 'antd';
import {
  PlusOutlined,
  SelectOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { AppRoutes } from '@utils/constants';
import { useRouter } from 'next/router';
import DomainModal from '../DomainModal';

const DomainStreetsComponent = ({ data }) => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={s.tableHeader}>
      <div>
        <Tooltip
          title="Домени - це організації та компанії, що здійснюють управління та мають під собою менші компанії та об'єкти нерухомості. Управляються адміністраторами"
        >
          <QuestionCircleOutlined className={s.Icon} />
        </Tooltip>
        <Button type="link" onClick={() => router.push(AppRoutes.DOMAIN)}>
          Домени
          <SelectOutlined className={s.Icon} />
        </Button>
      </div>
      <div>
        <Button type="link" onClick={() => setIsModalOpen(true)}>
          <PlusOutlined /> Додати
        </Button>
        <DomainModal isModalOpen={isModalOpen} closeModal={closeModal} />
      </div>
    </div>
  );
};

export default DomainStreetsComponent;
