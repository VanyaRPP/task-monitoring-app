import { Input } from 'antd'
import { useState } from 'react'
import s from './style.module.scss'

export const SearchBar = ({ className }) => {
  const [search, setSearch] = useState<string>('')
  const onSearch = (value: string) => setSearch(value)

  return (
    <Input.Search
      value={search}
      placeholder="input search text"
      onSearch={onSearch}
      enterButton
      className={s.Search}
    />
  )
}
