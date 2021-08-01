# GSSD RESTful APIs
Backend demo-repo for [GongShiSongDa](https://www.gongshisongda.site/) subscription service.

## Requirements
- node
- npm or yarn

## Installation
- `npm install`
- rename `config/config.example.env` to `config.env` 
- add or modify the vars in config.env

## Modes
- Development mode: `npm run dev`
- Production mode: `npm start`

## 23 API endpoints in 5 Categories
### User
- Get all users
- Get single user
- Create a User
- Update a User
- Delete a User
### Authentication
- Register user
- Login user
- Cancel subscription by user
- Cancel subscription after 180 days
- Get current logged in user
- Log user out & clear cookie
- Update user details
- Update password
- Forget password
- Reset through email link
### Post  
- Get all posts
- Get single post
- Add a post
- Update a post
- Delete a post
### Match  
- Send match(es)
- Notify if source website is revised
### LineBot 
- Connection to Line chatbot service 

## Deployment
If this project is deployed to platforms such as Heroku or others, it is necessary to fill in all vars provided in `config.example.env` each by each in the console or dashboard.

## Version: 2.0.0
LineBot Added

## License
MIT


