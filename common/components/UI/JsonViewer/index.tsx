import DisplayObject from './DisplayObject'
import s from './style.module.scss'
import { Form } from 'antd'

const JsonViewer = ({ json }) => {
  const view = (arr) => {
    return arr.map(([key, val], i) => {
      const type = Array.isArray(val)
        ? '[ ] '
        : typeof val === 'object'
        ? '{ } '
        : ''
      return (
        <div key={key} className="text">
          {type}
          {key}: &nbsp;
          {Array.isArray(val) ? (
            <DisplayObject>
              {val.map((item, index) =>
                typeof item === 'object'
                  ? view([['', item]])
                  : view([[index, item]])
              )}
            </DisplayObject>
          ) : typeof val === 'object' ? (
            <DisplayObject>{view(Object.entries(val))}</DisplayObject>
          ) : (
            JSON.stringify(val)
          )}
        </div>
      )
    })
    }

    const parsedJson = JSON.parse(json) || ''
    const jsObject = Array.isArray(parsedJson) ? [parsedJson] : parsedJson

    return (
      <Form.Item name="json" label="Опис">
        <div className={s.viewer}>{view(Object.entries(jsObject))}</div>
      </Form.Item>
    )
}

export default JsonViewer
