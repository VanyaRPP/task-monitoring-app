import { message } from 'antd'
import { useState } from 'react'
import {
  useCreateCustomServiceMutation,
  useDeleteCustomServiceMutation,
  useEditCustomServiceMutation,
  useGetCustomServicesQuery,
} from '@common/api/customServicesApi/customServices.api'
import { ICustomService } from '@common/api/customServicesApi/customServices.api.types'

export const useCustomServices = () => {
  const { data: response, isLoading, isError } = useGetCustomServicesQuery({})
  const [deleteService, { isLoading: isDeleting }] =
    useDeleteCustomServiceMutation()
  const [editService, { isLoading: isUpdating }] =
    useEditCustomServiceMutation()
  const [createService, { isLoading: isCreating }] =
    useCreateCustomServiceMutation()

  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [tempName, setTempName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')

  const services: ICustomService[] = response?.data ?? []

  const startEdit = (service: ICustomService) => {
    setEditingKey(service._id)
    setTempName(service.name)
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setTempName('')
  }

  const saveEdit = async (service: ICustomService) => {
    if (!tempName.trim()) {
      message.warning('Назва не може бути порожньою')
      return
    }
    if (tempName.trim() === service.name) {
      cancelEdit()
      return
    }
    try {
      await editService({ _id: service._id, name: tempName.trim() }).unwrap()
      message.success('Оновлено!')
      cancelEdit()
    } catch (error: any) {
      message.error(error?.data?.message || 'Помилка при оновленні')
    }
  }

  const remove = async (id: string) => {
    const res = await deleteService({ id })
    if ('data' in res) message.success('Видалено!')
    else message.error('Помилка при видаленні')
  }

  const startAdd = () => setIsAdding(true)

  const cancelAdd = () => {
    setIsAdding(false)
    setNewServiceName('')
  }

  const submitAdd = async () => {
    if (!newServiceName.trim()) {
      message.warning('Назва не може бути порожньою')
      return
    }
    try {
      await createService({
        name: newServiceName.trim(),
        domainId: '',
      }).unwrap()
      message.success('Створено!')
      cancelAdd()
    } catch (error: any) {
      message.error(error?.data?.message || 'Помилка при створенні')
    }
  }

  return {
    services,
    isLoading,
    isError,
    isUpdating,
    isDeleting,
    isCreating,
    editingKey,
    tempName,
    setTempName,
    startEdit,
    cancelEdit,
    saveEdit,
    remove,
    isAdding,
    newServiceName,
    setNewServiceName,
    startAdd,
    cancelAdd,
    submitAdd,
  }
}
