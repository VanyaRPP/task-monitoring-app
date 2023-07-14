/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-console */
import React from "react";
import { Card, Radio } from "antd";
import s from "../style.module.scss";
import { useGetAllRealEstateQuery, useGetByRealEstateQuery } from "@common/api/realestateApi/realestate.api";
import { IUser } from 'common/modules/models/User';
import { useGetDomainsQuery } from "@common/api/domainApi/domain.api";

interface Props {
  user: IUser,
}

const MyCompany: React.FC<Props> = ({ user }) => {
  const  domainData  = useGetDomainsQuery({}).data;
  const domainId = domainData && domainData[0] ? domainData[0]._id : "";

  const { data = [], isLoading } = user.roles.includes("User") ?
    useGetAllRealEstateQuery({}) :
    useGetByRealEstateQuery({domainId: domainId});   
  
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
