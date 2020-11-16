import { BlogItem } from '../models/BlogItem'
import { BlogAccess } from '../dataLayer/blogAccess'
import { parseUserId } from '../auth/utils'
import { CreateBlogRequest } from '../requests/CreateBlogRequest'
import { UpdateBlogRequest } from '../requests/UpdateBlogRequest'
import { BlogUpdate } from '../models/BlogUpdate'
import * as uuid from 'uuid'
import 'source-map-support/register'

const blogAccess = new BlogAccess()

const s3BucketName = process.env.ATTACHMENTS_S3_BUCKET

export async function getAllblogs (jwtToken: string): Promise<BlogItem[]> {
  const userId = parseUserId(jwtToken)
  return blogAccess.getAllblogs(userId)
}

export async function getblog (blogId: string, jwtToken: string): Promise<BlogItem> {
  const userId = parseUserId(jwtToken)
  return blogAccess.getblog(blogId, userId)
}

export function createblog (CreateBlogRequest: CreateBlogRequest, jwtToken: string): Promise<BlogItem> {
  const userId = parseUserId(jwtToken)
  const id = uuid.v4()
  return blogAccess.createblog({
    userId: userId,
    blogId: id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    attachmentUrl: `https://${s3BucketName}.s3.amazonaws.com/${id}`,
    ...CreateBlogRequest
  })
}

export function updateblog ( blogId: string, UpdateBlogRequest: UpdateBlogRequest, jwtToken: string): Promise<BlogUpdate> {
  const userId = parseUserId(jwtToken)
  return blogAccess.updateblog(blogId, UpdateBlogRequest, userId)
}

export function deleteblog (blogId: string, jwtToken: string): Promise<string> {
  const userId = parseUserId(jwtToken)
  return blogAccess.deleteblog(blogId, userId)
}

export function generateUploadUrl (blogId: string): Promise<string> {
  return blogAccess.generateUploadUrl(blogId)
}