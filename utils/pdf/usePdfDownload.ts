import { useHtmlToPdfMutation } from '@common/api/paymentApi/payment.api'
import { IHtmlToPdfResponse } from '@common/api/paymentApi/payment.api.types'
import { snapshotNodeToStandaloneHtml } from './captureDom'
import { saveAs } from 'file-saver'

export interface UsePdfDownloadResult {
  download: (sourceNode: HTMLElement | null) => Promise<void>
  isLoading: boolean
}

export interface UsePdfDownloadOptions {
  fileName: string
  onError?: (message: string) => void
}

const blobFromResponse = (data: IHtmlToPdfResponse): Blob => {
  const bytes = new Uint8Array(
    (data.buffer as unknown as { data: number[] }).data ??
      (data.buffer as unknown as ArrayLike<number>)
  )
  return new Blob([bytes], { type: `application/${data.fileExtension}` })
}

/**
 * Snapshot a visible DOM node, send it to the htmlToPdf endpoint, and save
 * the resulting PDF via file-saver. Pair with `useReactToPrint` for the
 * "print" half of a print/download menu.
 */
export function usePdfDownload({
  fileName,
  onError,
}: UsePdfDownloadOptions): UsePdfDownloadResult {
  const [htmlToPdf, { isLoading }] = useHtmlToPdfMutation()

  const download = async (sourceNode: HTMLElement | null): Promise<void> => {
    if (!sourceNode) {
      onError?.('Не вдалося знайти контент для PDF')
      return
    }

    const html = snapshotNodeToStandaloneHtml(sourceNode)

    try {
      const response = await htmlToPdf({ html, fileName })

      if ('data' in response && response.data) {
        const blob = blobFromResponse(response.data)
        saveAs(blob, `${response.data.fileName}.${response.data.fileExtension}`)
        return
      }

      const errorBody = (response as { error?: { data?: { error?: string } } })
        .error?.data?.error
      onError?.(errorBody ?? 'Сталася помилка під час генерації PDF')
    } catch (error) {
      onError?.(
        (error as Error)?.message ?? 'Несподівана помилка під час генерації PDF'
      )
    }
  }

  return { download, isLoading }
}
