import { useState, useEffect } from 'react'
import { Form, Button, Input } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ModalWindow from '../../UI/ModalWindow'
import AddDomainModal from '../../Forms/AddDomainForm'
import s from './style.module.scss'
import { getModifiedObjectOfFormInstance } from '../../../../utils/helpers'
import { useAddDomainMutation } from '../../../api/domainApi/domain.api'
import { IDomain } from '../../../modules/models/Domain'
// import {}
import useDebounce from 'common/modules/hooks/useDebounce'
import { deleteExtraWhitespace } from '@common/assets/features/validators'

const AdminPageDomains: React.FC = () => {
  const [waypoints, setWaypoints] = useState([])
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
  const [isFormDisabled, setIsFormDisabled] = useState<boolean>(false)
  const [addDomain] = useAddDomainMutation()

  const [form] = Form.useForm()

  const onCancelModal = () => {
    setIsModalVisible(false)
    form.resetFields()
  }

  const onSubmitModal = async () => {
    form.setFieldsValue(
      getModifiedObjectOfFormInstance(form, [
        { name: 'area', value: waypoints },
      ])
    )
    const formData: IDomain = await form.validateFields()
    setIsFormDisabled(true)

    await addDomain({ ...formData })

    form.resetFields()
    setIsModalVisible(false)
    setIsFormDisabled(false)
  }

  // Wait backend form domains (get all, get by id, itc.)
  // const { data } = useGetAllDomainsQuery('')
  const data = {
    data: [
      {
        name: 'domain',
        waypoints: [
          {
            lat: 50.2456342,
            lng: 28.6568704,
          },
          {
            lat: 51.2456342,
            lng: 27.6568704,
          },
          {
            lat: 51.2456342,
            lng: 28.6568704,
          },
          {
            lat: 50.2456342,
            lng: 27.6568704,
          },
        ],
      },
    ],
  }

  const [domains, setDomains] = useState(data?.data)
  const [search, setSearch] = useState('')
  const debounced = useDebounce<string>(search)

  useEffect(() => {
    setDomains(
      data?.data.filter((item) =>
        item.name.toLowerCase().includes(debounced.toLowerCase())
      )
    )
  }, [debounced, data?.data])

  return (
    <div className={s.Container}>
      <div className={s.Controls}>
        <Input
          placeholder="Пошук домену..."
          value={search}
          onChange={(e) => setSearch(deleteExtraWhitespace(e.target.value))}
        />
        <Button
          className={s.AddButton}
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        />

        <ModalWindow
          title={`Add new domain`}
          isModalVisible={isModalVisible}
          onCancel={onCancelModal}
          onOk={onSubmitModal}
          okText="Create domain"
          cancelText="Cancel"
        >
          <AddDomainModal
            isFormDisabled={isFormDisabled}
            form={form}
            waypoints={waypoints}
            setWaypoints={setWaypoints}
          />
        </ModalWindow>
      </div>

      {/* {domains && <DomainsList domains={domains} />} */}
    </div>
  )
}

export default AdminPageDomains
