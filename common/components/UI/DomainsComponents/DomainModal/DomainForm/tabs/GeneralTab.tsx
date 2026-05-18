import { validateField } from '@assets/features/validators'
import EmailSelect from '@components/UI/Reusable/EmailSelect'
import { Form, Input } from 'antd'
import { FC, useEffect } from 'react'
import DomainStreets from '../DomainStreets'
import s from '../style.module.scss'
import type { TabProps } from './types'

/** Auto-rebuild description from IBAN/РНОКПП/МФО while keeping custom lines. */
const useAutoSyncDescription = (form: TabProps['form'], editable: boolean) => {
  const ieName = Form.useWatch('IEName', form)
  const iban = Form.useWatch('iban', form)
  const rnokpp = Form.useWatch('rnokpp', form)
  const mfo = Form.useWatch('mfo', form)

  useEffect(() => {
    if (!editable) return

    const currentDescription: string = form.getFieldValue('description') || ''
    const autoLinePatterns = [/^IBAN: /, /^РНОКПП: /, /^МФО: /]
    const autoValues = [ieName, iban, rnokpp, mfo].filter(Boolean)
    const customLines = currentDescription.split('\n').filter((line) => {
      if (!line.trim()) return false
      if (autoLinePatterns.some((p) => p.test(line))) return false
      if (autoValues.includes(line.trim())) return false
      return true
    })

    const autoLines = [
      iban ? `IBAN: ${iban}` : '',
      rnokpp ? `РНОКПП: ${rnokpp}` : '',
      mfo ? `МФО: ${mfo}` : '',
    ].filter(Boolean)

    form.setFieldsValue({
      description: [...autoLines, ...customLines].join('\n'),
    })
  }, [ieName, iban, rnokpp, mfo, form, editable])
}

const GeneralTab: FC<TabProps> = ({ form, editable }) => {
  useAutoSyncDescription(form, editable)

  return (
    <>
      <Form.Item name="name" label="Назва" rules={validateField('required')}>
        <Input
          placeholder="Вкажіть значення"
          maxLength={256}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <EmailSelect form={form} disabled={!editable} />
      <DomainStreets disabled={!editable} />
      <Form.Item name="iban" label="IBAN">
        <Input
          placeholder="Вкажіть IBAN"
          maxLength={34}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="rnokpp" label="РНОКПП">
        <Input
          placeholder="Вкажіть РНОКПП"
          maxLength={256}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="mfo" label="МФО">
        <Input
          placeholder="Вкажіть МФО"
          maxLength={256}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item
        name="description"
        label="Опис"
        rules={validateField('description')}
      >
        <Input.TextArea
          placeholder="Вкажіть значення"
          className={s.formInput}
          maxLength={512}
          rows={4}
          disabled={!editable}
        />
      </Form.Item>
    </>
  )
}

export default GeneralTab
