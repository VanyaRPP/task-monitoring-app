import FetchHttpClient from './FetchHttpClient'

class MockResponse {
  constructor(private body: string, private status: number = 200) {}

  json(): Promise<unknown> {
    return Promise.resolve(JSON.parse(this.body))
  }

  get ok() {
    return this.status >= 200 && this.status < 300
  }
}

const BASE_URL = 'baseURL'

describe('Given the FetchHttpClient', () => {
  let httpClient: FetchHttpClient

  beforeEach(() => {
    global.fetch = jest.fn()
    httpClient = new FetchHttpClient({
      baseURL: BASE_URL,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const setupMockFetch = (
    responseBody: unknown,
    status = 200,
    headers = { 'Content-Type': 'application/json' }
  ) => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      new MockResponse(JSON.stringify(responseBody), status)
    )
  }

  describe('When I use get method', () => {
    const apiCall = 'apiCall'
    const headers = { 'Content-Type': 'application/json' }
    const responseBody = { data: 'response' }
    const errorResponseBody = { error: 'some error message' }

    let result: unknown

    beforeEach(async () => {
      setupMockFetch(responseBody)
      result = await httpClient.get(apiCall, { headers })
    })

    test('Then I expect the global.fetch to be called with the right params', () => {
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/${apiCall}`, {
        method: 'GET',
        headers,
        body: undefined,
      })
    })

    test('And I expect the result to be correct', () => {
      expect(result).toEqual(responseBody)
    })

    describe('AND response is failed', () => {
      beforeEach(() => {
        setupMockFetch(errorResponseBody, 400)
      })

      test('Then I expect to get rejected promise', async () => {
        await expect(httpClient.get(apiCall, { headers })).rejects.toEqual({
          ...errorResponseBody,
          statusCode: 400,
        })
      })
    })
  })

  describe('When I use post method', () => {
    const apiCall = 'apiCall'
    const body = { data: 'request' }
    const headers = { 'Content-Type': 'application/json' }
    const responseBody = { data: 'response' }
    const errorResponseBody = { error: 'post error message' }

    let result: unknown

    beforeEach(async () => {
      setupMockFetch(responseBody)
      result = await httpClient.post(apiCall, { body, headers })
    })

    test('Then I expect the global.fetch to be called with the right params', () => {
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/${apiCall}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
    })

    test('And I expect the result to be correct', () => {
      expect(result).toEqual(responseBody)
    })

    describe('AND response is failed', () => {
      beforeEach(() => {
        setupMockFetch(errorResponseBody, 400)
      })

      test('Then I expect to get rejected promise', async () => {
        await expect(
          httpClient.post(apiCall, { body, headers })
        ).rejects.toEqual({
          ...errorResponseBody,
          statusCode: 400,
        })
      })
    })
  })

  describe('When I use put method', () => {
    const apiCall = 'apiCall'
    const body = { data: 'request' }
    const headers = { 'Content-Type': 'application/json' }
    const responseBody = { data: 'response' }
    const errorResponseBody = { error: 'put error message' }

    let result: unknown

    beforeEach(async () => {
      setupMockFetch(responseBody)
      result = await httpClient.put(apiCall, { body, headers })
    })

    test('Then I expect the global.fetch to be called with the right params', () => {
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/${apiCall}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      })
    })

    test('And I expect the result to be correct', () => {
      expect(result).toEqual(responseBody)
    })

    describe('AND response is failed', () => {
      beforeEach(() => {
        setupMockFetch(errorResponseBody, 400)
      })

      test('Then I expect to get rejected promise', async () => {
        await expect(
          httpClient.put(apiCall, { body, headers })
        ).rejects.toEqual({
          ...errorResponseBody,
          statusCode: 400,
        })
      })
    })
  })

  describe('When I use patch method', () => {
    const apiCall = 'apiCall'
    const body = { data: 'request' }
    const headers = { 'Content-Type': 'application/json' }
    const responseBody = { data: 'response' }
    const errorResponseBody = { error: 'patch error message' }

    let result: unknown

    beforeEach(async () => {
      setupMockFetch(responseBody)
      result = await httpClient.patch(apiCall, { body, headers })
    })

    test('Then I expect the global.fetch to be called with the right params', () => {
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/${apiCall}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      })
    })

    test('And I expect the result to be correct', () => {
      expect(result).toEqual(responseBody)
    })

    describe('AND response is failed', () => {
      beforeEach(() => {
        setupMockFetch(errorResponseBody, 400)
      })

      test('Then I expect to get rejected promise', async () => {
        await expect(
          httpClient.patch(apiCall, { body, headers })
        ).rejects.toEqual({
          ...errorResponseBody,
          statusCode: 400,
        })
      })
    })
  })

  describe('When I use delete method', () => {
    const apiCall = 'apiCall'
    const headers = { 'Content-Type': 'application/json' }
    const responseBody = { data: 'response' }
    const errorResponseBody = { error: 'delete error message' }

    let result: unknown

    beforeEach(async () => {
      setupMockFetch(responseBody)
      result = await httpClient.delete(apiCall, { headers })
    })

    test('Then I expect the global.fetch to be called with the right params', () => {
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/${apiCall}`, {
        method: 'DELETE',
        headers,
        body: undefined,
      })
    })

    test('And I expect the result to be correct', () => {
      expect(result).toEqual(responseBody)
    })

    describe('AND response is failed', () => {
      beforeEach(() => {
        setupMockFetch(errorResponseBody, 400)
      })

      test('Then I expect to get rejected promise', async () => {
        await expect(httpClient.delete(apiCall, { headers })).rejects.toEqual({
          ...errorResponseBody,
          statusCode: 400,
        })
      })
    })
  })
})
