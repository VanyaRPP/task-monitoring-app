import { Select } from 'antd';

const StreetsSelector = ({ setFilters, streets }) => {
  const options = streets?.map((street) => ({
    label: street.text,
    value: street.value,
  }));

  return (
    <Select
      placeholder="Виберіть вулицю"
      style={{ width: '200px' }}
      onChange={(value) => {
        setFilters((prevFilters) => ({
          ...prevFilters,
          street: value,
        }));
      }}
      allowClear
      options={options}
    />
  );
};


export default StreetsSelector;
