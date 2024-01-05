import * as React from 'react'
import { SVGProps, memo } from 'react'

const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width={500}
        height={120}
        viewBox="91 190 420 91"
        style={{
            fill: 'var(--primaryColor)',
        }}
    >
        <path d="M175.7,254.2c-4.6,0-8.2-1.3-10.8-3.9c-2.6-2.6-3.9-6.2-3.9-10.9h9.9c0,3.6,1.7,5.4,5,5.4c1.5,0,2.7-0.4,3.5-1.2c0.8-0.8,1.2-1.8,1.2-3.1c0-1.5-0.6-2.8-1.8-3.9c-1.1-1.1-2.9-2.4-5.4-4c-2.4-1.5-4.4-2.9-5.9-4.1c-1.5-1.2-2.8-2.8-3.9-4.6c-1.1-1.9-1.6-4.1-1.6-6.7c0-3.7,1.2-6.7,3.7-9c2.5-2.4,5.9-3.5,10.2-3.5c4.4,0,7.8,1.2,10.3,3.7c2.5,2.4,3.7,5.9,3.7,10.3H180c0-3.1-1.4-4.7-4.2-4.7c-1.3,0-2.3,0.3-3,1c-0.7,0.6-1,1.5-1,2.6c0,1.4,0.5,2.5,1.6,3.5c1.1,1,2.9,2.2,5.4,3.7c2.5,1.5,4.5,2.9,6,4.1c1.6,1.2,2.9,2.8,4.1,4.8c1.2,1.9,1.8,4.3,1.8,7.1c0,2.6-0.6,5-1.8,7c-1.2,2-2.9,3.6-5.2,4.8C181.5,253.6,178.8,254.2,175.7,254.2z"/>
        <path d="M209.6,205.7c4.9,0,8.8,1.4,11.6,4.3s4.1,6.8,4.1,11.9s-1.4,9-4.1,11.9c-2.8,2.8-6.6,4.2-11.6,4.2h-4.1v15.3h-9.7v-47.6H209.6z M209.4,228.8c1.9,0,3.4-0.6,4.4-1.8c1-1.2,1.5-2.9,1.5-5.2c0-2.3-0.5-4.1-1.5-5.2c-1-1.2-2.5-1.8-4.4-1.8h-4v13.9H209.4z"/>
        <path d="M245.8,245.3h-10.1l-1.6,7.9h-10l11.4-47.6h10.3l11.4,47.6h-10L245.8,245.3z M243.9,236.2l-1.1-5.4c-0.6-3.5-1.3-7.8-1.9-13h-0.3c-0.8,6.1-1.4,10.5-1.9,13l-1.1,5.4H243.9z"/>
        <path d="M274.2,254c-4.7,0-8.3-1.3-10.9-3.9c-2.5-2.7-3.8-6.5-3.8-11.4v-18.5c0-5,1.3-8.8,3.9-11.5c2.6-2.7,6.2-4,10.9-4c4.8,0,8.4,1.3,11,4c2.6,2.6,4,6.5,4.1,11.5h-9.7c-0.1-2.2-0.6-3.7-1.5-4.7c-0.9-1-2.2-1.4-4.1-1.4c-3.1,0-4.6,2-4.6,6.1v18.5c0,4,1.5,6,4.6,6c1.9,0,3.2-0.5,4.1-1.4c0.9-1,1.4-2.5,1.6-4.6h9.6c-0.1,5-1.5,8.8-4.1,11.4C282.8,252.7,279.1,254,274.2,254z"/>
        <path d="M320.3,244.1v9.2h-25.2v-47.6h24.5v9.2h-14.9v9.9h13.5v8.8h-13.5v10.5H320.3z"/>
        <path d="M369.7,205.7v47.6H360v-19.4h-9.8v19.4h-9.7v-47.6h9.7v19h9.8v-19H369.7z"/>
        <path d="M392.3,254c-4.7,0-8.3-1.4-11-4.2c-2.6-2.9-3.9-6.8-3.9-11.8v-32.4h9.9v32.4c0,2.2,0.4,3.8,1.3,5c0.9,1.1,2.1,1.6,3.8,1.6c1.7,0,2.9-0.5,3.8-1.6c0.9-1.1,1.3-2.8,1.3-5v-32.4h9.9v32.4c0,5-1.3,8.9-4,11.8C400.6,252.6,397,254,392.3,254z"/>
        <path d="M438.2,228.9c1.8,1,3.1,2.4,4.1,4.2c1,1.8,1.5,3.8,1.5,5.9c0,2.8-0.6,5.3-1.8,7.5c-1.2,2.1-2.8,3.8-5,5c-2.1,1.2-4.5,1.8-7.2,1.8h-15v-47.6h14.8c2.4,0,4.6,0.6,6.5,1.7c1.9,1.1,3.4,2.7,4.4,4.8c1.1,2,1.6,4.4,1.6,7.1c0,1.8-0.4,3.6-1.1,5.4C440.4,226.3,439.5,227.8,438.2,228.9z M424.5,214.8v9.9h3.8c1.4,0,2.4-0.4,3.1-1.3c0.7-0.9,1.1-2.1,1.1-3.8c0-1.6-0.4-2.8-1.1-3.6c-0.7-0.8-1.9-1.2-3.4-1.2H424.5z M428.2,244.1c3.9,0,5.8-1.7,5.8-5.2c0-1.7-0.5-3-1.4-3.9c-1-0.9-2.3-1.4-4.1-1.4h-3.9v10.4H428.2z"/>
        <g transform="matrix(1,0,0,1,0,36.22997625594469)">
            <g transform="matrix(1,0,0,1,0,0)">
                <path id="text-1" d="M170.7,229L170.7,229c0.5,0,0.9,0.1,1.4,0.2c0.5,0.2,0.9,0.4,1.2,0.7l0,0c0-0.2,0-0.4,0-0.6c0-0.2,0-0.4,0-0.6l0,0v-4l-0.3-1.3h2v13.4c0,0.3,0,0.6,0.1,1c0,0.4,0.1,0.7,0.2,1.1c0.1,0.4,0.2,0.7,0.4,0.9l0,0l-1.8,0.2c-0.1-0.2-0.2-0.5-0.2-0.7c-0.1-0.2-0.1-0.5-0.1-0.7l0,0c-0.4,0.5-0.8,0.9-1.3,1.2c-0.5,0.3-1.1,0.4-1.7,0.4l0,0c-0.7,0-1.3-0.2-1.9-0.5s-1-0.7-1.3-1.3c-0.4-0.5-0.6-1.1-0.8-1.8c-0.2-0.7-0.3-1.3-0.3-2l0,0c0-1,0.2-1.9,0.5-2.8c0.3-0.9,0.8-1.6,1.5-2.1C168.8,229.3,169.7,229,170.7,229z M170.7,230.5L170.7,230.5c-0.5,0-1,0.1-1.3,0.4c-0.4,0.2-0.7,0.6-0.9,1c-0.2,0.4-0.4,0.8-0.5,1.3c-0.1,0.5-0.1,1-0.1,1.4l0,0c0,0.5,0.1,1,0.2,1.5c0.1,0.5,0.3,0.9,0.5,1.3c0.2,0.4,0.5,0.7,0.9,1c0.4,0.2,0.8,0.4,1.4,0.4l0,0c0.5,0,0.9-0.1,1.3-0.4c0.4-0.3,0.8-0.6,1.1-1l0,0v-3.6c0-0.6-0.1-1.1-0.3-1.6c-0.2-0.5-0.4-0.9-0.8-1.2C171.8,230.6,171.3,230.5,170.7,230.5z M198.1,229L198.1,229c0.8,0,1.5,0.2,2.1,0.5c0.6,0.4,1,0.8,1.3,1.5c0.3,0.6,0.4,1.4,0.4,2.2l0,0c0,0.2,0,0.4,0,0.6c0,0.2,0,0.4-0.1,0.7l0,0h-6.5c0,1.4,0.3,2.4,0.9,3.2s1.3,1.1,2.3,1.1l0,0c0.4,0,0.8-0.1,1.2-0.2c0.4-0.1,0.9-0.3,1.3-0.6l0,0l0.6,1.1c-0.5,0.4-1,0.7-1.6,0.9s-1.2,0.3-1.8,0.3l0,0c-1.1,0-2-0.3-2.7-0.8c-0.7-0.5-1.2-1.2-1.6-2.1s-0.5-1.7-0.5-2.7l0,0c0-0.7,0.1-1.4,0.3-2.1c0.2-0.7,0.5-1.3,0.9-1.9c0.4-0.6,0.9-1,1.4-1.3C196.6,229.2,197.3,229,198.1,229z M197.9,230.4L197.9,230.4c-0.5,0-0.9,0.1-1.2,0.4s-0.6,0.6-0.9,1.1c-0.2,0.4-0.4,0.9-0.5,1.3l0,0h4.7c0-0.6-0.1-1.1-0.2-1.5c-0.2-0.4-0.4-0.7-0.7-0.9C198.8,230.5,198.4,230.4,197.9,230.4z M218.8,229.3h1.8l2.2,6.7c0.1,0.3,0.2,0.5,0.3,0.8c0.1,0.3,0.2,0.6,0.2,0.9l0,0c0.1-0.3,0.2-0.6,0.2-0.9c0.1-0.3,0.2-0.5,0.2-0.7l0,0l2.2-6.8h1.6l-3.7,10.9h-1.6L218.8,229.3z M249.1,229L249.1,229c0.8,0,1.5,0.2,2.1,0.5c0.6,0.4,1,0.8,1.3,1.5c0.3,0.6,0.4,1.4,0.4,2.2l0,0c0,0.2,0,0.4,0,0.6c0,0.2,0,0.4-0.1,0.7l0,0h-6.5c0,1.4,0.3,2.4,0.9,3.2s1.3,1.1,2.3,1.1l0,0c0.4,0,0.8-0.1,1.2-0.2c0.4-0.1,0.9-0.3,1.3-0.6l0,0l0.6,1.1c-0.5,0.4-1,0.7-1.6,0.9c-0.6,0.2-1.2,0.3-1.8,0.3l0,0c-1.1,0-2-0.3-2.7-0.8c-0.7-0.5-1.2-1.2-1.6-2.1c-0.3-0.9-0.5-1.7-0.5-2.7l0,0c0-0.7,0.1-1.4,0.3-2.1c0.2-0.7,0.5-1.3,0.9-1.9c0.4-0.6,0.9-1,1.4-1.3C247.6,229.2,248.3,229,249.1,229z M248.9,230.4L248.9,230.4c-0.5,0-0.9,0.1-1.2,0.4s-0.6,0.6-0.9,1.1c-0.2,0.4-0.4,0.9-0.5,1.3l0,0h4.7c0-0.6-0.1-1.1-0.2-1.5c-0.2-0.4-0.4-0.7-0.7-0.9C249.7,230.5,249.4,230.4,248.9,230.4z M271,223.5h2V240h-1.7v-15.3L271,223.5z M296.1,240.3L296.1,240.3c-1,0-1.8-0.3-2.5-0.8c-0.7-0.5-1.2-1.2-1.5-2.1c-0.3-0.9-0.5-1.8-0.5-2.7l0,0c0-1,0.2-1.9,0.5-2.8c0.4-0.9,0.9-1.6,1.6-2.1c0.7-0.5,1.5-0.8,2.5-0.8l0,0c1,0,1.9,0.3,2.5,0.8c0.7,0.5,1.2,1.2,1.5,2.1c0.3,0.9,0.5,1.8,0.5,2.8l0,0c0,1-0.2,1.9-0.5,2.8c-0.4,0.9-0.9,1.6-1.6,2.1C297.9,240.1,297.1,240.3,296.1,240.3z M296.1,239L296.1,239c0.5,0,1-0.1,1.3-0.4c0.4-0.3,0.7-0.6,0.9-1.1c0.2-0.4,0.4-0.9,0.5-1.4c0.1-0.5,0.1-1,0.1-1.4l0,0c0-0.5,0-1-0.1-1.5c-0.1-0.5-0.2-1-0.4-1.4c-0.2-0.4-0.5-0.8-0.8-1c-0.4-0.3-0.8-0.4-1.3-0.4l0,0c-0.5,0-1,0.1-1.3,0.4c-0.4,0.3-0.7,0.6-0.9,1.1c-0.2,0.4-0.4,0.9-0.5,1.4c-0.1,0.5-0.1,1-0.1,1.4l0,0c0,0.4,0,0.9,0.1,1.4c0.1,0.5,0.3,1,0.5,1.4c0.2,0.4,0.5,0.8,0.8,1.1C295.2,238.8,295.6,239,296.1,239z M318.4,229.3l1.8-0.2c0.1,0.2,0.2,0.5,0.3,0.7c0.1,0.3,0.1,0.5,0.1,0.8l0,0c0.4-0.5,0.8-0.9,1.3-1.1c0.5-0.3,1.1-0.4,1.7-0.4l0,0c0.7,0,1.4,0.2,1.9,0.5c0.5,0.3,1,0.7,1.3,1.3c0.4,0.5,0.6,1.1,0.8,1.8c0.2,0.7,0.3,1.3,0.3,2l0,0c0,1-0.2,1.9-0.5,2.8c-0.3,0.9-0.8,1.6-1.5,2.1c-0.7,0.5-1.5,0.8-2.6,0.8l0,0c-0.5,0-0.9-0.1-1.4-0.2c-0.5-0.2-0.9-0.4-1.2-0.7l0,0c0,0.2,0,0.4,0,0.6s0,0.4,0,0.5l0,0v3l0.3,1.3h-2v-12.3c0-0.3,0-0.6-0.1-1c0-0.4-0.1-0.7-0.2-1.1C318.7,229.9,318.6,229.6,318.4,229.3L318.4,229.3z M323.1,230.6L323.1,230.6c-0.5,0-0.9,0.1-1.3,0.4c-0.4,0.3-0.8,0.6-1,1l0,0v3.6c0,0.6,0.1,1.1,0.3,1.6c0.2,0.5,0.4,0.9,0.8,1.2c0.4,0.3,0.8,0.4,1.4,0.4l0,0c0.5,0,1-0.1,1.3-0.4c0.4-0.2,0.7-0.6,0.9-1c0.2-0.4,0.4-0.9,0.5-1.3c0.1-0.5,0.1-1,0.1-1.4l0,0c0-0.5-0.1-1-0.2-1.5c-0.1-0.5-0.3-0.9-0.5-1.3c-0.2-0.4-0.5-0.7-0.9-1C324.1,230.7,323.7,230.6,323.1,230.6z M345.6,229.3l1.9-0.2c0.1,0.2,0.2,0.5,0.2,0.7s0.1,0.5,0.1,0.8l0,0c0.4-0.4,0.8-0.7,1.4-1.1c0.5-0.3,1.1-0.5,1.6-0.5l0,0c0.7,0,1.2,0.1,1.7,0.4c0.5,0.3,0.8,0.7,1.1,1.4l0,0c0.4-0.4,0.9-0.8,1.5-1.2c0.6-0.4,1.1-0.6,1.7-0.6l0,0c0.8,0,1.4,0.2,1.8,0.5c0.5,0.3,0.8,0.8,1,1.4c0.2,0.6,0.3,1.2,0.3,2l0,0v7.2h-1.7v-6.6c0-0.4,0-0.9-0.1-1.3c-0.1-0.4-0.2-0.8-0.5-1.1c-0.2-0.3-0.6-0.4-1.2-0.4l0,0c-0.5,0-1,0.2-1.4,0.5c-0.5,0.3-0.9,0.7-1.2,1l0,0v8h-1.7v-6.6c0-0.4,0-0.9-0.1-1.3c-0.1-0.4-0.2-0.8-0.5-1.1c-0.2-0.3-0.6-0.4-1.2-0.4l0,0c-0.3,0-0.6,0.1-0.9,0.2c-0.3,0.2-0.6,0.3-0.9,0.6c-0.3,0.2-0.5,0.4-0.8,0.6l0,0v8h-1.7v-7.8c0-0.3,0-0.6-0.1-1c0-0.3-0.1-0.7-0.2-1C345.8,229.9,345.7,229.6,345.6,229.3L345.6,229.3z M383,229L383,229c0.8,0,1.5,0.2,2.1,0.5c0.6,0.4,1,0.8,1.3,1.5c0.3,0.6,0.4,1.4,0.4,2.2l0,0c0,0.2,0,0.4,0,0.6c0,0.2,0,0.4-0.1,0.7l0,0h-6.5c0,1.4,0.3,2.4,0.9,3.2c0.6,0.8,1.3,1.1,2.3,1.1l0,0c0.4,0,0.8-0.1,1.2-0.2c0.4-0.1,0.9-0.3,1.3-0.6l0,0l0.6,1.1c-0.5,0.4-1,0.7-1.6,0.9c-0.6,0.2-1.2,0.3-1.8,0.3l0,0c-1.1,0-2-0.3-2.7-0.8c-0.7-0.5-1.2-1.2-1.6-2.1c-0.3-0.9-0.5-1.7-0.5-2.7l0,0c0-0.7,0.1-1.4,0.3-2.1c0.2-0.7,0.5-1.3,0.9-1.9c0.4-0.6,0.9-1,1.4-1.3C381.6,229.2,382.3,229,383,229z M382.9,230.4L382.9,230.4c-0.5,0-0.9,0.1-1.2,0.4s-0.6,0.6-0.9,1.1c-0.2,0.4-0.4,0.9-0.5,1.3l0,0h4.7c0-0.6-0.1-1.1-0.2-1.5c-0.2-0.4-0.4-0.7-0.7-0.9C383.7,230.5,383.3,230.4,382.9,230.4z M404.5,229.3l1.9-0.3c0.1,0.2,0.2,0.5,0.2,0.8c0.1,0.3,0.1,0.5,0.1,0.8l0,0c0.4-0.4,0.9-0.8,1.5-1.1c0.6-0.3,1.1-0.5,1.7-0.5l0,0c0.8,0,1.4,0.2,1.8,0.5c0.5,0.3,0.8,0.8,1,1.4c0.2,0.6,0.3,1.2,0.3,2l0,0v7.2h-1.7v-6.6c0-0.4,0-0.9-0.1-1.3c-0.1-0.4-0.2-0.8-0.5-1.1c-0.2-0.3-0.6-0.4-1.2-0.4l0,0c-0.3,0-0.7,0.1-1,0.2c-0.3,0.1-0.7,0.3-1,0.5c-0.3,0.2-0.6,0.4-0.8,0.7l0,0v8h-1.7v-7.6c0-0.3,0-0.6-0.1-1c0-0.4-0.1-0.8-0.2-1.1C404.8,229.9,404.7,229.6,404.5,229.3L404.5,229.3z M433.5,226.2h1.3c-0.1,0.5-0.2,1-0.3,1.5c-0.1,0.5-0.1,1-0.2,1.6l0,0h2.7l-0.3,1.4h-2.3v6.9c0,0.3,0,0.5,0.1,0.7c0.1,0.2,0.2,0.4,0.3,0.5c0.2,0.1,0.4,0.2,0.7,0.2l0,0c0.2,0,0.4,0,0.7-0.1c0.2,0,0.4-0.1,0.6-0.2l0,0l0.3,1.2c-0.3,0.1-0.7,0.2-1,0.3c-0.3,0.1-0.7,0.1-1.1,0.1l0,0c-0.9,0-1.5-0.2-1.8-0.7c-0.3-0.5-0.5-1.2-0.5-2.1l0,0v-6.9h-1.5v-1.1c0.5,0,1-0.2,1.3-0.6c0.3-0.4,0.6-0.8,0.7-1.3C433.3,227.1,433.4,226.6,433.5,226.2L433.5,226.2z"/>
            </g>
        </g>
    </svg>
)

const HomePageTitle = memo(SvgComponent)
export default HomePageTitle