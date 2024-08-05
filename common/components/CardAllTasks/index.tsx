import { ITask } from '@modules/models/Task'
import CardOneTask from '../CardOneTask'
import s from './style.module.scss'

interface Props {
  tasks: ITask[]
}

const CardAllTasks: React.FC<Props> = ({ tasks }) => {
  return (
    <div className={s.Cards}>
      {tasks?.map((task) => {
        return <CardOneTask key={task._id} task={task} />
      })}
    </div>
  )
}

export default CardAllTasks
