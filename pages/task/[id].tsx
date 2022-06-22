import { useRouter } from 'next/router'

const Task: React.FC = () => {

    const router = useRouter()

    return (
        <div>Task {router.query.id}</div>
    )
}

export default Task