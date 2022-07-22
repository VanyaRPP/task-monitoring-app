import * as React from 'react'
import { SVGProps, memo } from 'react'

const SvgDiamant = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    width={20}
    height={20}
    version="1.1"
    id="Capa_1"
    xmlns="http://www.w3.org/2000/svg"
    x="0px"
    y="0px"
    viewBox="0 0 54.391 54.391"
  >
    <polygon points="0.285,19.392 24.181,49.057 13.342,19.392 	" />
    <polygon points="15.472,19.392 27.02,50.998 38.795,19.392 	" />
    <polygon points="29.593,49.823 54.105,19.392 40.929,19.392 	" />
    <polygon points="44.755,3.392 29.297,3.392 39.896,16.437 	" />
    <polygon points="38.094,17.392 27.195,3.979 16.297,17.392 	" />
    <polygon points="25.094,3.392 9.625,3.392 14.424,16.525 	" />
    <polygon points="7.959,4.658 0,17.392 12.611,17.392 	" />
    <polygon points="54.391,17.392 46.424,4.645 41.674,17.392 	" />
  </svg>
)

const Diamant = memo(SvgDiamant)
export default Diamant
