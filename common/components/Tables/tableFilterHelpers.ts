/**
 * antd's built-in column filter dropdown renders each `filters` option as a
 * single-line checkbox that doesn't wrap, so a long option (a company/domain
 * name with no length limit) overflows the dropdown horizontally instead of
 * wrapping. There's no prop to control this, so we reach into the DOM once
 * the dropdown opens and make it wrap.
 */
export function widenFilterDropdown(w = 240) {
  return (open: boolean) => {
    if (!open) return
    requestAnimationFrame(() => {
      document
        .querySelectorAll<HTMLElement>('.ant-table-filter-dropdown')
        .forEach((el) => {
          el.style.width = `${w}px`
          el.style.maxWidth = '90vw'
          el.querySelectorAll<HTMLElement>('.ant-checkbox + span').forEach(
            (span) => {
              span.style.whiteSpace = 'normal'
              span.style.wordBreak = 'break-word'
              span.style.lineHeight = '1.2'
              span.style.display = 'inline-block'
              span.style.maxWidth = '100%'
            }
          )
        })
    })
  }
}
