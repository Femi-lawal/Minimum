import { apiEndpoint } from '../config'
import { blog } from '../types/blog';
import { CreateBlogRequest } from '../types/CreateBlogRequest';
import Axios from 'axios'
import { UpdateBlogRequest } from '../types/UpdateBlogRequest';

export async function getblogs(idToken: string): Promise<blog[]> {
  console.log('Fetching blogs')

  const response = await Axios.get(`${apiEndpoint}/blogs`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
  })
  console.log('blogs:', response.data)
  return response.data.items
}

export async function createblog(
  idToken: string,
  newblog: CreateBlogRequest
): Promise<blog> {
  const response = await Axios.post(`${apiEndpoint}/blogs`,  JSON.stringify(newblog), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data.item
}

export async function patchblog(
  idToken: string,
  blogId: string,
  updatedblog: UpdateBlogRequest
): Promise<void> {
  await Axios.patch(`${apiEndpoint}/blogs/${blogId}`, JSON.stringify(updatedblog), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
}

export async function deleteblog(
  idToken: string,
  blogId: string
): Promise<void> {
  await Axios.delete(`${apiEndpoint}/blogs/${blogId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
}

export async function getUploadUrl(
  idToken: string,
  blogId: string
): Promise<string> {
  const response = await Axios.post(`${apiEndpoint}/blogs/${blogId}/attachment`, '', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  })
  return response.data.uploadUrl
}

export async function uploadFile(uploadUrl: string, file: Buffer): Promise<void> {
  await Axios.put(uploadUrl, file)
}
