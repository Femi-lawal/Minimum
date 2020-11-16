import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getAllblogs } from '../../businessLogic/blogs'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const logger = createLogger('getblog')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // blog: Get all blog items for a current user
    logger.info('Processing Event ', event)
    const authorization = event.headers.Authorization
    const split = authorization.split(' ')
    const jwtToken = split[1]

    const blogs = await getAllblogs(jwtToken)

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: blogs
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)