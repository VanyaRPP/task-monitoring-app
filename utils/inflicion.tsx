import moment from 'moment'
import { Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'

export function InflicionIndexTitle({ previousMonth }) {
  return (
    <>
      Індекс інфляції
      {previousMonth?.inflicionPrice !== undefined ? (
        <>
          <br />
          {previousMonth?.inflicionPrice?.toFixed(2) + '%'}{' '}
          <Tooltip title={`за ${moment(previousMonth?.date)?.format('MMMM')}`}>
            <QuestionCircleOutlined />
          </Tooltip>
        </>
      ) : (
        <>
          <br />
          {'0% '}
          <Tooltip title={'невідомий'}>
            <QuestionCircleOutlined />
          </Tooltip>
        </>
      )}
    </>
  )
}
