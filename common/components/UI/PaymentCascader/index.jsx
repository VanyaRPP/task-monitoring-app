import React, { useMemo, useState, useCallback } from 'react'
import clsx from 'clsx'
import { TreeSelect, Button } from 'antd' 
import s from '@components/UI/PaymentCascader/styled.module.scss'
import { cascaderMonths, cascaderQuarters, cascaderYears } from '@utils/constants'

const toArray = (x) =>
  Array.isArray(x) ? x : x instanceof Set ? Array.from(x) : x && typeof x === 'object' ? Object.values(x) : []

const M = toArray(cascaderMonths)
const Q = toArray(cascaderQuarters)
const SEP = '|'
const QUARTER_TO_MONTHS = { Q1:[1,2,3], Q2:[4,5,6], Q3:[7,8,9], Q4:[10,11,12] }
const getQuarterMonths = (qVal) => {
  const key = String(qVal).toUpperCase().startsWith('Q') ? qVal : `Q${qVal}`
  return QUARTER_TO_MONTHS[key] || []
}
const keyToMonths = (keys) => {
  const out = new Set()
  for (const k of keys || []) {
    const [y, rest] = String(k).split(SEP)
    if (rest === 'year') (M || []).forEach((m) => out.add(`${y}-${m.value ?? m}`))
    else if (rest?.startsWith('q:')) getQuarterMonths(rest.slice(2)).forEach((m) => out.add(`${y}-${m}`))
    else if (rest?.startsWith('m:')) out.add(`${y}-${rest.slice(2)}`)
  }
  return Array.from(out)
}

const monthsToKeys = (months) => {
  if (!Array.isArray(months) || !months.length) return []
  const byYear = new Map()
  months.forEach((s) => {
    const [ys, ms] = String(s).split('-')
    const y = Number(ys), m = Number(ms)
    if (!y || !m) return
    if (!byYear.has(y)) byYear.set(y, new Set())
    byYear.get(y).add(m)
  })
  const keys = new Set()
  for (const [y, set] of byYear.entries()) {
    if (set.size === 12) { keys.add(`${y}${SEP}year`); continue }
    ;(Q || []).forEach((q) => {
      const qId = q.value ?? q
      const qMs = getQuarterMonths(qId)
      if (qMs.every((m) => set.has(m))) {
        keys.add(`${y}${SEP}q:${qId}`)
      }
    })
    set.forEach((m) => keys.add(`${y}${SEP}m:${m}`))
  }
  return Array.from(keys)
}

const normalizeMonthsByYear = (src) => {
  if (!src || typeof src !== 'object') return null
  const out = {}
  for (const [y, arr] of Object.entries(src)) {
    const yNum = Number(y)
    out[yNum] = (Array.isArray(arr) ? arr : []).map((m) => Number(m))
  }
  return out
}

const PaymentCascader = ({
  onChange,
  className,
  payments,
  monthsByYear,
  availableYears,
  selectedMonths,
}) => {
  const mby = useMemo(() => normalizeMonthsByYear(monthsByYear), [monthsByYear])
  const years = useMemo(() => {
    const set = new Set()
    if (Array.isArray(availableYears) && availableYears.length) availableYears.forEach((y) => set.add(Number(y)))
    if (mby) Object.keys(mby).forEach((y) => set.add(Number(y)))
    if (Array.isArray(payments) && payments.length) {
      payments.forEach((p) => {
        const d = new Date(p?.date ?? p?.createdAt ?? p)
        if (!Number.isNaN(d.getTime?.())) set.add(d.getFullYear())
      })
    }
    if (set.size === 0) { ;[...cascaderYears, 2018].forEach((y) => set.add(Number(y))) }
    return [...set].sort((a, b) => b - a)
  }, [availableYears, mby, payments])

  const getAvailableMonths = useCallback((year) => {
    if (mby) {
      const set = new Set(mby[year] ?? [])
      return M.filter((m) => set.has(Number(m.value ?? m)))
    }
    return M
  }, [mby])

  const getQuarterMonthsAvailable = useCallback((year, qId) => {
    const avail = new Set(getAvailableMonths(year).map((m) => Number(m.value ?? m)))
    return getQuarterMonths(qId).filter((m) => avail.has(Number(m)))
  }, [getAvailableMonths])

  const treeData = useMemo(
    () =>
      years.map((year) => {
        const availMonths = getAvailableMonths(year)
        return {
          title: String(year),
          value: `${year}${SEP}year`,
          children: [
            { title: <span className="pm-group">Місяць</span>, value: `${year}${SEP}_label-months`, disabled: true, checkable: false, selectable: false },
            ...availMonths.map((m) => ({
              title: m.label ?? String(m.value ?? m),
              value: `${year}${SEP}m:${m.value ?? m}`,
            })),
            { title: <span className="pm-group">Квартал</span>, value: `${year}${SEP}_label-quarters`, disabled: true, checkable: false, selectable: false },
            ...(Q || []).map((q) => {
              const qId = q.value ?? q
              const qAvail = getQuarterMonthsAvailable(year, qId)
              return {
                title: q.label ?? String(qId),
                value: `${year}${SEP}q:${qId}`,
                disabled: qAvail.length === 0,
              }
            }),
          ],
        }
      }),
    [years, getAvailableMonths, getQuarterMonthsAvailable]
  )

  const labelMap = useMemo(() => {
    const map = new Map()
    years.forEach((y) => {
      map.set(`${y}${SEP}year`, { year: y, text: String(y), kind: 'year' })
      ;(M || []).forEach((m) => map.set(`${y}${SEP}m:${m.value ?? m}`, { year: y, text: String(m.label ?? m.value ?? m), kind: 'month' }))
      ;(Q || []).forEach((q) => map.set(`${y}${SEP}q:${q.value ?? q}`, { year: y, text: String(q.label ?? q.value ?? q), kind: 'quarter' }))
    })
    return map
  }, [years])

  const controlled = Array.isArray(selectedMonths)
  const [innerValue, setInnerValue] = useState([])
  const renderedValue = controlled ? monthsToKeys(selectedMonths) : innerValue

  const handleReset = useCallback(() => {
    if (!controlled) setInnerValue([])
    onChange?.([]) 
  }, [controlled, onChange])

  const monthsCoveredByKey = (key) => {
    if (!key) return []
    const [ys, rest] = String(key).split(SEP)
    const y = Number(ys)
    if (!y) return []
    if (rest === 'year') return (M || []).map((m) => `${y}-${Number(m.value ?? m)}`)
    if (rest?.startsWith('q:')) {
      const qId = rest.slice(2)
      return getQuarterMonths(qId).map((m) => `${y}-${Number(m)}`)
    }
    if (rest?.startsWith('m:')) return [`${y}-${Number(rest.slice(2))}`]
    return []
  }
  const monthIdsForYear = (y) =>
    (M || []).map((m) => `${y}-${Number(m.value ?? m)}`);

  const countFullYearsExcept = (selectedSet, excludeYear, yearsList) =>
    (yearsList || []).reduce((acc, y) => {
      if (y === excludeYear) return acc;
      const all12 = monthIdsForYear(y).every((id) => selectedSet.has(id));
      return acc + (all12 ? 1 : 0);
    }, 0);

  const coveredCountInSelection = (coverKeys, selectedMonthIdsSet) =>
    coverKeys.reduce((acc, id) => acc + (selectedMonthIdsSet.has(id) ? 1 : 0), 0)

  return (
    <div className={clsx(s.PaymentCascader, className)} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <TreeSelect
        className={className}
        placeholder="Оберіть проміжок"
        treeData={treeData}
        treeCheckable
        treeCheckStrictly={false}
        showCheckedStrategy={TreeSelect.SHOW_ALL}
        allowClear
        maxTagCount={1}
        maxTagPlaceholder={() => null}
        tagRender={({ value: v }) => {
          const meta = labelMap.get(String(v));
          if (!meta) return null;
          const baseText =
            meta.kind === 'year' ? String(meta.year) : `${meta.text} ${meta.year}`;
          const selectedMonths = keyToMonths(renderedValue);
          const selectedSet = new Set(selectedMonths);
          const cover = monthsCoveredByKey(String(v));
          const baseCovered = coveredCountInSelection(cover, selectedSet);
          let extraMonths = Math.max(0, selectedSet.size - baseCovered);
          if (meta.kind === 'year') {
            const fullYears = countFullYearsExcept(selectedSet, meta.year, years);
            const remainderMonths = Math.max(0, extraMonths - fullYears * 12);
            const extra = fullYears + remainderMonths;
            return <span style={{ padding: 0, margin: 0 }}>{extra > 0 ? `${baseText} +${extra}` : baseText}</span>;
          }
          return <span style={{ padding: 0, margin: 0 }}>{extraMonths > 0 ? `${baseText} +${extraMonths}` : baseText}</span>;
        }}
        showSearch={false}
        listHeight={320}
        popupMatchSelectWidth
        value={renderedValue}
        popupRender={(menu) => (
            <div>
              {menu}
              <div style={{ display: 'flex', gap: 8, padding: 8 }}>
                <Button
                  type="default"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleReset}
                  disabled={!renderedValue?.length}
                  className="ant-btn ant-btn-default"
                  data-testid="reset-filter"
                >
                  Скинути
                </Button>
              </div>
            </div>
          )}
        onChange={(val, _labels, extra) => {
          if (!val?.length) {
            if (!controlled) setInnerValue([])
            onChange?.([])
            return
          }
          const raw = Array.isArray(val) ? val.map((v) => (v && v.value) ?? v) : []
          const set = new Set(raw)
          const trigger = extra?.triggerValue != null ? String(extra.triggerValue) : null
          const [triggerYear, triggerRest] = trigger ? trigger.split(SEP) : []
          const isChecked = extra?.selected ?? extra?.checked ?? false
          const removeYearChildren = (year) => {
            ;(M || []).forEach((m) => set.delete(`${year}${SEP}m:${m.value ?? m}`))
            ;(Q || []).forEach((q) => set.delete(`${year}${SEP}q:${q.value ?? q}`))
          }
          if (trigger && triggerRest === 'year') {
            removeYearChildren(triggerYear)
            if (isChecked) set.add(trigger); else set.delete(trigger)
          }
          if (trigger && triggerRest?.startsWith('q:')) {
            const qId = triggerRest.slice(2)
            const months = getQuarterMonthsAvailable(Number(triggerYear), qId)
            if (isChecked) {
              set.add(trigger)
              months.forEach((m) => set.add(`${triggerYear}${SEP}m:${m}`))
              set.delete(`${triggerYear}${SEP}year`)
            } else {
              set.delete(trigger)
              months.forEach((m) => set.delete(`${triggerYear}${SEP}m:${m}`))
            }
          }
          if (trigger && triggerRest?.startsWith('m:')) {
            set.delete(`${triggerYear}${SEP}year`)
            ;(Q || []).forEach((q) => set.delete(`${triggerYear}${SEP}q:${q.value ?? q}`))
          }
          const nextKeys = Array.from(set)
          const nextMonths = keyToMonths(nextKeys)

          onChange?.(nextMonths)
          if (!controlled) setInnerValue(nextKeys)
        }}
      />      
    </div>
  )
}
export default PaymentCascader
