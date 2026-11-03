import React, { useMemo, useState } from 'react'
import { Select } from 'antd'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import type { ICompanyCandidate } from '@common/services/aiAssistant/documents/types'
import styles from '../style.module.scss'

/**
 * Picks the company a statement goes to.
 *
 * The matched candidates come from the server. When none fits, the full list
 * is loaded on first open - not up front, since most cards never need it.
 */
const CompanyPicker: React.FC<{
  candidates: ICompanyCandidate[]
  value?: string
  onChange: (company: ICompanyCandidate) => void
  disabled: boolean
}> = ({ candidates, value, onChange, disabled }) => {
  const [wantAll, setWantAll] = useState(false)
  const { data: { data: all } = { data: [] }, isFetching } =
    useGetAllRealEstateQuery({ archived: false }, { skip: !wantAll })

  const options = useMemo(() => {
    const byId = new Map<string, ICompanyCandidate>()
    candidates.forEach((candidate) => byId.set(candidate.id, candidate))
    ;(all ?? []).forEach((company: any) => {
      if (byId.has(company._id)) return
      byId.set(company._id, {
        id: company._id,
        companyName: company.companyName,
        domainId: String(company.domain?._id ?? company.domain ?? ''),
        domainName: company.domain?.name ?? '',
      })
    })
    return [...byId.values()]
  }, [candidates, all])

  return (
    <Select
      showSearch
      size="small"
      className={styles.importPicker}
      placeholder="Оберіть компанію"
      value={value}
      disabled={disabled}
      loading={isFetching}
      optionFilterProp="label"
      onOpenChange={(open) => open && setWantAll(true)}
      onChange={(id) => {
        const picked = options.find((option) => option.id === id)
        if (picked) onChange(picked)
      }}
      options={options.map((option) => ({
        value: option.id,
        label: option.domainName
          ? `${option.companyName} · ${option.domainName}`
          : option.companyName,
      }))}
    />
  )
}

export default CompanyPicker
