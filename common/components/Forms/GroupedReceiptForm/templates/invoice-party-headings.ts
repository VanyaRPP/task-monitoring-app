const trimText = (s: string | undefined) => (s ?? '').trim()

const withoutLeadingDuplicate = (lines: string[], heading: string): string[] => {
  const h = trimText(heading)
  if (!h || !lines.length) {
    return lines
  }
  if (trimText(lines[0]) === h) {
    return lines.slice(1)
  }
  return lines
}

export const getDomainHeading = (data: any, domainName?: string): string =>
  (typeof data?.domain === 'object' && data?.domain?.name
    ? data.domain.name
    : undefined) || (domainName?.trim() || '')

export const getReceiverCompanyHeading = (data: any): string =>
  (data?.reciever?.companyName || data?.reciever?.name || '').trim()

export const getBillFromHeadingAndBodyLines = (
  data: any,
  paymentInfoLines: string[]
): { heading: string; bodyLines: string[] } => {
  const heading = getReceiverCompanyHeading(data)
  const bodyLines = heading
    ? withoutLeadingDuplicate(paymentInfoLines, heading)
    : paymentInfoLines
  return { heading, bodyLines }
}

export const getIssuedToHeadingAndBodyLines = (
  data: any,
  issuedToLines: string[],
  domainName?: string
): { heading: string; bodyLines: string[] } => {
  const heading = getDomainHeading(data, domainName)
  const bodyLines = heading
    ? withoutLeadingDuplicate(issuedToLines, heading)
    : issuedToLines
  return { heading, bodyLines }
}

export const getRecipientCompanyHeading = (data: any, companyLabel?: string): string =>
  (
    (data?.reciever?.companyName || data?.reciever?.name) ||
    (typeof data?.company === 'object' && data?.company !== null
      ? (data.company as { companyName?: string }).companyName
      : undefined) ||
    companyLabel ||
    data?.sender?.companyName ||
    data?.sender?.name ||
    data?.client?.companyName ||
    data?.client?.name ||
    data?.issuedTo?.companyName ||
    data?.issuedTo?.name ||
    ''
  ).trim()
