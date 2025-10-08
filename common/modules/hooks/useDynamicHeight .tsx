import { useResizeDetector } from 'react-resize-detector'
import { useEffect, useLayoutEffect } from 'react'

export const useDynamicHeight = ({
  nodeHeightCallback,
  gridRowHeight,
  padding = 0,
  marginY = 0,
}: {
  nodeHeightCallback: (height: number) => void
  gridRowHeight: number
  padding?: number
  marginY?: number
}) => {
  const { ref, height } = useResizeDetector()
  useLayoutEffect(() => {
    if (height) {
      // RGL sets a default margin of margin: ?[number, number] = [10, 10],
      // Here we calculate pixel height to grid units
      const h = Math.ceil(
        (height + padding + marginY) / (gridRowHeight + marginY)
      )
      nodeHeightCallback(h)
    }
  }, [gridRowHeight, height, nodeHeightCallback, padding, marginY])
  return { ref, height }
}
