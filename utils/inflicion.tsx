import { usePreviousMonthService } from '@common/modules/hooks/useService'
import moment from 'moment'

export function InflicionIndexTitle({ service, useHook }) {
  const { form } = useHook()
  const { previousMonth } = usePreviousMonthService({
    date: service?.date,
    domainId: form.getFieldValue('domain'),
    streetId: form.getFieldValue('street'),
  })

  return (
    <>
      Індекс інфляції
      {previousMonth && (
        <>
          {' '}
          {previousMonth?.date
            ? moment(previousMonth?.date)?.format('MMMM')
            : ''}{' '}
          {previousMonth?.inflicionPrice !== undefined
            ? previousMonth?.inflicionPrice?.toFixed(2) + '%'
            : 'невідомий'}
        </>
      )}
    </>
  )
}


export function getInflicionValue(mainSum, inflicionPrice) {
  const percent = inflicionPrice - 100
  const inflicionValue = (mainSum * percent) / 100
  if (inflicionValue < 0) return '0.00'
  return inflicionValue.toFixed(2)
}
