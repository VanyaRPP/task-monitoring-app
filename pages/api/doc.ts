import { withSwagger } from 'next-swagger-doc'
import swaggerConfig from '../../next-swagger-doc.json'

const handler = withSwagger(swaggerConfig)

export default handler()
