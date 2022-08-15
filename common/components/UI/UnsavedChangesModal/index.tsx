import s from './style.module.scss'
import { unsavedChangesModalData } from './index.config'
import { Button } from 'antd'
import { Dispatch, FC, SetStateAction } from 'react'

const UnsavedChangesModal: FC<{
  onCancel: () => void
  onSubmit: () => void
}> = ({ onCancel, onSubmit }) => {
  return (
    <div className={s.unsavedChangesModal}>
      <div className={s.text}>{unsavedChangesModalData.message}</div>
      <div className={s.btnContainer}>
        <Button
          name="cancel"
          type="text"
          onClick={onCancel}
          className={s.cancel}
        >
          {unsavedChangesModalData.cancel}
        </Button>
        <Button
          name="save"
          type="primary"
          onClick={onSubmit}
          className={s.save}
        >
          {unsavedChangesModalData.save}
        </Button>
      </div>
    </div>
  )
}

export default UnsavedChangesModal
