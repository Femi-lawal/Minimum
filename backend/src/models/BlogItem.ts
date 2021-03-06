export interface BlogItem {
  userId: string
  blogId: string
  createdAt: string
  updatedAt: string
  name: string
  content: string
  views: number
  attachmentUrl?: string
}
