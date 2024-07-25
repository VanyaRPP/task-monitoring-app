interface ConfigT {
  baseURL: string
}

interface ParamsT {
  headers?: Record<string, string>
}

interface BodyParamsT extends ParamsT {
  body: unknown
}

type MethodT<P extends ParamsT = ParamsT> = <T>(
  apiCall: string,
  params?: P,
  searchParams?: unknown
) => Promise<T>

export default class FetchHttpClient {
  readonly #baseURL: string

  constructor({ baseURL }: ConfigT) {
    this.#baseURL = baseURL
  }

  private async request<T>(
    method: string,
    apiCall: string,
    params?: ParamsT,
    body?: unknown,
    searchParams?: unknown
  ): Promise<T> {
    const url = `${this.#baseURL}/${apiCall}${
      searchParams ? '?' + searchParams.toString() : ''
    }`

    const response: Response = await fetch(url, {
      method,
      headers: params?.headers || {},
      body: body ? JSON.stringify(body) : undefined,
    })

    if (response.status >= 400) {
      return Promise.reject({
        ...(await response.json()),
        statusCode: response.status,
      })
    }

    return response.json()
  }

  /**
   * Performs a GET request to the specified URL.
   */
  get: MethodT = async (apiCall, params, searchParams) => {
    return this.request('GET', apiCall, params, undefined, searchParams)
  }

  /**
   * Performs a POST request to the specified URL.
   */
  post: MethodT<BodyParamsT> = async (apiCall, params) => {
    return this.request('POST', apiCall, params, params?.body)
  }

  /**
   * Performs a PUT request to the specified URL.
   */
  put: MethodT<BodyParamsT> = async (apiCall, params) => {
    return this.request('PUT', apiCall, params, params?.body)
  }

  /**
   * Performs a PATCH request to the specified URL.
   */
  patch: MethodT<BodyParamsT> = async (apiCall, params) => {
    return this.request('PATCH', apiCall, params, params?.body)
  }

  /**
   * Performs a DELETE request to the specified URL.
   */
  delete: MethodT = async (apiCall, params) => {
    return this.request('DELETE', apiCall, params)
  }
}
