/* eslint-disable @typescript-eslint/ban-ts-comment */
import AddStreetForm from '../AddStreetForm' // Імпортуємо форму створення адреси
import { Checkbox } from 'antd' // Імпортуємо чекбокс Ant Design
import AddressesSelect from '@components/UI/Reusable/AddressesSelect' // Імпортуємо існуючий селект адрес
import { IAddress, IGeoCode } from '@modules/models/Task'
import { useJsApiLoader } from '@react-google-maps/api'
import { Form, FormInstance, Input } from 'antd'
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

interface Props {
  isFormDisabled: boolean
  form: FormInstance
  waypoints: IGeoCode[]
  setWaypoints: Dispatch<SetStateAction<IGeoCode[]>>
  setIsValueChanged?: (value: boolean) => void // додаємо пропс для відстеження змін, якщо він потрібен
}

const AddDomainModal: React.FC<Props> = ({
  isFormDisabled,
  form,
  waypoints,
  setWaypoints,
  setIsValueChanged,
}) => {
  const [address, setAddress] = useState<IAddress>(null)
  const [libraries] = useState(['places'] as any)

  // Відстежуємо стан чекбокса "Створити нову адресу" в реальному часі
  const isCreatingNewAddress = Form.useWatch('isCreatingNewAddress', form)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  })

  // Define refs for Polygon instance and listeners
  const polygonRef = useRef(null)
  const listenersRef = useRef([])

  // Call setPath with new edited path
  const onEdit = useCallback(() => {
    if (polygonRef.current) {
      const nextPath = polygonRef.current
        .getPath()
        .getArray()
        .map((latLng) => {
          return { lat: latLng.lat(), lng: latLng.lng() }
        })
      setWaypoints(nextPath)
    }
  }, [setWaypoints])

  // Bind refs to current Polygon and listeners
  const onLoad = useCallback(
    (polygon) => {
      polygonRef.current = polygon
      const path = polygon.getPath()
      listenersRef.current.push(
        path.addListener('set_at', onEdit),
        path.addListener('insert_at', onEdit),
        path.addListener('remove_at', onEdit)
      )
    },
    [onEdit]
  )

  const check = useCallback(() => {
    if (!address && Object.keys(address).length <= 0) {
      return
    }
    setWaypoints((waypoints) => [...waypoints, address?.geoCode])
    setAddress(null)
  }, [address, setWaypoints])

  useEffect(() => {
    if (address) {
      check()
    }
  }, [address, check])

  return (
    <Form
      form={form}
      layout="vertical"
      name="form_in_modal"
      disabled={isFormDisabled}
      initialValues={{
        isCreatingNewAddress: false, // за замовчуванням чекбокс знятий
      }}
      onValuesChange={() => setIsValueChanged && setIsValueChanged(true)}
    >
      <Form.Item name="name" label="Domain name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      {/* 1. ЧЕКБОКС: Перемикач для створення нової адреси */}
      <Form.Item name="isCreatingNewAddress" valuePropName="checked" style={{ marginBottom: 12 }}>
        <Checkbox onChange={(e) => {
          if (e.target.checked) {
            form.setFieldValue('street', undefined) // очищуємо вибір зі списку, якщо створюємо нову
          }
        }}>
          + Створити нову адресу безпосередньо в модалці
        </Checkbox>
      </Form.Item>

      {/* 2. ЛОГІКА РЕНДЕРИНГУ: або вибір зі списку, або перевикористання форми адреси */}
      {!isCreatingNewAddress ? (
        <AddressesSelect form={form} edit={false} required={!isCreatingNewAddress} />
      ) : (
        <div style={{ 
          padding: '16px', 
          border: '1px dashed #722ed1', 
          borderRadius: '6px', 
          marginBottom: '20px' 
        }}>
          <h4 style={{ color: '#722ed1', marginBottom: '12px' }}>Нова адреса</h4>
          <AddStreetForm
            form={form}
            editable={true}
            setIsValueChanged={setIsValueChanged || (() => {})}
          />
        </div>
      )}

      <Form.Item name="desription" label="Description">
        <Input.TextArea maxLength={250} />
      </Form.Item>
    </Form>
  )
}

export default AddDomainModal
