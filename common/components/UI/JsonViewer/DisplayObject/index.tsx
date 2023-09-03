import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { useState } from "react"
import s from '../style.module.scss'

const DisplayObject = ({children}) => {
    const [expanded, setExpanded] = useState(true)

    const Icon = expanded ? MinusCircleOutlined : PlusCircleOutlined

    return (
      <>
            <Icon onClick={() => setExpanded((prev) => !prev)} />
            {expanded && <div className={s.jsonObj}>{children}</div>}
      </>
    )
}

export default DisplayObject
