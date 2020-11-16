/**
 * Fields in a request to update a single blog item.
 */
export interface UpdateBlogRequest {
  name: string
  content: string
  updatedAt: string
}