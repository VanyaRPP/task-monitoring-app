import {
  useAddDomainMutation,
  useEditDomainMutation,
  useGetDomainsQuery,
  useGetDomainTypeTemplatesQuery,
} from '@common/api/domainApi/domain.api'
import { Form, message } from 'antd'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import DomainForm from './DomainForm'
import Modal from '../../ModalWindow'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useEditRealEstateMutation } from '@common/api/realestateApi/realestate.api'
import { filterChangedCompaniesAreas } from './areasFilter'

interface Props {
  currentDomain: IExtendedDomain
  closeModal: VoidFunction
  editable: boolean
}

const DomainModal: FC<Props> = ({ currentDomain, closeModal, editable }) => {
  const [form] = Form.useForm()
  const [isValueChanged, setIsValueChanged] = useState(false)
  const [addDomainEstate, { isLoading: isAdding }] = useAddDomainMutation()
  const [editDomain, { isLoading: isEditing }] = useEditDomainMutation()
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
    })
  }, [currentDomain, form, user, templates, defaultTemplateId])

  const handleSubmit = async () => {
    await form.validateFields()
    const formData = form.getFieldsValue()

    if (
      !currentDomain &&
      domains?.some((domain) => domain.name === formData.name)
    ) {
      message.error({
        content:
          'Помилка при додаванні надавача послуг!  Домен з такою назвою вже існує!',
        duration: 4,
        style: { marginTop: '20vh', fontSize: '2rem', zIndex: 9999 },
      })
      return
    }

    const domainData = {
      name: formData.name,
      adminEmails: formData.adminEmails,
      streets: formData.streets.some((i: any) => i.value)
        ? formData.streets.map((i: any) => i.value)
        : formData.streets,
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
      
      closeModal()
      setIsValueChanged(false);
      form.resetFields()
      message.success(currentDomain ? 'Збережено' : 'Додано')
    } else {
      const action = currentDomain ? 'збереженні' : 'додаванні'
      message.error(`Помилка при ${action} надавача послуг`)
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
      confirmLoading={isAdding || isEditing}
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
