import moment from 'moment'

export function InflicionIndexTitle({ previousMonth }) {
  return (
    <>
      Індекс інфляції
      {previousMonth ? (
        <>
          {' '}
          {previousMonth?.date ? (
            <>
              <br />
              <b>{moment(previousMonth?.date)?.format('MMMM')}</b>
            </>
          ) : (
            ''
          )}{' '}
          {previousMonth?.inflicionPrice !== undefined
            ? previousMonth?.inflicionPrice?.toFixed(2) + '%'
            : 'невідомий'}
        </>
      ) : (
        <>
          <br />
          відсутній
        </>
      )}
    </>
  )
}
