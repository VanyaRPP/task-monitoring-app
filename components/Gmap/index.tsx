import { useCallback, useState } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'

const containerStyle = {
  width: '1fr',
  height: '450px'
};

const Gmap = ({ place }) => {
  console.log('place', place);

  const [center, setCenter] = useState({ lat: -34.397, lng: 150.644 })

  console.log(place?.geometry?.location);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCrLYvKmksLWFJc17LLPTmfFDkacN4l0To'
  })


  const [map, setMap] = useState(null)

  const onLoad = useCallback((map) => {
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    setMap(map)
  }, [])

  const onUnmount = useCallback(function callback(map) {
    setMap(null)
  }, [])

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      <></>
    </GoogleMap>
  ) : <></>
}

export default Gmap