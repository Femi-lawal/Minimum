import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Segment,
  Dimmer
} from 'semantic-ui-react'

import { createBlog, deleteBlog, getBlogs, patchBlog } from '../api/blogs-api'
import Auth from '../auth/Auth'
import { Blog } from '../types/Blog'

interface BlogsProps {
  auth: Auth
  history: History
}

interface BlogsState {
  blogs: Blog[]
  newBlogName: string
  newBlogContent: string
  loadingBlogs: boolean
}

export class Blogs extends React.PureComponent<BlogsProps, BlogsState> {
  state: BlogsState = {
    blogs: [],
    newBlogName: '',
    newBlogContent: '',
    loadingBlogs: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newBlogName: event.target.value })
  }

  handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newBlogContent: event.target.value })
  }  

  onEditButtonClick = (blogId: string) => {
    this.props.history.push(`/blogs/${blogId}/edit`)
  }

  onBlogCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    if ( this.state.newBlogName.length < 1 || this.state.newBlogContent.length < 1){
      return alert(`Ensure both fields are filled`)
    }
    try {
      const dueDate = this.calculateDueDate()
      const newBlog = await createBlog(this.props.auth.getIdToken(), {
        name: this.state.newBlogName,
        content: this.state.newBlogContent
      })
      this.setState({
        blogs: [...this.state.blogs, newBlog],
        newBlogName: '',
        newBlogContent: ''
      })
    } catch {
      alert('Blog creation failed')
    }
  }

  onBlogDelete = async (blogId: string) => {
    try {
      await deleteBlog(this.props.auth.getIdToken(), blogId)
      this.setState({
        blogs: this.state.blogs.filter(blog => blog.blogId != blogId)
      })
    } catch {
      alert('Blog deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const blogs = await getBlogs(this.props.auth.getIdToken())
      this.setState({
        blogs,
        loadingBlogs: false
      })
    } catch (e) {
      alert(`Failed to fetch blogs: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Blogs</Header>

        {this.rendercreateBlogInput()}

        {this.renderblogs()}
      </div>
    )
  }

  rendercreateBlogInput() {
    return (
      <Grid.Row>
        <Grid.Column width={5}>
          <Input
            label = 'Title'
            color = 'teal'
            fluid
            actionPosition="left"
            placeholder="Awesome title"
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={5}>
          <Divider />
        </Grid.Column>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New Content',
              onClick: this.onBlogCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To infinity and beyond..."
            onChange={this.handleContentChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderblogs() {
    if (this.state.loadingBlogs) {
      return this.renderLoading()
    }

    return this.renderblogsList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Segment>
          <Dimmer active>
            <Loader content="Prepare to be underwhelmed"/>
          </Dimmer>
          <Image src='https://react.semantic-ui.com/images/wireframe/short-paragraph.png' />
        </Segment>
      </Grid.Row>
    )
  }

  renderblogsList() {
    return (
      <Grid padded>
        {this.state.blogs.map((blog, pos) => {
          return (
            <Grid.Row key={blog.blogId}>
              <Grid.Column width={10} verticalAlign="middle">
                {blog.name}
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {blog.content}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {blog.createdAt}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(blog.blogId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onBlogDelete(blog.blogId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {blog.attachmentUrl && (
                <Image src={blog.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
