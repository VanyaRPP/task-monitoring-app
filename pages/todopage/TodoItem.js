import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import s from './style.module.scss'
import Context from './context'
import { Button, Checkbox } from 'antd'

function TodoItem({ todo, index, onChange }) {
  const { removeTodo } = useContext(Context)
  return (
    <>
      <li className={s.Li}>
        <span className={todo.completed ? s.Done : null}>
          <Checkbox
            type="checkbox"
            checked={todo.completed}
            onChange={() => onChange(todo.id)}
            className={s.Checkbox}
          />
          <strong>{index + 1}</strong>
          &nbsp;
          {todo.title}
        </span>
        <Button
          type="primary"
          htmlType="submit"
          className={s.Button}
          onClick={() => removeTodo(todo.id)}
        >
          &times;
        </Button>
        {/* <button className={s.Button} onClick={removeTodo}>
          &times;
        </button> */}
      </li>
    </>
  )
}

TodoItem.propTypes = {
  todo: PropTypes.object.isRequired,
  index: PropTypes.number,
  onChange: PropTypes.func.isRequired,
}

export default TodoItem
