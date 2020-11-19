import * as React from 'react'
import Auth from '../auth/Auth'
import { Button, Form, Grid, Header, Image, Message, Segment } from 'semantic-ui-react'

interface LogInProps {
  auth: Auth
}

interface LogInState {}

export class LogIn extends React.PureComponent<LogInProps, LogInState> {
  onLogin = () => {
    this.props.auth.login()
  }

  render() {
    return (
      <Grid textAlign='center' style={{ height: '100vh' }}>
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as='h2' color='teal' textAlign='center'>
          Welcome :)
        </Header>
        <Form size='large'>
          <Segment stacked>
            <Form.Input fluid icon='user' iconPosition='left' placeholder='E-mail address' />
            <Form.Input
              fluid
              icon='lock'
              iconPosition='left'
              placeholder='Password'
              type='password'
            />
  
            <Button onClick={this.onLogin} color='teal' fluid size='large'>
              Login
            </Button>
          </Segment>
        </Form>
        <Message>
          New to us? <a onClick={this.onLogin} href='#'>Sign Up (Both buttons do the same thing anyways)</a>
        </Message>
      </Grid.Column>
    </Grid>
    )
  }
}