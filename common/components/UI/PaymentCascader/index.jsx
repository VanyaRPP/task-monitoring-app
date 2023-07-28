import React, { useEffect, useState }  from 'react';
import { Cascader } from 'antd';
import s from '@components/UI/PaymentCardHeader/style.module.scss'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api';

const CustomCascader = ({options,onChange}) => {
  const [customOptions, setCustomOptions] = useState([]);

  const { data, error, isLoading } = useGetAllPaymentsQuery({});

  useEffect(() => {
    if (data && !isLoading) {
      const { year, quarter, month, day } = data?.query || {};

      setCustomOptions([
        {
          value: 'year',
          label: 'Рік',
          children: [
            {
              value: year,
              label: `${year}`,
              children: [
                {
                  value: 'whole-year',
                  label: 'Весь рік',
                },
                {
                  value: 'quarter',
                  label: 'Квартал',
                  children: [
                    {
                      value: quarter,
                      label: `Квартал ${quarter}`,
                      children: [
                        {
                          value: 'month',
                          label: 'Місяць',
                          children: [
                            {
                              value: month,
                              label: `Місяць ${month}`,
                              children: [
                                {
                                  value: day,
                                  label: `День ${day}`,
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);
    }
  }, [data, isLoading]);

  const handleChange = (value) => {
    // Handle the onChange event here
  };

 
  return (
        <Cascader options={customOptions} onChange={handleChange} className={s.CascaderElement} placeholder="Please select" />
  );
};

export default CustomCascader;