import React, { useCallback, useRef } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { IGeoCode } from 'common/modules/models/Task'
import s from './style.module.scss'
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
}: {
  isLoaded: boolean
  mapOptions: IMapOptions
}) => {
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
        id="map-with-marker"
        mapContainerStyle={containerStyle}
        center={mapOptions?.geoCode}
        zoom={mapOptions?.zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={defaultOptions}
      >
        {/* Child components, such as markers, info windows, etc. */}
        <Marker position={mapOptions?.geoCode} />
      </GoogleMap>
    </div>
  ) : (
    <></>
  )
}

export default Map
