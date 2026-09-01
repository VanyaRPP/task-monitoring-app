import dbConnect from '@utils/dbConnect'
import '@common/modules/models/RealEstate'
import '@common/modules/models/Domain'
import '@common/modules/models/Payment'
import '@common/modules/models/Service'
import '@common/modules/models/Street'
import '@common/modules/models/InvoiceTemplate'

export type Data = {
  data?: any
  success: boolean
  error?: any
  message?: string
}

export type ExtendedData = Data & {
  currentCompaniesCount?: number
  currentDomainsCount?: number
  domainsFilter?: { text: string; value: string }[]
  realEstatesFilter?: { text: string; value: string }[]
  addressFilter?: { text: string; value: string }[]
  totalPayments?: any
  total?: number
}

let bootstrap: Promise<void> | null = null

// 71 API routes call this at module scope as a bare `start()` — no `await`, no
// `catch`. A rejection there is an unhandled rejection, which under Node's
// default policy tears down the whole Lambda container mid-request: that is why
// a database problem surfaced as intermittent 500s across the entire app,
// unrelated to any one page (see the `unhandledRejection` lines in CloudWatch).
//
// Swallow it here so a failed dial can no longer kill the process. The failure
// still surfaces per request, as a clean 500 from the route's own try/catch,
// and clearing `bootstrap` lets a later call retry instead of latching onto the
// first failure.
const start = async (): Promise<void> => {
  if (!bootstrap) {
    bootstrap = dbConnect()
      .then(() => undefined)
      .catch((error) => {
        bootstrap = null
        // eslint-disable-next-line no-console
        console.error('[db] initial connection failed', error)
      })
  }

  return bootstrap
}

export default start
