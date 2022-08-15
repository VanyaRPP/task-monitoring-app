import { FormInstance } from 'antd'

export const firstTextToUpperCase = (text: string) =>
  text[0].toUpperCase() + text.slice(1)

export const getCount = (tasks: any, name: string) => {
  return tasks?.filter((task) => task?.category == name)
}
export const getModifiedObjectOfFormInstance = (
  form: FormInstance<any>,
  values: { name: string; value: any }[]
) => {
  const fields = form.getFieldsValue()
  values.map((item) => Object.assign(fields, { [item.name]: item.value }))
  return fields
}

export const getFormattedAddress = (address: string) => {
  if (address) {
    const addressChunks = address.split(',')
    if (
      addressChunks[0].includes('вулиця') ||
      addressChunks[0].includes('вул') ||
      addressChunks[0].includes('улица')
    ) {
      if (
        parseInt(addressChunks[1]) &&
        parseInt(addressChunks[1]) === parseInt(addressChunks[1])
      ) {
        return `${addressChunks[0]}, ${addressChunks[1]}`
      }
      return addressChunks[0]
    } else return addressChunks.join(', ')
  }
}
