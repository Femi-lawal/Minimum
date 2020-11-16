import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { deleteblog } from '../../businessLogic/blogs'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const logger = createLogger('deleteblog')

export const handler = middy( async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // blog: Remove a blog item by id
    logger.info('Processing Event ', event)
    const authorization = event.headers.Authorization
    const split = authorization.split(' ')
    const jwtToken = split[1]

    const blogId = event.pathParameters.blogId

    const deleteData = await deleteblog(blogId, jwtToken)

    return {
      statusCode: 200,
      body: deleteData
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)