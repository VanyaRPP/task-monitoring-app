import {
  useGetCustomServicesQuery,
  useCreateCustomServiceMutation,
} from '@common/api/customServicesApi/customServices.api'
import { useGetDomainTypeTemplatesQuery } from '@common/api/domainApi/domain.api'
import { IDomainTypeTemplate } from '@common/api/domainApi/domain.api.types'
import { Button, Form, FormInstance, message } from 'antd'
import React, { FC, useState } from 'react'
import DomainModal, {
  IDomainServiceGroupSavePayload,
  ServiceItem,
} from './DomainModal'
import DomainModalType from './DomainModalType'

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

  const handleTemplateChange = (templateId: string | null) => {
    form.setFieldsValue({ domainTypeTemplateId: templateId })
    if (!templateId) {
      form.setFieldsValue({ customServices: [] })
      return
    }
    const template = templates.find((t) => t._id === templateId)
    if (!template) return
    form.setFieldsValue({ customServices: templateToFormGroups(template) })
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

  if (!editable) return null

  return (
    <>
      <DomainModalType
        templates={templates}
        editable={editable}
        onTemplateChange={handleTemplateChange}
      />
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
