import React from 'react'
import s from './style.module.scss'

const Loader = () => (
  <div className={s.Loader}>
    <div className={s.lds_dual_ring} />
  </div>
)

export default Loader
