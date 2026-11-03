import { Tooltip, Typography } from 'antd'
import type { SelectProps } from 'antd'
import {
  ARCHIVED_COMPANY_LABEL,
  CompanyDisplay,
  CompanyDisplayStatus,
  CompanyLike,
  UNAVAILABLE_COMPANY_HINT,
  UNAVAILABLE_COMPANY_LABEL,
  resolveCompanyDisplay,
} from '@utils/companyDisplay'

/**
 * Renders a company that may have been archived or become unavailable.
 * Archived → "Архівована" with the real name in a tooltip; unavailable →
 * "Недоступна" with an explanation. The company id is never shown.
 */
const CompanyStatusLabel: React.FC<{ display: CompanyDisplay }> = ({
  display,
}) => {
  if (display.status === CompanyDisplayStatus.Active) {
    return <>{display.name}</>
  }

  const isArchived = display.status === CompanyDisplayStatus.Archived
  return (
    <Tooltip
      title={isArchived ? display.name : UNAVAILABLE_COMPANY_HINT}
      placement="bottom"
    >
      <Typography.Text
        type="secondary"
        italic
        data-testid={
          isArchived ? 'company-status-archived' : 'company-status-unavailable'
        }
      >
        {isArchived ? ARCHIVED_COMPANY_LABEL : UNAVAILABLE_COMPANY_LABEL}
      </Typography.Text>
    </Tooltip>
  )
}

/**
 * `labelRender` for a company Select whose value may point to a company that is
 * missing from its options (archived / unavailable). Selected values that have
 * an option keep their regular label.
 */
export const companySelectLabelRender = (
  activeCompanies: CompanyLike[],
  knownCompanies: CompanyLike[] = []
): SelectProps['labelRender'] =>
  function renderCompanyLabel({ label, value }) {
    if (label !== undefined && label !== null) return label
    const display = resolveCompanyDisplay(
      value,
      activeCompanies,
      knownCompanies
    )
    return display ? <CompanyStatusLabel display={display} /> : null
  }

export default CompanyStatusLabel
