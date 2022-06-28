import { Button, Card } from 'antd'
import { useGetAllTaskQuery } from '../../api/taskApi/task.api'
import withAuthRedirect from '../../components/HOC/withAuthRedirect'
import s from './style.module.scss'
import { ITask } from '../../models/Task'
import moment from 'moment'
import Router from 'next/router'
import { useSession } from 'next-auth/react'
import { useGetUserByEmailQuery } from '../../api/userApi/user.api'

const Tasks: React.FC = () => {

    
    const { data: session } = useSession()

    const { data } = useGetAllTaskQuery('')
    const tasks = data?.data


  const { data: userData } = useGetUserByEmailQuery(`${session?.user?.email}`)
  const user = userData?.data
    

    return (
        <div className={s.Container}>
            {
                tasks && tasks.map((task: ITask, index) => {
                    return <Card
                        key={index}
                        title={task.name}
                        extra={<Button
                            ghost
                            type="primary"
                            onClick={() => Router.push(`/task/${task._id}`)}> 
                            {
                                user?._id.toString() === task?.creator.toString() 
                                || moment().isAfter( moment(task?.deadline))
                                ? 'Info' : 'Apply'
                            }
                        </Button>}
                        className={moment(task?.deadline).isAfter( moment()) ? s.Card : `${s.Card} ${s.Disabled}`}>
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

export default withAuthRedirect(Tasks)
