# Serverless blog
A personal blog, and by personal I mean literally no one else can see your blog posts... so I guess it's actually a diary.
# Functionality of the application

This application will allow creating/removing/updating/fetching blog items. Each blog item can optionally have an attachment image. Each user only has access to blog items that he/she has created.

# client setup
```
cd client
npm install
npm start
```
navigate to localhost:3000

# backend setup
By the time you're reading this I would have already closed the API, so you'll have to set up the backend with Severless
```
cd backend
npm i
sls deploy
```
Then replace the api id in the config.ts file in the client side code
