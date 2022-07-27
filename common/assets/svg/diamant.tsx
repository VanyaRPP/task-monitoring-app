import * as React from 'react'
import { SVGProps, memo } from 'react'

const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 54.391 54.391"
    width={20}
    height={20}
    style={{
      // fill: 'var(--textColor)',
      fill: '#FFFFFF',
    }}
    xmlSpace="preserve"
  >
    <path d="m.285 19.392 23.896 29.665-10.839-29.665zM15.472 19.392 27.02 50.998l11.775-31.606zM29.593 49.823l24.512-30.431H40.929zM44.755 3.392H29.297l10.599 13.045zM38.094 17.392 27.195 3.979 16.297 17.392zM25.094 3.392H9.625l4.799 13.133zM7.959 4.658 0 17.392h12.611zM54.391 17.392 46.424 4.645l-4.75 12.747z" />
  </svg>
)

const Diamant = memo(SvgComponent)
export default Diamant
