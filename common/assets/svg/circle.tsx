import * as React from 'react'
import { SVGProps, memo } from 'react'

const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props?.width ?? 10}
    height={props?.height ?? 10}
    viewBox="0 0 100 100"
    style={{
      fill: props?.color ?? '#000',
    }}
  >
    <circle cx="50" cy="50" r="50" />
  </svg>
)

const Circle = memo(SvgComponent)
export default Circle
