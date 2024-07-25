import { IAddress, IGeoCode } from '@modules/models/Task'
import { useAppSelector } from '@modules/store/hooks'
import { RootState } from '@modules/store/store'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { COLOR_THEME } from '@utils/constants'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DarkMapTheme } from './MapStyle'
import s from './style.module.scss'

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
  styles: null, // theme change after build
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
  children,
  isLoaded,
  mapOptions,
  setAddress,
}: {
  children?: any
  isLoaded: boolean
  mapOptions: IMapOptions
  setAddress?: React.Dispatch<React.SetStateAction<IAddress>>
}) => {
  const theme = useAppSelector((state: RootState) => state.theme)

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
        options={{
          ...defaultOptions,
          styles: theme === COLOR_THEME.LIGHT ? null : DarkMapTheme,
        }}
      >
        {/* Child components, such as markers, info windows, etc. */}
        {isMounted && (
          <>
            <Marker
              position={mapOptions?.geoCode}
              draggable
              onDragEnd={handleDragEnd}
            />
            {children}
          </>
        )}
      </GoogleMap>
    </div>
  ) : (
    <></>
  )
}

export default Map
