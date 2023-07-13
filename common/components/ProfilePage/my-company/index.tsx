import React from "react";
import { Card, Radio } from "antd";
import s from "../style.module.scss";
import { useGetAllRealEstateQuery, useGetByRealEstateQuery } from "@common/api/realestateApi/realestate.api";
import { IUser } from 'common/modules/models/User';
import { IDomain } from "@common/modules/models/Domain";
import { useGetDomainsQuery } from "@common/api/domainApi/domain.api";

interface Props {
  user: IUser,
}

const MyCompany: React.FC<Props> = ({ user }) => {
  const { data: domainData = [], isLoading: domainLoading } = useGetDomainsQuery({});
  const { data = [], isLoading } = domainData.adminEmails.includes(user.email)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ? useGetByRealEstateQuery({ domainId: domainData._id})
    // eslint-disable-next-line react-hooks/rules-of-hooks
    : useGetAllRealEstateQuery({});
    // const { data = [], isLoading } = useGetByRealEstateQuery({limit:3, domainId: "64a5ae617d5d231d00a695b1"});


  return (
    <Card loading={isLoading} size="small" title="Мої компанії">
      <Radio.Group>
        {data.map((item, index) => (
          <Radio.Button className={s.companyName} value={item.companyName} key={index}>
            {item.companyName}
          </Radio.Button>
        ))}
      </Radio.Group>
    </Card>
  );
}

export default MyCompany;
