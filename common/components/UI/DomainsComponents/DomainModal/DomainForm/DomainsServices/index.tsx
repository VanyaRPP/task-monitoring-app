import {
  useGetCustomServicesQuery,
  useCreateCustomServiceMutation,
} from '@common/api/customServicesApi/customServices.api'
import {
  Button,
  FormInstance,
  message,
} from 'antd'
import React, { FC, useState } from 'react'
import DomainModal, { ServiceItem } from './DomainModal'

interface Props {
  form: FormInstance
  editable: boolean
  domainId?: string
  onCustomServicesChange: (
    customServices: { _id: string; name: string }[]
  ) => void
}

const DomainsServices: FC<Props> = ({
  form,
  editable,
  domainId,
  onCustomServicesChange,
}) => {
  const [createCustomService] = useCreateCustomServiceMutation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: customServicesData } = useGetCustomServicesQuery({})

  const handleSave = async (fieldKey: number) => {
    const service = form.getFieldValue(['domainServices', fieldKey])
    if (!service?.name) {
      message.error('Будь ласка, введіть назву послуги')
      return
    }

    try {
      const result = await createCustomService({
        domainId: domainId || '',
        name: service?.name,
      }).unwrap()
      const savedService = result.data
      form.setFieldsValue({
        domainServices: form
          .getFieldValue('domainServices')
          .map((s, idx) =>
            idx === fieldKey ? { ...s, _id: savedService._id } : s
          ),
      })
      message.success('Послугу успішно збережено')
    } catch (error) {
      message.error('Помилка збереження послуги')
    }
  }

  const handleRemove = (fieldName: number) => {
    const updatedServices = form
      .getFieldValue('domainServices')
      .filter((_, idx) => idx !== fieldName)
    form.setFieldsValue({ domainServices: updatedServices })
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }
  
  const handleSaveServices = (servicesByGroup: { [groupName: string]: string[] }) => {
    if (!customServicesData) return
    const allServices = 'data' in customServicesData 
      ? customServicesData.data 
      : customServicesData
    
    const customServices = Object.entries(servicesByGroup).map(([groupName, services]) => ({
      groupName,
      services
    }))
 
    form.setFieldsValue({
      customServices: customServices
    })
    
    const allSelectedServices: any[] = []
    Object.values(servicesByGroup).forEach(groupServices => {
      groupServices.forEach(serviceId => {
        const service = allServices.find((s: any) => s._id === serviceId)
        if (service && !allSelectedServices.find(s => s._id === serviceId)) {
          allSelectedServices.push(service)
        }
      })
    })
    
    form.setFieldsValue({
      domainServices: allSelectedServices.map((service: any) => ({
        _id: service._id,
        name: service.name,
      })),
    })
    
    onCustomServicesChange(allSelectedServices.map((service: any) => ({
      _id: service._id,
      name: service.name,
    })))

    setIsModalOpen(false)
    message.success('Зміни збережено')
  }
  
  const getServicesData = (): ServiceItem[] => {
    if (!customServicesData) return []

    const allServices = 'data' in customServicesData 
      ? customServicesData.data 
      : customServicesData

    return allServices.map((service: any) => ({
      key: service._id,
      title: service.name,
    }))
  }
  
  const getServiceGroups = () => {
    const customServices = form.getFieldValue('customServices') || []
    const groups = customServices.map((group: any, index: number) => {
      const groupName = group?.groupName || `Група ${index + 1}`
      const selectedServices = group?.services || []
      
      return {
        groupName,
        services: selectedServices
      }
    })
    
    return groups
  }

  const handleCreateCustomService = async (name: string) => {
    const result = await createCustomService({ name }).unwrap()
    return result
  }

  return (
    <>
      {editable && (
        <>
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