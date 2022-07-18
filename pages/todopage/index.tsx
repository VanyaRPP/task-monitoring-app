import s from './style.module.scss'
import React, { useEffect, useState } from 'react'
import TodoList from './TodoList'
import Context from './context'
import AddTodo from './AddTodo'
import Loader from './Loader'

const ToDoPage: React.FC = () => {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/todos?_limit=5')
      .then((response) => response.json())
      .then((todos) => {
        setTimeout(() => {
          setTodos(todos)
          setLoading(false)
        }, 1000)
      })
  }, [])

  function toogleTodo(id) {
    setTodos(
      todos.map((todo) => {
        if (todo.id === id) {
          todo.completed = !todo.completed
        }
        return todo
      })
    )
  }

  function removeTodo(id) {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  function addTodo(title) {
    setTodos(
      todos.concat([
        {
          title,
          id: Date.now(),
          completed: false,
        },
      ])
    )
  }

  return (
    <>
      <Context.Provider value={{ removeTodo }}>
        <div className={s.Wrapper}>
          <h1 className={s.Header}>Todo Page</h1>
          <AddTodo onCreate={addTodo} />

          {loading && <Loader />}
          {todos.length ? (
            <TodoList todos={todos} onToggle={toogleTodo} />
          ) : loading ? null : (
            <p>No notes!</p>
          )}
        </div>
      </Context.Provider>
    </>
  )
}

export default ToDoPage
//dfghj
