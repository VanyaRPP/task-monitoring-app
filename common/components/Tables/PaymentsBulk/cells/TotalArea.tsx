import React from 'react';
import { Form, Typography } from 'antd';
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk';

interface Props {
    name: number
}

const TotalArea: React.FC<Props> = ({ name }) => {
    const { form } = useInvoicesPaymentContext()

    const totalArea: number = 
        Form.useWatch(['payments', name, 'company', 'totalArea'], form) ?? 0

    return <Typography.Text>{totalArea}</Typography.Text>
}

export default TotalArea;