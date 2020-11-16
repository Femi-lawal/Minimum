import * as AWS  from 'aws-sdk'
import * as AWSXRAY from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Types } from 'aws-sdk/clients/s3'
import 'source-map-support/register'
import { BlogItem } from '../models/BlogItem'
import { BlogUpdate } from '../models/BlogUpdate'
import { createLogger } from '../utils/logger'

const logger = createLogger('blogsAccess')
const XAWS = AWSXRAY.captureAWS(AWS)

export class BlogAccess {

  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly s3Client: Types = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly s3BucketName = process.env.ATTACHMENTS_S3_BUCKET,
    private readonly blogsTable = process.env.BLOGS_TABLE,
    private readonly userIndex = process.env.USER_ID_INDEX
  ) {}

  // async blogExists(blogId: string): Promise<boolean> {
  //   const item = await this.getblog(blogId)
  //   return !!item
  // }

  async getAllblogs(userId: string): Promise<BlogItem[]> {
    logger.info(`Getting all blogs for user ${userId} from ${this.blogsTable}`)

    const result = await this.docClient.query({
      TableName: this.blogsTable,
      IndexName: this.userIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()

    const items = result.Items

    logger.info(`Found ${items.length} blogs for user ${userId} in ${this.blogsTable}`)

    return items as BlogItem[]
  }

  async getblog(blogId: string, userId: string): Promise<BlogItem> {
    logger.info(`Getting blog ${blogId} and user: ${userId} from ${this.blogsTable}`)
    
    const result = await this.docClient.get({
      TableName: this.blogsTable,
      Key: {
        userId,
        blogId
      }
    }).promise()

    const item = result.Item

    return item as BlogItem
  }

  async createblog(BlogItem: BlogItem) {
    logger.info(`Putting blog ${BlogItem.blogId} into ${this.blogsTable}`)

    await this.docClient.put({
      TableName: this.blogsTable,
      Item: BlogItem,
    }).promise()

    return BlogItem
  }

  async updateblog(blogId: string, BlogUpdate: BlogUpdate, userId: string) {
    logger.info(`Updating blog item ${blogId}, key: ${userId} in ${this.blogsTable}`)


    await this.docClient.update({
      TableName: this.blogsTable,
      Key: {
        userId,
        blogId
      },
      UpdateExpression:
        'set #name = :name, #updatedAt = :updatedAt, #content = :content',      
      ExpressionAttributeValues: {
        ':name': BlogUpdate.name,
        ':updatedAt': new Date().toISOString(),
        ':content': BlogUpdate.content
      },
      ExpressionAttributeNames: {
        '#name': 'name',
        '#updatedAt': 'updatedAt',
        '#content': 'content'
      }
    }).promise()
    logger.info(`updated successfully`)
    console.log(userId)
    return BlogUpdate
  }

  async deleteblog(blogId: string, userId: string) {
    logger.info(`Deleting blog item ${blogId} from ${this.blogsTable}`)

    await this.docClient.delete({
      TableName: this.blogsTable,
      Key: {
        userId,
        blogId
      }
    }).promise()

    return userId
  }

  async generateUploadUrl (blogId: string): Promise<string> {
    console.log('Generating URL')

    const url = this.s3Client.getSignedUrl('putObject', {
      Bucket: this.s3BucketName,
      Key: blogId,
      Expires: 3000
    })
    console.log(url)

    return url as string
  }
}