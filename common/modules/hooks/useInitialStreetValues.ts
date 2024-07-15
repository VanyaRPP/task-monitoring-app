import moment from 'moment'

function useInitialStreetValues(city, address) {
  // TODO: add useEffect || useCallback ?
  // currently we have few renders
  // we need it only once. on didmount (first render)
  const initialValues = {
    city: city,
    address: address,
  }
  return initialValues
}

export default useInitialStreetValues
