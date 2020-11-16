// blog: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'x55sq2w852'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-2.amazonaws.com/prod`

export const authConfig = {
  // blog: Create an Auth0 application and copy values from it into this map
  domain: 'dev-xpsu1akb.us.auth0.com',            // Auth0 domain
  clientId: 'k3FR8tbUhAmKhTyusZa9B4pI5xx60Eb9',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
