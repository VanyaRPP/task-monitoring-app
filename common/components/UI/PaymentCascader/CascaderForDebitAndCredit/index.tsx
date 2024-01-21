import React from 'react'
import { Cascader } from 'antd'
import s from '@components/UI/PaymentCascader/styled.module.scss'
import { Operations } from '@utils/constants';

const CascaderForDebitAndCredit = ({ onChange }) => {
    return (
        <div className={s.PaymentCascader}>
            <Cascader
                placeholder="Оберіть тип"
                options={customOptions}
                onChange={onChange}
            />
        </div>
    );
}
const customOptions = [
    {
        label: 'Дебіт',
        value: Operations.Debit,
    },
    {
        label: 'Кредит',
        value: Operations.Credit,
    },
]

export default CascaderForDebitAndCredit