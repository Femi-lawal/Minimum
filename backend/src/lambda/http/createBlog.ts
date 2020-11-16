import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { CreateBlogRequest } from '../../requests/CreateBlogRequest'
import * as middy from 'middy'
import {cors} from 'middy/middlewares'
import { createblog } from '../../businessLogic/blogs'
import { createLogger } from '../../utils/logger'

const logger = createLogger('createblog')

export const handler = middy( async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // blog: Implement creating a new blog item
    logger.info('Processing Event ', event)
    const authorization = event.headers.Authorization
    const split = authorization.split(' ')
    const jwtToken = split[1]

    const newblog: CreateBlogRequest = JSON.parse(event.body)
    const blogItem = await createblog(newblog, jwtToken)

    return {
      statusCode: 201,
      body: JSON.stringify({
        item: blogItem
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)