import { Button, Card } from 'antd'
import { useGetAllTaskQuery } from '../../api/taskApi/task.api'
import withAuthRedirect from '../../components/HOC/withAuthRedirect'
import s from './style.module.scss'
import { ITask } from '../../models/Task'
import moment from 'moment'
import Router from 'next/router'

const Tasks: React.FC = () => {

    const { data } = useGetAllTaskQuery('')

    const tasks = data?.data

    return (
        <div className={s.Container}>
            {
                tasks && tasks.map((task: ITask, index) => {
                    return <Card
                        key={index}
                        title={task.name}
                        extra={<Button
                            ghost
                            danger
                            onClick={() => Router.push(`/task/${task._id}`)}> 
                            Apply
                        </Button>}
                        className={s.Card}>
                        <p>Catagory: {task?.category}</p>
                        <p>Description: {task.desription}</p>
                        <p>Domain: {task?.domain}</p>
                        <p>DeadLine: {moment(task?.deadline).format("MMM Do YY")}</p>
                    </Card>
                })
            }
        </div>
    )
}
// withAuthRedirect
export default Tasks
