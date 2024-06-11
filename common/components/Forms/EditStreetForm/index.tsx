import {
  useAddStreetMutation,
  useEditStreetMutation,
  useGetStreetQuery,
} from '@common/api/streetApi/street.api'
import { EditFormAttributeProps, EditFormProps } from '@common/components/Forms'
import { IStreet } from '@common/modules/models/Street'
import { Form, FormInstance, Input, Spin, message } from 'antd'
import { useCallback, useEffect } from 'react'

export interface EditStreetFormProps extends EditFormProps<IStreet> {
  form?: FormInstance
  street?: IStreet['_id']
}

/**
 * Create/edit street form
 *
 * @param form - form instance (to use controls from parent component, such as `form.submit()`)
 * @param street - editing street id (leave empty to create new street)
 * @param editable - describes is form read-only or can be edited (default - `true`)
 * @param onFinish - callback executed on successfull form submit
 * @param onFinishFailed - callback executed on error appeared when form submit
 * @param ...props - rest of `antd#Form` props
 */
export const EditStreetForm: React.FC<EditStreetFormProps> = ({
  form: _form,
  street: streetId,
  editable = true,
  onFinish,
  onFinishFailed,
  ...props
}) => {
  const [form] = Form.useForm(_form)

  const { data: street, isLoading: isStreetLoading } = useGetStreetQuery(
    streetId,
    { skip: !streetId }
  )
  const [addStreet, { isLoading: isAddLoading }] = useAddStreetMutation()
  const [editStreet, { isLoading: isEditLoading }] = useEditStreetMutation()

  const isLoading = isStreetLoading || isEditLoading || isAddLoading

  const handleFinish = useCallback(
    async (fields: any) => {
      try {
        const response = street
          ? await editStreet({
              _id: street._id,
              ...fields,
            })
          : await addStreet(fields)

        if ('data' in response) {
          if (streetId && street) {
            message.success('Зміни для вулиці збережено')
          } else {
            message.success('Вулицю успішно додано')
          }
          onFinish?.(response.data)
        } else if ('error' in response) {
          throw response.error
        }
      } catch (error: any) {
        onFinishFailed?.(error)
        message.error('Виникла помилка при збереженні')
      }
    },
    [streetId, street, onFinish, onFinishFailed, editStreet, addStreet]
  )

  useEffect(() => {
    if (streetId && street) {
      form.setFieldsValue(street)
    } else {
      form.resetFields()
    }
  }, [form, streetId, street])

  return (
    <Form
      onFinish={handleFinish}
      form={form}
      layout="vertical"
      requiredMark={editable}
      {...props}
    >
      <City form={form} loading={isLoading} editable={editable} />
      <Address form={form} loading={isLoading} editable={editable} />
      {/* TODO: building number in separated field maybe? */}
    </Form>
  )
}

const City: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const city = Form.useWatch('city', form)

  return (
    <Form.Item
      label="Місто"
      name="city"
      required
      rules={[
        { required: true, message: `Поле "Місто" обов'язкове` },
        {
          pattern: new RegExp("^[А-ЩЬЮЯЄІЇҐа-щьюяєіїґ'-\\s]+$"),
          message: 'Неправильний формат',
        },
      ]}
    >
      {loading ? (
        <Spin />
      ) : editable ? (
        <Input
          placeholder="Введіть місто"
          disabled={disabled || loading}
          prefix="м."
        />
      ) : (
        <Form.Item noStyle>м. {city}</Form.Item>
      )}
    </Form.Item>
  )
}
const Address: React.FC<EditFormAttributeProps> = ({
  form,
  loading,
  disabled,
  editable,
}) => {
  const address = Form.useWatch('address', form)

  return (
    <Form.Item
      label="Адреса"
      name="address"
      required
      rules={[
        { required: true, message: `Поле "Адреса" обов'язкове` },
        {
          pattern: new RegExp("^[А-ЩЬЮЯЄІЇҐа-щьюяєіїґ0-9'-\\s]+$"),
          message: 'Неправильний формат',
        },
      ]}
    >
      {loading ? (
        <Spin />
      ) : editable ? (
        <Input
          placeholder="Введіть адресу"
          disabled={disabled || loading}
          prefix="вул."
        />
      ) : (
        <Form.Item noStyle>вул. {address}</Form.Item>
      )}
    </Form.Item>
  )
}
