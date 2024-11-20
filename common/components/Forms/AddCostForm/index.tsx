import { validateField } from '@assets/features/validators'
import { IService } from '@common/api/serviceApi/service.api.types'
import AddressesSelect from '@components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import { usePreviousMonthService } from '@modules/hooks/useService'
import {
  ConfigProvider,
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
} from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { useEffect } from 'react'
import s from './style.module.scss'
import { inputNumberParser } from '@utils/helpers'

dayjs.locale('uk')

interface Props {
  form: FormInstance<any>
}

const AddCostForm: React.FC<Props> = ({ form }) => {
  const { MonthPicker } = DatePicker

  return (
    <ConfigProvider locale={ukUA}>
      <Form form={form} layout="vertical" className={s.Form}>
        <DomainsSelect form={form} />
        <Form.Item
          name="date"
          label="Місяць та рік"
          rules={validateField('required')}
        >
          <MonthPicker
            format="MMMM YYYY"
            placeholder="Оберіть місяць"
            className={s.formInput}
          />
        </Form.Item>
        <Form.Item name="sum" label="Сума" rules={validateField('required')}>
          <InputNumber
            parser={inputNumberParser}
            placeholder="Вкажіть значення"
            className={s.formInput}
          />
        </Form.Item>
        <Form.Item name="description" label="Опис">
          <Input.TextArea
            placeholder="Введіть опис"
            maxLength={256}
            className={s.formInput}
          />
        </Form.Item>
      </Form>
    </ConfigProvider>
  )
}

export default AddCostForm
