const jwt = require('jsonwebtoken');
const asyncHandler = require('./async')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/User')

//protect routes
exports.protect = asyncHandler(async(req,res,next)=>{
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    //set token from bearer token in headers
    token = req.headers.authorization.split(" ")[1];
  }

  //set token from cookie
  else if (req.cookies.token) {
    token = req.cookies.token;
  }
  

  //make sure token is sent
  if(!token){
    return next(new ErrorResponse('到此路徑沒有授權',401))
  }

  try {
    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log(decoded)

    req.user = await User.findById(decoded.id)

    next();
  } catch (error) {
    return next(new ErrorResponse('到此路徑沒有授權',401))
  }
})

//grant access to specific roles
exports.authorize = (...roles) =>{
  return (req,res,next) =>{
    if(!roles.includes(req.user.role)){
      return next(new ErrorResponse(`${req.user.role}的人員沒有存取權限`,403))
    }
    next()
  }
}
