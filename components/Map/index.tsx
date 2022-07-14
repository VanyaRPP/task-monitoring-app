import React, { useCallback, useRef } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import s from './style.module.scss'
import { DarkMapTheme } from './MapStyle'

const defaultOptions = {
  panControl: true,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  clickableIcons: false,
  keyboardShortcuts: false,
  scrollwheel: false,
  disableDoubleClickZoom: false,
  fullscreenControl: false,
  // styles: DarkMapTheme // theme change after build
}

const containerStyle = {
  width: '1fr',
  height: '400px',
}

const Map = ({ center, isLoaded }) => {
  const G_MAP_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const libraries = ['places']

  // const { isLoaded } = useJsApiLoader({
  //   id: 'google-map-script',
  //   googleMapsApiKey: G_MAP_API_KEY
  // })

  const mapRef = useRef(undefined)

  const onLoad = useCallback(function callback(map) {
    mapRef.current = map
  }, [])

  const onUnmount = useCallback(function callback(map) {
    mapRef.current = undefined
  }, [])

  return isLoaded ? (
    <div className={s.Container}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={defaultOptions}
      >
        {/* Child components, such as markers, info windows, etc. */}
        <></>
      </GoogleMap>
    </div>
  ) : (
    <></>
  )
}

export default Map
