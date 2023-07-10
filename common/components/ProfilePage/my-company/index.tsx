/* eslint-disable no-console */
import React from "react";
import { Card, Radio } from "antd";
import s from "../style.module.scss"
import { useGetAllRealEstateQuery } from "@common/api/realestateApi/realestate.api";

const MyCompany: React.FC = () => {
    
  const { data = [], isLoading } = useGetAllRealEstateQuery({limit:3});
  console.log(data,isLoading)
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
