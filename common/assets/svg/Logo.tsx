import { SVGProps, memo } from 'react'

/**
 * Compact SPACEHUB logo (logo only)
 */
const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props?.width ?? 10}
    height={props?.height ?? 10}
    viewBox="0 0 512 512"
    style={{ fill: props?.color ?? '#000' }}
    {...props}
  >
    <path d="M323.1912,412.7796c-18.5545,18.5545-42.8693,27.8282-67.1912,27.8353-24.3148,0-48.6367-9.2809-67.1913-27.8354L32.0292,256l44.7941-44.7941,156.7795,156.7795c12.372,12.372,32.4221,12.372,44.7941,0,6.1825-6.1825,9.2737-14.2826,9.2737-22.3971.0072-8.1074-3.084-16.2075-9.2737-22.3971l-22.3971-22.3971,44.7941-44.7941,22.3971,22.3971c37.109,37.109,37.1091,97.2735,0,134.3825Z" />
    <path d="M479.9708,256l-44.7942,44.7942-156.7796-156.7796c-12.3649-12.3649-32.4292-12.3649-44.7941,0-12.372,12.372-12.3649,32.4293,0,44.7941l22.3971,22.3971-44.7941,44.7941-22.3971-22.3971c-37.109-37.109-37.109-97.2734,0-134.3824,18.5545-18.5545,42.8693-27.8282,67.1913-27.8354,24.3148,0,48.6367,9.2808,67.1912,27.8353l156.7796,156.7796Z" />
  </svg>
)

const Logo = memo(SvgComponent)
export default Logo