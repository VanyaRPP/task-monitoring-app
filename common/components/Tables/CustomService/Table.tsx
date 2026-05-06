import { Alert, Flex, Table, Typography } from 'antd'
import { AddServiceForm } from './AddServiceForm'
import { getColumns } from './columns'
import { useCustomServices } from './useCustomServices'

export const CustomServicesTable: React.FC = () => {
  const {
    services,
    isLoading,
    isError,
    isUpdating,
    isDeleting,
    isCreating,
    editingKey,
    tempName,
    setTempName,
    startEdit,
    cancelEdit,
    saveEdit,
    remove,
    isAdding,
    newServiceName,
    setNewServiceName,
    startAdd,
    cancelAdd,
    submitAdd,
  } = useCustomServices()

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  const columns = getColumns({
    editingKey,
    tempName,
    setTempName,
    startEdit,
    cancelEdit,
    saveEdit,
    remove,
    isUpdating,
    isDeleting,
  })

  return (
    <>
      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: 16 }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Послуги
        </Typography.Title>
        <AddServiceForm
          isAdding={isAdding}
          newServiceName={newServiceName}
          setNewServiceName={setNewServiceName}
          startAdd={startAdd}
          cancelAdd={cancelAdd}
          submitAdd={submitAdd}
          isCreating={isCreating}
          disabled={isUpdating || isDeleting}
        />
      </Flex>
      <Table
        rowKey="_id"
        loading={isLoading}
        dataSource={services}
        columns={columns}
        pagination={{ position: ['bottomCenter'] }}
      />
    </>
  )
}
