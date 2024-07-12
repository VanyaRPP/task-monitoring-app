import moment from 'moment'

function useInitialStreetValues(currentStreet) {
  // TODO: add useEffect || useCallback ?
  // currently we have few renders
  // we need it only once. on didmount (first render)
  const initialValues = {
    city: currentStreet?.city,
    address: currentStreet?.address,
  }
  return initialValues
}

export default useInitialStreetValues
