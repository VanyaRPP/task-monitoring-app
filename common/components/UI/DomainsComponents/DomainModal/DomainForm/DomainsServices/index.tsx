import {
  useGetCustomServicesQuery,
  useCreateCustomServiceMutation,
} from '@common/api/customServicesApi/customServices.api'
import {
  useCloneDomainTypeTemplateForDomainMutation,
  useGetDomainTypeTemplatesQuery,
} from '@common/api/domainApi/domain.api'
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
  /** When false, the inner Collapse with snapshots list is not rendered.
   *  Use it when the snapshots are shown in a separate tab. */
  renderSnapshotsList?: boolean
}

function templateToFormGroups(template: IDomainTypeTemplate) {
  return template.groups.map((g) => ({
    groupName: g.groupName,
    services: g.serviceIds.map(String),
  }))
}

const DomainsServices: FC<Props> = ({
  form,
  editable,
  domainId,
  renderSnapshotsList = true,
}) => {
  const [createCustomService] = useCreateCustomServiceMutation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: customServicesData } = useGetCustomServicesQuery({
    ...(domainId ? { domainId } : {}),
  })
  const { data: templates = [] } = useGetDomainTypeTemplatesQuery(undefined, {
    skip: !editable,
  })
  const [createSnapshot] = useCreateDomainSnapshotMutation()
  const [cloneTemplate] = useCloneDomainTypeTemplateForDomainMutation()

  const applyTemplate = async (templateId: string | null) => {
    form.setFieldsValue({ domainTypeTemplateId: templateId })
    if (!templateId) {
      form.setFieldsValue({ customServices: [] })
      return
    }
    const template = templates.find((t) => t._id === templateId)
    if (!template) return
    if (domainId) {
      try {
        const result = await cloneTemplate({
          _id: templateId,
          domainId,
        }).unwrap()
        form.setFieldsValue({ customServices: result.groups })
        return
      } catch (e) {
        console.warn('clone-for-domain failed, falling back to references', e)
      }
    }

    form.setFieldsValue({ customServices: templateToFormGroups(template) })
  }

  const hasUserData = (): boolean => {
    const groups = form.getFieldValue('customServices') ?? []
    return groups.some(
      (g: { groupName?: string; services?: string[] }) =>
        (g?.groupName ?? '').trim() !== '' || (g?.services ?? []).length > 0
    )
  }

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

  const handleTemplateChange = async (templateId: string | null) => {
    if (!hasUserData()) {
      await applyTemplate(templateId)
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
            console.warn('snapshot before template switch skipped', e)
          }
        }
        await applyTemplate(templateId)
        lastAppliedTemplateIdRef.current = templateId
      },
      onCancel: () => {
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
      {renderSnapshotsList && (
        <DomainSnapshotsList domainId={domainId} onRestored={handleRestored} />
      )}
      <Button
        style={{ marginBottom: 10 }}
        block
        onClick={() => setIsModalOpen(true)}
      >
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
