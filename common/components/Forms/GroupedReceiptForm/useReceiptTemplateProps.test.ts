import { renderHook } from '@testing-library/react'
import { useReceiptTemplateProps } from './useReceiptTemplateProps'

describe('useReceiptTemplateProps — isEnglish / lang override', () => {
  describe('without explicit lang (legacy currency-based detection)', () => {
    it('isEnglish=false for UAH currency', () => {
      const { result } = renderHook(() =>
        useReceiptTemplateProps({ data: { currency: 'UAH' } })
      )
      expect(result.current.isEnglish).toBe(false)
    })

    it('isEnglish=true for USD currency', () => {
      const { result } = renderHook(() =>
        useReceiptTemplateProps({ data: { currency: 'USD' } })
      )
      expect(result.current.isEnglish).toBe(true)
    })

    it('isEnglish=true for EUR currency', () => {
      const { result } = renderHook(() =>
        useReceiptTemplateProps({ data: { currency: 'EUR' } })
      )
      expect(result.current.isEnglish).toBe(true)
    })

    it('isEnglish=false when currency is absent (defaults to UAH)', () => {
      const { result } = renderHook(() => useReceiptTemplateProps({ data: {} }))
      expect(result.current.isEnglish).toBe(false)
    })
  })

  describe('with explicit lang override', () => {
    it('lang=en overrides UAH currency → isEnglish=true', () => {
      const { result } = renderHook(() =>
        useReceiptTemplateProps({ data: { currency: 'UAH' }, lang: 'en' })
      )
      expect(result.current.isEnglish).toBe(true)
    })

    it('lang=uk overrides USD currency → isEnglish=false', () => {
      const { result } = renderHook(() =>
        useReceiptTemplateProps({ data: { currency: 'USD' }, lang: 'uk' })
      )
      expect(result.current.isEnglish).toBe(false)
    })

    it('lang=uk overrides EUR currency → isEnglish=false', () => {
      const { result } = renderHook(() =>
        useReceiptTemplateProps({ data: { currency: 'EUR' }, lang: 'uk' })
      )
      expect(result.current.isEnglish).toBe(false)
    })

    it('lang=en with no currency → isEnglish=true', () => {
      const { result } = renderHook(() =>
        useReceiptTemplateProps({ data: {}, lang: 'en' })
      )
      expect(result.current.isEnglish).toBe(true)
    })
  })

  describe('currency resolution priority', () => {
    it('data.currency takes priority over contextCompany.currency', () => {
      const { result } = renderHook(() =>
        useReceiptTemplateProps({
          data: { currency: 'UAH' },
          contextCompany: { currency: 'USD' },
        })
      )
      expect(result.current.isEnglish).toBe(false)
    })

    it('falls back to contextCompany.currency when data has none', () => {
      const { result } = renderHook(() =>
        useReceiptTemplateProps({
          data: {},
          contextCompany: { currency: 'USD' },
        })
      )
      expect(result.current.isEnglish).toBe(true)
    })

    it('lang override wins over contextCompany.currency', () => {
      const { result } = renderHook(() =>
        useReceiptTemplateProps({
          data: {},
          contextCompany: { currency: 'USD' },
          lang: 'uk',
        })
      )
      expect(result.current.isEnglish).toBe(false)
    })
  })
})
