import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { generateUploadUrl } from '../../businessLogic/blogs'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const logger = createLogger('generateUploadUrl')

export const handler = middy( async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // blog: Return a presigned URL to upload a file for a blog item with the provided id
    logger.info('Processing Event ', event)
    const blogId = event.pathParameters.blogId

    const URL = await generateUploadUrl(blogId)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        uploadUrl: URL
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)