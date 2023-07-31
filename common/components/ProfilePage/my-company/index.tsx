import React, { useEffect } from "react";
import { Card, Radio } from "antd";
import s from "../style.module.scss";
import { useGetAllRealEstateQuery, useGetByRealEstateQuery } from "@common/api/realestateApi/realestate.api";
import { IUser } from 'common/modules/models/User';
import { useGetDomainsQuery } from "@common/api/domainApi/domain.api";
import { Roles } from "@utils/constants";
import { Types } from "mongoose";
import Item from "antd/lib/list/Item";
interface Props {
  user: IUser,
}

const MyCompany: React.FC<Props> = ({ user }) => {
  const domainData = useGetDomainsQuery({}).data;
  const domain : string = domainData && domainData[0]._id;
  console.log(domain);
  
 
  
  const { data = [], isLoading } = user?.roles.includes(Roles.GLOBAL_ADMIN) ?
    useGetAllRealEstateQuery({}) : useGetByRealEstateQuery({domainId: domain});

  return (
    <Card loading={isLoading} size="small" title="Мої компанії">
      <Radio.Group>
        {data.map((item) => (
          <Radio.Button className={s.companyName} value={item.companyName} key={item.companyName}>
            {item.companyName}
          </Radio.Button>
        ))}
      </Radio.Group>
    </Card>
  );
}

export default MyCompany;
