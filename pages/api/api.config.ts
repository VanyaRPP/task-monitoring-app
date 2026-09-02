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

/**
 * Ensures the mongoose connection before a request touches a model.
 *
 * Always `await` this from inside the handler, never call it bare at module
 * scope: module scope runs once per Lambda container, so a container whose one
 * dial failed would keep serving 500s for the rest of its life, and the
 * unawaited rejection surfaces as a process-level unhandledRejection instead of
 * a response. Next 15 installs a handler that keeps the process alive through
 * that, which is what turned a self-healing crash into a sustained outage.
 *
 * `bootstrap` memoises the in-flight dial so concurrent requests share one
 * connect, and is cleared on failure so the next request retries rather than
 * latching onto the first error.
 */
const start = async (): Promise<void> => {
  if (!bootstrap) {
    // `await` rather than a `.then()` chain: dbConnect is replaced by a plain
    // jest.fn() in several suites, which returns undefined, and chaining off
    // that throws before the handler ever runs.
    bootstrap = (async () => {
      try {
        await dbConnect()
      } catch (error) {
        bootstrap = null
        throw error
      }
    })()
  }

  return bootstrap
}

export default start
