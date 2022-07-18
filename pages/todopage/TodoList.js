import React from 'react'
import PropTypes from 'prop-types'
import s from './style.module.scss'
import TodoItem from './TodoItem'

function TodoList(props) {
  return (
    <>
      <ul className={s.List}>
        {props.todos.map((todo, index) => {
          return (
            <TodoItem
              todo={todo}
              key={todo.id}
              index={index}
              onChange={props.onToggle}
            />
          )
        })}
      </ul>
    </>
  )
}

TodoList.propTypes = {
  todos: PropTypes.arrayOf(PropTypes.object).isRequired,
  onToggle: PropTypes.func.isRequired,
}

export default TodoList
