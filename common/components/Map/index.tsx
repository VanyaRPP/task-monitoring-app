import React, { useCallback, useRef, useState } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { IAddress, IGeoCode } from 'common/modules/models/Task'
import s from './style.module.scss'
import { useEffect } from 'react'
import { add } from 'cypress/types/lodash'
// import { DarkMapTheme } from './MapStyle'

const defaultOptions = {
  panControl: true,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  keyboardShortcuts: false,
  disableDoubleClickZoom: false,
  fullscreenControl: false,
  // styles: DarkMapTheme // theme change after build
}

const containerStyle = {
  width: '1fr',
  height: '400px',
}

interface IMapOptions {
  geoCode: IGeoCode
  zoom: number
}

const Map = ({
  isLoaded,
  mapOptions,
  setAddress,
}: {
  isLoaded: boolean
  mapOptions: IMapOptions
  setAddress: React.Dispatch<React.SetStateAction<IAddress>>
}) => {
  const mapRef = useRef(undefined)
  const [isMounted, setIsMounted] = useState<boolean>(false)

  const onLoad = useCallback(function callback(map) {
    mapRef.current = map
  }, [])

  const onUnmount = useCallback(function callback(map) {
    mapRef.current = undefined
  }, [])

  const handleDragEnd = useCallback(
    (e) => {
      const geoCode: IGeoCode = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      }
      setAddress({
        name: '',
        geoCode,
      })
    },
    [setAddress]
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return isLoaded ? (
    <div className={s.Container}>
      <GoogleMap
        id="map-with-marker"
        mapContainerStyle={containerStyle}
        center={mapOptions?.geoCode}
        zoom={mapOptions?.zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={defaultOptions}
      >
        {/* Child components, such as markers, info windows, etc. */}
        {isMounted && (
          <Marker
            position={mapOptions?.geoCode}
            draggable
            onDragEnd={handleDragEnd}
          />
        )}
      </GoogleMap>
    </div>
  ) : (
    <></>
  )
}

export default Map
