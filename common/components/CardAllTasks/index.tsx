import { ITask } from '@common/modules/models/Task'
import { reverse } from 'cypress/types/lodash'
import CardOneTask from '../CardOneTask'
import s from './style.module.scss'

interface Props {
  tasks: ITask[]
}

const CardAllTasks: React.FC<Props> = ({ tasks }) => {
  // const reverseTasks = tasks?.reverse()
  return (
    <div className={s.Cards}>
      {tasks?.map((task) => {
        return <CardOneTask key={task._id} task={task} />
      })}
    </div>
  )
}

export default CardAllTasks
