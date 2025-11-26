import { Button, Space, Form, FormInstance, message } from 'antd'
import { IService } from '@common/api/serviceApi/service.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { ServiceType } from '@utils/constants'
import { useEffect, useState, useCallback } from 'react'

interface UpdateInvoiceButtonProps {
  form: FormInstance
  service?: IService
  company?: IRealestate
  onClick?: () => void
  disabled?: boolean
}

export default function UpdateInvoiceButton({
  form,
  service,
  company,
  onClick,
  disabled = false,
}: UpdateInvoiceButtonProps) {
  const currentInvoice = Form.useWatch('invoice', form)
  const [isUpdateNeeded, setIsUpdateNeeded] = useState(false)

  const calculateUpdatedItem = useCallback(
    (item: any) => {
      if (!service) return item

      const type = item.type

      if (type === ServiceType.Electricity) {
        return {
          ...item,
          price: service.electricityPrice ?? 0,
          losses: service.losses ?? item.losses ?? 0,
        }
      }

      if (type === ServiceType.Maintenance) {
        if (company?.servicePricePerMeter && company.servicePricePerMeter > 0) {
          return { ...item, price: company.servicePricePerMeter }
        }
        return { ...item, price: service.rentPrice ?? 0 }
      }

      if (type === ServiceType.Water) {
        return { ...item, price: service.waterPrice ?? 0 }
      }

      if (type === ServiceType.WaterPart) {
        const totalWater = service.waterPriceTotal ?? 0
        const partPercent = company?.waterPart ?? 0
        const calculated = (totalWater * partPercent) / 100
        return { ...item, price: calculated }
      }

      if (type === ServiceType.GarbageCollector) {
        if (service.garbageCollectorPrice && company?.rentPart) {
          const calculated =
            (service.garbageCollectorPrice * company.rentPart) / 100
          return { ...item, price: calculated }
        }
        return { ...item, price: service.garbageCollectorPrice ?? 0 }
      }

      if (type === ServiceType.Inflicion) {
        return { ...item, price: service.inflicionPrice ?? 0 }
      }

      if (type === ServiceType.Discount) {
        return { ...item, price: company?.discount ?? 0 }
      }

      if (type === ServiceType.Cleaning) {
        if (company?.cleaning !== undefined) {
          return { ...item, price: company.cleaning }
        }
        const serviceCustom = service.customServices?.find(
          (cs) => cs.label === 'Прибирання' || cs.fieldName === 'cleaning'
        )
        if (serviceCustom) {
          return { ...item, price: serviceCustom.price }
        }
        return item
      }

      if (type === ServiceType.Custom) {
        const match = service.customServices?.find(
          (cs: any) => cs._id === item.customService || cs.label === item.name
        )

        if (match) {
          return {
            ...item,
            price: match.price,
            name: match.label,
          }
        }
      }

      return item
    },
    [service, company]
  )

  useEffect(() => {
    if (!service || !currentInvoice || currentInvoice.length === 0) {
      setIsUpdateNeeded(false)
      return
    }

    const hasDifference = currentInvoice.some((currentItem: any) => {
      const idealItem = calculateUpdatedItem(currentItem)

      const isPriceDiff =
        Math.abs((currentItem.price || 0) - (idealItem.price || 0)) > 0.001

      let isLossesDiff = false
      if (currentItem.type === ServiceType.Electricity) {
        isLossesDiff =
          Math.abs((currentItem.losses || 0) - (idealItem.losses || 0)) > 0.001
      }

      return isPriceDiff || isLossesDiff
    })

    setIsUpdateNeeded(hasDifference)
  }, [currentInvoice, service, company, calculateUpdatedItem])

  const handleUpdateClick = () => {
    try {
      const values = form.getFieldsValue()
      const list = values.invoice || []

      if (!service) {
        message.error('Помилка: Дані тарифів не завантажено.')
        return
      }

      const updatedList = list.map((item: any) => calculateUpdatedItem(item))

      form.setFieldsValue({
        invoice: updatedList,
      })

      message.success('Рахунок оновлено!')
      if (onClick) onClick()
    } catch (error) {
      console.error(error)
      message.error('Сталася помилка при оновленні.')
    }
  }

  if (disabled || !isUpdateNeeded) {
    return null
  }

  return (
    <Form.Item>
      <Space style={{ width: '100%', justifyContent: 'right' }}>
        <Button type="primary" onClick={handleUpdateClick}>
          Оновити рахунок
        </Button>
      </Space>
    </Form.Item>
  )
}
