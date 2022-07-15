import { Input } from 'antd'

export const SearchBar = ({ className }) => {
  const onSearch = (value: string) => console.log(value)

  return (
    <Input.Search
      placeholder="input search text"
      onSearch={onSearch}
      enterButton
      className={className}
    />
  )
}
