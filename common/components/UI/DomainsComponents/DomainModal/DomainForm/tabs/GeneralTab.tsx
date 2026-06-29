import { validateField } from '@assets/features/validators'
import EmailSelect from '@components/UI/Reusable/EmailSelect'
import { Form, Input } from 'antd'
import { FC, useEffect, useRef } from 'react'
import DomainStreets from '../DomainStreets'
import s from '../style.module.scss'
import type { TabProps } from './types'

/** Auto-rebuild description from IBAN/РНОКПП/МФО while keeping custom lines. */
const useAutoSyncDescription = (form: TabProps['form'], editable: boolean) => {
  const iban = Form.useWatch('iban', form)
  const rnokpp = Form.useWatch('rnokpp', form)
  const mfo = Form.useWatch('mfo', form)

  const prevRef = useRef<{
    iban?: string
    rnokpp?: string
    mfo?: string
  } | null>(null)

  useEffect(() => {
    if (!editable) return

    const prev = prevRef.current
    prevRef.current = { iban, rnokpp, mfo }

    if (prev === null) return

    if (
      prev.iban === undefined &&
      prev.rnokpp === undefined &&
      prev.mfo === undefined
    )
      return

    if (prev.iban === iban && prev.rnokpp === rnokpp && prev.mfo === mfo) return

    const changes: Array<{ pattern: RegExp; newLine: string | null }> = []
    if (prev.iban !== iban)
      changes.push({
        pattern: /^IBAN: /,
        newLine: iban ? `IBAN: ${iban}` : null,
      })
    if (prev.rnokpp !== rnokpp)
      changes.push({
        pattern: /^РНОКПП: /,
        newLine: rnokpp ? `РНОКПП: ${rnokpp}` : null,
      })
    if (prev.mfo !== mfo)
      changes.push({ pattern: /^МФО: /, newLine: mfo ? `МФО: ${mfo}` : null })

    const currentDescription: string = form.getFieldValue('description') || ''
    const lines = currentDescription.split('\n').filter((l) => l.trim())

    for (const { pattern, newLine } of changes) {
      const idx = lines.findIndex((l) => pattern.test(l))
      if (idx >= 0) {
        if (newLine) lines[idx] = newLine
        else lines.splice(idx, 1)
      } else if (newLine) {
        lines.unshift(newLine)
      }
    }

    form.setFieldsValue({ description: lines.join('\n') })
  }, [iban, rnokpp, mfo, form, editable])
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
