import { IGeoCode } from 'common/modules/models/Task'
import IPlusCode, { LocationType } from 'common/lib/plusTypes.types'
import { useState } from 'react'

const useGetAddressFromGeoCode = () => {
  const [address, setAddress] = useState<string>(null)

  const getAddress = async (geoCode: IGeoCode) => {
    const responce = fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${geoCode?.lat},${geoCode?.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    )
    const answer: IPlusCode = await (await responce).json()
    const { results } = answer
    const rooftopResults = results.map((item) => {
      if (item.geometry.location_type === LocationType.Rooftop)
        return item.formatted_address
    })
    setAddress(rooftopResults[0])
  }

  return { getAddress, address }
}

export default useGetAddressFromGeoCode
