import {
  useGetCustomServicesQuery,
  useCreateCustomServiceMutation,
} from '@common/api/customServicesApi/customServices.api'
import { useGetDomainTypeTemplatesQuery } from '@common/api/domainApi/domain.api'
import { IDomainTypeTemplate } from '@common/api/domainApi/domain.api.types'
import { useCreateDomainSnapshotMutation } from '@common/api/domainSnapshotsApi/domain-snapshots.api'
import { Button, Form, FormInstance, Modal, message } from 'antd'
import React, { FC, useEffect, useRef, useState } from 'react'
import { buildSnapshotPayloadOnTemplateSwitch } from '@utils/domain/build-snapshot-payload'
import DomainModal, {
  IDomainServiceGroupSavePayload,
  ServiceItem,
} from './DomainModal'
import DomainModalType from './DomainModalType'
import DomainSnapshotsList from './DomainSnapshotsList'

interface Props {
  form: FormInstance
  editable: boolean
  domainId?: string
}

function templateToFormGroups(template: IDomainTypeTemplate) {
  return template.groups.map((g) => ({
    groupName: g.groupName,
    services: g.serviceIds.map(String),
  }))
}

const DomainsServices: FC<Props> = ({ form, editable, domainId }) => {
  const [createCustomService] = useCreateCustomServiceMutation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: customServicesData } = useGetCustomServicesQuery({})
  const { data: templates = [] } = useGetDomainTypeTemplatesQuery(undefined, {
    skip: !editable,
  })
  const [createSnapshot] = useCreateDomainSnapshotMutation()

  const applyTemplate = (templateId: string | null) => {
    form.setFieldsValue({ domainTypeTemplateId: templateId })
    if (!templateId) {
      form.setFieldsValue({ customServices: [] })
      return
    }
    const template = templates.find((t) => t._id === templateId)
    if (!template) return
    form.setFieldsValue({ customServices: templateToFormGroups(template) })
  }

  const hasUserData = (): boolean => {
    const groups = form.getFieldValue('customServices') ?? []
    return groups.some(
      (g: { groupName?: string; services?: string[] }) =>
        (g?.groupName ?? '').trim() !== '' ||
        (g?.services ?? []).length > 0
    )
  }

  // Tracks the templateId that is CURRENTLY applied to the form. We can't
  // read this from the form once Select fires onChange because Form.Item
  // updates form state synchronously to the new value before our handler
  // runs. So we maintain it ourselves: seed once when initialValues land,
  // then update only after a successful apply / restore.
  const lastAppliedTemplateIdRef = useRef<string | null>(null)
  const seededRef = useRef(false)
  const watchedTemplateId = Form.useWatch('domainTypeTemplateId', form) as
    | string
    | null
    | undefined

  useEffect(() => {
    if (seededRef.current) return
    if (watchedTemplateId === undefined) return
    lastAppliedTemplateIdRef.current = watchedTemplateId ?? null
    seededRef.current = true
  }, [watchedTemplateId])

  const handleTemplateChange = (templateId: string | null) => {
    if (!hasUserData()) {
      applyTemplate(templateId)
      lastAppliedTemplateIdRef.current = templateId
      return
    }
    const previousId = lastAppliedTemplateIdRef.current
    const canSnapshot = Boolean(domainId)
    Modal.confirm({
      title: 'Замінити налаштування послуг?',
      content: canSnapshot
        ? 'Поточні групи й обрані послуги будуть перезаписані. Збережений раніше стан домену буде заархівований у історії — його можна відновити пізніше.'
        : 'Поточні групи й обрані послуги будуть перезаписані вмістом обраного шаблону.',
      okText: 'Замінити',
      cancelText: 'Скасувати',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (canSnapshot) {
          // Capture form's current customServices (Select.onChange does not
          // touch this field — still the OLD groups) and use the previous
          // templateId from the ref (NOT the form, which AntD already moved
          // to the new selection).
          const currentGroups = (form.getFieldValue('customServices') ??
            []) as { groupName?: string; services?: string[] }[]
          const payload = buildSnapshotPayloadOnTemplateSwitch({
            previousTemplateId: previousId,
            templates,
            currentGroups,
          })
          try {
            await createSnapshot({
              domainId: domainId as string,
              reason: 'template-switch',
              ...payload,
            }).unwrap()
          } catch (e) {
            // Empty/missing form state isn't a hard failure — proceed with switch.
            console.warn('snapshot before template switch skipped', e)
          }
        }
        applyTemplate(templateId)
        lastAppliedTemplateIdRef.current = templateId
      },
      onCancel: () => {
        // Form.Item already moved to the new value when Select fired onChange.
        // Restore the previous one without re-running customServices logic.
        form.setFieldsValue({ domainTypeTemplateId: previousId })
      },
    })
  }

  const handleSaveServices = (
    orderedGroups: IDomainServiceGroupSavePayload[]
  ) => {
    form.setFieldsValue({
      customServices: orderedGroups.map((g) => ({
        groupName: g.groupName,
        services: [...g.services],
      })),
    })
    setIsModalOpen(false)
    message.success('Зміни збережено')
  }

  const getServicesData = (): ServiceItem[] => {
    if (!customServicesData) return []
    const allServices =
      'data' in customServicesData
        ? customServicesData.data
        : customServicesData
    return allServices.map((service: any) => ({
      key: service._id,
      title: service.name,
    }))
  }

  const getServiceGroups = () => {
    const customServicesField = form.getFieldValue('customServices') || []
    return customServicesField.map((group: any, index: number) => ({
      groupName: group?.groupName || `Група ${index + 1}`,
      services: group?.services || [],
    }))
  }

  const handleCreateCustomService = async (name: string) => {
    return createCustomService({
      name,
      domainId: domainId || '',
    }).unwrap()
  }

  const handleRestored = (snap: {
    groups: { groupName: string; services: string[] }[]
    templateId?: string | null
  }) => {
    const restoredGroups = snap.groups.map((g) => ({
      groupName: g.groupName,
      services: (g.services ?? []).map(String),
    }))
    form.setFieldsValue({
      customServices: restoredGroups,
      domainTypeTemplateId: snap.templateId ?? null,
    })
    lastAppliedTemplateIdRef.current = snap.templateId ?? null
  }

  if (!editable) return null

  return (
    <>
      <DomainModalType
        templates={templates}
        editable={editable}
        onTemplateChange={handleTemplateChange}
      />
      <DomainSnapshotsList domainId={domainId} onRestored={handleRestored} />
      <Button style={{ marginBottom: 10 }} block onClick={() => setIsModalOpen(true)}>
        Мої Послуги
      </Button>
      <DomainModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={getServicesData()}
        serviceGroups={getServiceGroups()}
        onSave={handleSaveServices}
        onCreateCustomService={handleCreateCustomService}
      />
    </>
  )
}

export default DomainsServices
