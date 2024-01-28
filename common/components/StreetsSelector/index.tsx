import React, {useEffect, useState} from "react"
import {Select} from "antd"
import {useGetCurrentUserQuery} from '@common/api/userApi/user.api'
import {isAdminCheck} from "@utils/helpers";
import {useGetAllStreetsQuery} from "@common/api/streetApi/street.api";
import s from "@components/DomainSelector/style.module.scss";

const StreetsSelector = ({ onChange, payments }) => {
    const { data: streets } = useGetAllStreetsQuery({
        domainId: payments?.domain?._id,
    });

    return (
        <Select
            placeholder="Оберіть вулицю"
            value={payments?.street?._id}
            allowClear
            className={s.domainSelector}
            onChange={onChange}
        >
            {streets?.map((street) => (
                <Select.Option key={street._id} value={street._id}>
                    м.{street.city}, {street.address}
                </Select.Option>
            ))}
        </Select>
    );
};

export default StreetsSelector;
