import { useState, useEffect } from 'react'

function getStorageValue(key, defaultValue) {
  return typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem(key)) || defaultValue
    : defaultValue
}

function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => getStorageValue(key, defaultValue))

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

export default useLocalStorage
