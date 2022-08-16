import { IAddress, IGeoCode } from 'common/modules/models/Task'
import IPlusCode, { LocationType } from 'common/lib/plusTypes.types'
import { useCallback, useState } from 'react'

const useGoogleQueries = () => {
  const [address, setAddress] = useState<IAddress>(null)

  const getAddress = async (geoCode: IGeoCode) => {
    const response = fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${geoCode?.lat},${geoCode?.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    )
    const answer: IPlusCode = await (await response).json()
    const { results } = answer
    const rooftopResults = results.map((item) => {
      if (item.geometry.location_type === LocationType.Rooftop)
        return item
    })
    setAddress({name: rooftopResults[0].formatted_address, geoCode: rooftopResults[0].geometry.location})
  }

  const getGeoCode = useCallback(async (address: string) => {
    const addressFormatted = address?.split(' ').join('+')
    const response = fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${addressFormatted}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    )
    const answer = await (await response).json()
    const { results } = answer
    const rooftopResults = results.map((item) => {
      if (item.geometry.location_type === LocationType.Rooftop)
        return item
    })
    setAddress({name: rooftopResults[0].formatted_address, geoCode: rooftopResults[0].geometry.location})
  }, [])

  return { getAddress, getGeoCode, address }
}

export default useGoogleQueries
