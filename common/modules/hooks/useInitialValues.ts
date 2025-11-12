import dayjs from 'dayjs'

function useInitialValues(currentService) {
  // TODO: add useEffect || useCallback ?
  // currently we have few renders
  // we need it only once. on didmount (first render)
  const initialValues = {
    domain: currentService?.domain?.name,
    street:
      currentService?.street &&
      `${currentService.street.address} (м. ${currentService.street.city})`,
    date: dayjs(currentService?.date),
    electricityPrice: currentService?.electricityPrice,
    inflicionPrice: currentService?.inflicionPrice,
    rentPrice: currentService?.rentPrice,
    waterPrice: currentService?.waterPrice,
    description: currentService?.description,
    waterPriceTotal: currentService?.waterPriceTotal,
    garbageCollectorPrice: currentService?.garbageCollectorPrice,
    customServices: currentService.customServices,
    losses: currentService?.losses,
    consumedElectricity: currentService?.consumedElectricity || null,
    generalElectricity: currentService?.generalElectricity || null,
    isVAT: currentService?.isVAT || true,
  }
  return initialValues
}

export default useInitialValues
