import { EditFilled } from '@ant-design/icons'
import { EditCompanyModal } from '@common/components/Modals/EditCompanyModal'
import { IDomain } from '@common/modules/models/Domain'
import { IRealEstate } from '@common/modules/models/RealEstate'
import { IStreet } from '@common/modules/models/Street'
import { Button, ButtonProps } from 'antd'
import { useState } from 'react'

export interface EditCompanyButtonProps extends Omit<ButtonProps, 'onClick'> {
  company?: IRealEstate['_id']
  street?: IStreet['_id']
  domain?: IDomain['_id']
  editable?: boolean
}

// TODO: handle editable internally maybe?
/**
 * Create/edit company button with wrapped `EditCompanyModal`
 *
 * @param company - editing company id (leave empty to create new company)
 * @param street - default street id
 * @param domain - default domain id
 * @param editable - describes is form read-only or can be edited and is button enabled (default - `true`)
 * @param ...props - rest of `antd#Button` props except `onClick`
 */
export const EditCompanyButton: React.FC<EditCompanyButtonProps> = ({
  company: companyId,
  street: streetId,
  domain: domainId,
  editable = true,
  children = <EditFilled />,
  ...props
}) => {
  // const { data: user } = useGetCurrentUserQuery()

  const [open, setOpen] = useState<boolean>(false)

  // const { data: company, isLoading: isCompanyLoading } = useGetRealEstateQuery(
  //   companyId,
  //   { skip: !companyId }
  // )

  // const editable = useMemo(() => {
  //   return (
  //     _editable ||
  //     user?.roles?.includes(Roles.GLOBAL_ADMIN) ||
  //     company?.adminEmails.includes(user?.email)
  //   )
  // }, [company, user, _editable])

  return (
    <>
      <Button
        type="dashed"
        onClick={() => setOpen(true)}
        // loading={isCompanyLoading}
        {...props}
      >
        {children}
      </Button>

      <EditCompanyModal
        open={open}
        company={companyId}
        street={streetId}
        domain={domainId}
        editable={editable}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
