import React, { useEffect, useState } from 'react';
import { Cascader } from 'antd';
import s from '@components/UI/PaymentCardHeader/style.module.scss';
import {useGetAllPaymentsQuery,useFilterPaymentsMutation} from '@common/api/paymentApi/payment.api'

const PaymentCascader = ({ year, quarter, month, day, onChange }) => {

  const [customOptions, setCustomOptions] = useState([]);

  const [filterPayments]= useFilterPaymentsMutation()

  // const { getAllPayments} = useGetAllPaymentsQuery({limit:'1', email: 'denys1234@gmail.com', year: "2023", quarter: "3", month: '7', day:"17"})
  
  useEffect(() => {
    //  if {
    //   const =  ;

    setCustomOptions([
      {
        label: 'Рік',
        value: 'year',
        children: [
          {
            label: `2023`,
            value: '2023',
            children: [
              {
              label: 'Увесь рік',
              value: 'year',
            },
              {
                label: 'Місяць',
                value: 'month',
                children: [
                    {
                     label: 'Січень',
                    value: '1',
                    },
                    {
                     label: 'Лютий',
                     value: '2',
                     },
                    {
                    label: 'Березень',
                    value: '3',
                  },
                       {
                     label: 'Квітень',
                     value: '4',
                    },
                    {
                     label: 'Травень',
                     value: '5',
                     },
                    {
                    label: 'Червень',
                    value: '6',
                  },
                     {
                     label: 'Липень',
                     value: '7',
                    },
                    {
                     label: 'Серпень',
                     value: '8',
                     },
                    {
                    label: 'Вересень',
                    value: '9',
                  },
                       {
                     label: 'Жовтень',
                     value: '10',
                    },
                    {
                     label: 'Листопад',
                     value: '11',
                     },
                    {
                    label: 'Грудень',
                    value: '12',
                  },
                    
                            ],
              },
               {
                label: 'Квартал',
                value: 'quarter',
                children: [
                  {
                    label: ` І квартал`,
                    value: '1',
                  },
                  {
                    label: `  ІІ квартал`,
                    value: '2',
                  },
                  {
                    label: ` III квартал`,
                    value:'3',
                  },
                  {
                    label: ` IV квартал`,
                    value: '4',
                    },
                            ],
                          },
                        ],
                      },
                    ],
                  },
    ]);
  }, [year, quarter, month, day]);

  const handleChange = (value) => {
    if (onChange) {
     console.log(filterPayments)
      onChange(value);
    }
    filterPayments({ limit: '1', email: 'denys1234@gmail.com', year: "2023", quarter: "3", month: '7', day: "17" })
  };

  return (
    <Cascader
      options={customOptions}
      onChange={handleChange}
      className={s.CascaderElement}
      placeholder="Please select"
    />
  );
};

export default PaymentCascader;