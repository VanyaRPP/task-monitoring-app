import React, { useState, useEffect, useRef } from 'react';

import {Select} from "antd"

import s from "@components/StreetsSelector/style.module.scss";

const StreetsSelector = ({filters, setFilters, streets}) => {
    const [dropdownWidth, setDropdownWidth] = useState('auto');
    const selectRef = useRef(null);

    useEffect(() => {
        if (selectRef.current) 
            setDropdownWidth(selectRef.current.offsetWidth);
    }, []);

    const options = streets?.map((street) => {
        return {
            label: street.text,
            value: street.value,
        }
    })

    return (
        <div className={s.streetDiv}>
            <Select
                dropdownStyle={{ width: dropdownWidth }}
                className={s.streetSelector}
                placeholder="Виберіть вулицю"
                onChange={(value) => {
                    setFilters(
                        {street: value}
                    )
                }}
                allowClear
                options={options}
            >
            </Select>
        </div>
    )
}

export default StreetsSelector
