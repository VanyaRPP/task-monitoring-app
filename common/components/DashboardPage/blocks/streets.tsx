import { StreetsTable } from '@common/components/Tables/StreetsTable'

const StreetsBlock: React.FC<{
  domainId?: string
}> = ({ domainId }) => {
  return <StreetsTable domain={domainId} />
}

export default StreetsBlock
