import { useJsApiLoader } from '@react-google-maps/api'
import { Form, Input, FormInstance } from 'antd'
import { useCallback, useState, useMemo, useRef, useEffect } from 'react'
import { centerTownGeoCode } from 'utils/constants'
import Map from '../Map'
import { Polygon } from '@react-google-maps/api'
import { IAddress } from '../../modules/models/Task'

interface Props {
  isFormDisabled: boolean
  form: FormInstance
}

const AddDomainModal: React.FC<Props> = ({ isFormDisabled, form }) => {
  const [waypoints, setWaypoints] = useState([])
  const [address, setAddress] = useState<IAddress>(null)

  const [libraries] = useState(['places'] as any)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  })

  const mapOptions = useMemo(() => {
    return {
      geoCode: centerTownGeoCode,
      zoom: 17,
    }
  }, [waypoints])

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

  // Clean up refs
  const onUnmount = useCallback(() => {
    listenersRef.current.forEach((lis) => lis.remove())
    polygonRef.current = null
    setWaypoints([])
    setAddress(null)
  }, [])

  const check = useCallback(() => {
    if (!address && Object.keys(address).length <= 0) {
      return
    }
    setWaypoints([...waypoints, address?.geoCode])
    setAddress(null)
  }, [address])

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
    >
      <Form.Item name="name" label="Domain name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item name="desription" label="Description">
        <Input.TextArea maxLength={250} />
      </Form.Item>
      <Form.Item
        name="domain"
        label="Polygon (Domain area)"
        rules={[{ required: true }]}
      >
        <Map
          isLoaded={isLoaded}
          mapOptions={waypoints.length < 2 ? mapOptions : null}
          // mapOptions={mapOptions}
          setAddress={setAddress}
        >
          <Polygon
            options={{
              fillColor: 'green',
              fillOpacity: 0.2,
              strokeColor: 'green',
              strokeOpacity: 0.75,
              strokeWeight: 2,
              strokePosition: 2,
            }}
            editable
            draggable
            path={waypoints}
            onMouseUp={onEdit}
            onDragEnd={onEdit}
            onLoad={onLoad}
            onUnmount={onUnmount}
          />
        </Map>
      </Form.Item>
    </Form>
  )
}

export default AddDomainModal
