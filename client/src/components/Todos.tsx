import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import { createblog, deleteblog, getblogs, patchblog } from '../api/blogs-api'
import Auth from '../auth/Auth'
import { blog } from '../types/blog'

interface blogsProps {
  auth: Auth
  history: History
}

interface blogsState {
  blogs: blog[]
  newblogName: string
  loadingblogs: boolean
}

export class blogs extends React.PureComponent<blogsProps, blogsState> {
  state: blogsState = {
    blogs: [],
    newblogName: '',
    loadingblogs: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newblogName: event.target.value })
  }

  onEditButtonClick = (blogId: string) => {
    this.props.history.push(`/blogs/${blogId}/edit`)
  }

  onblogCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newblog = await createblog(this.props.auth.getIdToken(), {
        name: this.state.newblogName,
        dueDate
      })
      this.setState({
        blogs: [...this.state.blogs, newblog],
        newblogName: ''
      })
    } catch {
      alert('blog creation failed')
    }
  }

  onblogDelete = async (blogId: string) => {
    try {
      await deleteblog(this.props.auth.getIdToken(), blogId)
      this.setState({
        blogs: this.state.blogs.filter(blog => blog.blogId != blogId)
      })
    } catch {
      alert('blog deletion failed')
    }
  }

  onblogCheck = async (pos: number) => {
    try {
      const blog = this.state.blogs[pos]
      await patchblog(this.props.auth.getIdToken(), blog.blogId, {
        name: blog.name,
        dueDate: blog.dueDate,
        done: !blog.done
      })
      this.setState({
        blogs: update(this.state.blogs, {
          [pos]: { done: { $set: !blog.done } }
        })
      })
    } catch {
      alert('blog deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const blogs = await getblogs(this.props.auth.getIdToken())
      this.setState({
        blogs,
        loadingblogs: false
      })
    } catch (e) {
      alert(`Failed to fetch blogs: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">blogs</Header>

        {this.renderCreateblogInput()}

        {this.renderblogs()}
      </div>
    )
  }

  renderCreateblogInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onblogCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderblogs() {
    if (this.state.loadingblogs) {
      return this.renderLoading()
    }

    return this.renderblogsList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading blogs
        </Loader>
      </Grid.Row>
    )
  }

  renderblogsList() {
    return (
      <Grid padded>
        {this.state.blogs.map((blog, pos) => {
          return (
            <Grid.Row key={blog.blogId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onblogCheck(pos)}
                  checked={blog.done}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {blog.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {blog.dueDate}
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
                  onClick={() => this.onblogDelete(blog.blogId)}
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
