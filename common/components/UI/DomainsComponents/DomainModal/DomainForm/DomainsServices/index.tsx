import { useGetCustomDomainTypeTemplatesQuery } from '@common/api/domainApi/domain.api'
import {
  useGetCustomServicesQuery,
  useCreateCustomServiceMutation,
} from '@common/api/customServicesApi/customServices.api'
import { useResolveServiceId } from '@common/modules/hooks/use-resolve-service-id'
import { Button, Form, FormInstance, message } from 'antd'
import React, { FC, useState } from 'react'
import DomainModal, {
  IDomainServiceGroupSavePayload,
  ServiceItem,
} from './DomainModal'
import DomainModalType from './DomainModalType'
import { IT_DEFAULT_SERVICE_NAME } from '@utils/constants'
import {
  filterServicesForDomainCatalogPicker,
  getStaticServicePresetForKind,
  normalizeDomainServiceKind,
} from '@utils/domain/domain-service-policy'

interface Props {
  form: FormInstance
  editable: boolean
  domainId?: string
}

const DomainsServices: FC<Props> = ({ form, editable, domainId }) => {
  const [createCustomService] = useCreateCustomServiceMutation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: customServicesData } = useGetCustomServicesQuery({})
  const { data: typeTemplates = [] } = useGetCustomDomainTypeTemplatesQuery(
    undefined,
    { skip: !editable }
  )
  const { resolveByName, catalogServices } = useResolveServiceId(domainId)

  const domainType = Form.useWatch('domainType', form)

  const handleTypeChangeAsync = async (type: string) => {
    form.setFieldsValue({ domainType: type })
    const kind = normalizeDomainServiceKind(type)
    const preset = getStaticServicePresetForKind(kind)

    let groups = preset.groups.map((g) => ({
      groupName: g.groupName,
      services: [...g.serviceIds],
    }))

    if (kind === 'it') {
      const id = await resolveByName(IT_DEFAULT_SERVICE_NAME)
      groups = [
        {
          groupName: preset.groups[0].groupName,
          services: id ? [id] : [],
        },
      ]
    } else if (kind === 'custom') {
      const groupName =
        form.getFieldValue('customServiceGroupName')?.trim() ||
        preset.groups[0].groupName
      groups = [{ groupName, services: [] }]
    }

    form.setFieldsValue({
      customServices: groups,
    })
  }

  const handleTypeChange = (type: string) => {
    void handleTypeChangeAsync(type)
  }

  const syncCustomServicesGroupFromLabels = () => {
    if (form.getFieldValue('domainType') !== 'own') return
    const preset = getStaticServicePresetForKind('custom')
    const groupName =
      form.getFieldValue('customServiceGroupName')?.trim() ||
      preset.groups[0].groupName
    const existing = form.getFieldValue('customServices') || []
    const services = existing[0]?.services || []
    form.setFieldsValue({
      customServices: [{ groupName, services }],
    })
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
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

    const allServices = catalogServices
    const kind = normalizeDomainServiceKind(domainType)
    const filtered = filterServicesForDomainCatalogPicker(allServices, kind)

    return filtered.map((service: any) => ({
      key: service._id,
      title: service.name,
    }))
  }

  const getServiceGroups = () => {
    const customServicesField = form.getFieldValue('customServices') || []
    const groups = customServicesField.map((group: any, index: number) => {
      const groupName = group?.groupName || `Група ${index + 1}`
      const selectedServices = group?.services || []

      return {
        groupName,
        services: selectedServices,
      }
    })

    return groups
  }

  const handleCreateCustomService = async (name: string) => {
    const result = await createCustomService({
      name,
      domainId: domainId || '',
    }).unwrap()
    return result
  }

  return (
    <>
      {editable && (
        <>
          <DomainModalType
            onTypeChange={handleTypeChange}
            onCustomLabelsBlur={syncCustomServicesGroupFromLabels}
            onTemplateApplied={syncCustomServicesGroupFromLabels}
            templates={typeTemplates}
            editable={editable}
          />
          <Button
            style={{ marginBottom: 10 }}
            block
            onClick={handleOpenModal}
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
      )}
    </>
  )
}

export default DomainsServices