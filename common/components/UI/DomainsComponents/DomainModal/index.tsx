/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  useAddDomainMutation,
  useEditDomainMutation,
  useGetDomainsQuery,
  useGetDomainTypeTemplatesQuery,
} from '@common/api/domainApi/domain.api'
import { useAddStreetMutation } from '@common/api/streetApi/street.api'
import { Form, message } from 'antd'
import React, { FC, useEffect, useMemo, useState } from 'react'
import {
  IAddDomainResponse,
  IExtendedDomain,
} from '@common/api/domainApi/domain.api.types'
import DomainForm from './DomainForm'
import Modal from '../../ModalWindow'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useEditRealEstateMutation } from '@common/api/realestateApi/realestate.api'
import { filterChangedCompaniesAreas } from './areasFilter'

interface Props {
  currentDomain: IExtendedDomain
  closeModal: (createdDomain?: IExtendedDomain) => void
  editable: boolean
}

const DomainModal: FC<Props> = ({ currentDomain, closeModal, editable }) => {
  const [form] = Form.useForm()
  const [isValueChanged, setIsValueChanged] = useState(false)
  const [addDomainEstate, { isLoading: isAdding }] = useAddDomainMutation()
  const [editDomain, { isLoading: isEditing }] = useEditDomainMutation()
  const [addStreet, { isLoading: isStreetAdding }] = useAddStreetMutation()
  const { data: domains } = useGetDomainsQuery({})
  const { data: user } = useGetCurrentUserQuery()
  const [editRealEstate] = useEditRealEstateMutation()
  const { data: templates = [] } = useGetDomainTypeTemplatesQuery(undefined, {
    skip: !editable,
  })

  const defaultTemplateId = useMemo(
    () => templates.find((t) => t.isBuiltIn && t.name === 'Комунальні')?._id,
    [templates]
  )

  useEffect(() => {
    const templateId =
      currentDomain?.domainTypeTemplateId || defaultTemplateId || null

    let customServices = currentDomain?.customServices ?? []
    if (!customServices.length && templateId) {
      const tpl = templates.find((t) => t._id === templateId)
      if (tpl) {
        customServices = tpl.groups.map((g) => ({
          groupName: g.groupName,
          services: g.serviceIds.map(String),
        }))
      }
    }

    form.setFieldsValue({
      name: currentDomain?.name || '',
      adminEmails:
        currentDomain?.adminEmails || (user?.email ? [user.email] : []),
      streets:
        currentDomain?.streets.map((i: any) => ({
          value: i._id,
          label: `${i.address} (м. ${i.city})`,
        })) || [],
      description: currentDomain?.description || '',
      defaultTemplate: currentDomain?.defaultTemplate || null,
      IEName: currentDomain?.IEName || '',
      domainBankToken: currentDomain?.domainBankToken || '',
      mfo: currentDomain?.mfo || '',
      rnokpp: currentDomain?.rnokpp || '',
      iban: currentDomain?.iban || '',
      domainTypeTemplateId: templateId,
      customServices,
      isCreatingNewAddress: false,
    })
  }, [currentDomain, form, user, templates, defaultTemplateId])

  const handleSubmit = async () => {
    try {
      await form.validateFields()
      const formData = form.getFieldsValue()

      if (
        !currentDomain &&
        domains?.some((domain) => domain.name === formData.name)
      ) {
        message.error({
          content:
            'Помилка при додаванні надавача послуг! Домен з такою назвою вже існує!',
          duration: 4,
          style: { marginTop: '20vh', fontSize: '2rem', zIndex: 9999 },
        })
        return
      }

      let finalStreets: string[] = []

      // Логіка створення нової адреси перед створенням домену
      if (!currentDomain && formData.isCreatingNewAddress) {
        if (!formData.city || !formData.address) {
          message.error("Будь ласка, заповніть обов'язкові поля адреси")
          return
        }

        try {
          const streetResult = await addStreet({
            city: formData.city,
            address: formData.address,
          }).unwrap()

          // Безпечно дістаємо ID створеної адреси
          // @ts-ignore
          const createdStreetId = streetResult?.data?._id || streetResult?._id || streetResult?.data?.id || streetResult?.id

          if (createdStreetId) {
            finalStreets.push(createdStreetId.toString())
            message.success('Нову адресу успішно збережено в БД')
          } else {
            throw new Error('Сервер не повернув ID адреси')
          }
        } catch (streetError) {
          console.error('Помилка при створенні адреси:', streetError)
          message.error('Не вдалося створити адресу. Створення домену перервано.')
          return
        }
      } else {
        // Якщо адреса стара — зчитуємо значення як зазвичай
        finalStreets = formData.streets?.some((i: any) => i.value)
          ? formData.streets?.map((i: any) => i.value)
          : formData.streets || []
      }

      const domainData = {
        name: formData.name,
        adminEmails: formData.adminEmails,
        streets: finalStreets,
        description: formData.description,
        defaultTemplate: formData.defaultTemplate || undefined,
        IEName: formData.IEName,
        domainBankToken: formData.domainBankToken || [],
        mfo: formData.mfo,
        rnokpp: formData.rnokpp,
        iban: formData.iban,
        customServices: formData.customServices,
        domainTypeTemplateId: formData.domainTypeTemplateId || undefined,
      }

      const response = currentDomain
        ? await editDomain({ _id: currentDomain?._id, ...domainData })
        : await addDomainEstate(domainData)

      if ('data' in response) {
        const changedCompaniesAreas = filterChangedCompaniesAreas(
          formData.companiesAreas
        )

        if (changedCompaniesAreas.length > 0) {
          try {
            await Promise.all(
              changedCompaniesAreas.map((company) =>
                editRealEstate({
                  _id: company._id,
                  totalArea: company.area,
                  rentPart: company.rentPart,
                }).unwrap()
              )
            )
          } catch (e) {
            console.error('Помилка при збереженні площ компаній:', e)
            return message.error('Виникла помилка при оновленні даних площ')
          }
        }

        const createdDomain =
          !currentDomain && 'data' in response
            ? (response.data as IAddDomainResponse)?.data
            : undefined

        closeModal(createdDomain)
        setIsValueChanged(false)
        form.resetFields()
        message.success(currentDomain ? 'Збережено' : 'Додано')
      } else {
        const action = currentDomain ? 'збереженні' : 'додаванні'
        message.error(`Помилка при ${action} надавача послуг`)
      }
    } catch (error) {
      console.error('Validation or Submit error:', error)
    }
  }

  return (
    <Modal
      open={true}
      width={1000}
      title={'Надавачі послуг'}
      onOk={handleSubmit}
      changed={() => isValueChanged}
      onCancel={closeModal}
      okText={currentDomain ? 'Зберегти' : 'Додати'}
      cancelText={'Відміна'}
      okButtonProps={{ style: { ...(!editable && { display: 'none' }) } }}
      preview={!editable}
      confirmLoading={isAdding || isEditing || isStreetAdding}
    >
      <DomainForm
        form={form}
        editable={editable}
        setIsValueChanged={setIsValueChanged}
        domainId={currentDomain?._id}
      />
    </Modal>
  )
}

export default DomainModal
