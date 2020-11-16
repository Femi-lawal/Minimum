import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateBlogRequest } from '../../requests/UpdateBlogRequest'
import { updateblog } from '../../businessLogic/blogs'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // blog: Update a blog item with the provided id using values in the "updatedblog" object
    console.log('Processing Event ', event)
    const authorization = event.headers.Authorization
    const split = authorization.split(' ')
    const jwtToken = split[1]

    const blogId = event.pathParameters.blogId
    const updatedblog: UpdateBlogRequest = JSON.parse(event.body)

    const blogItem = await updateblog(blogId, updatedblog, jwtToken)

    return {
      statusCode: 200,
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