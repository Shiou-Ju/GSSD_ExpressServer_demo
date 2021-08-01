const express = require('express');
const {register, login, getMe, forgotPassword, resetPassword, updateDetails,updatePassword,logout,cancel,cancelByExpiration} = require('../controllers/auth')

const router = express.Router();

const {protect} = require('../middleware/auth')

router.post('/register',register)
router.post('/login',login)
router.get('/me',protect,getMe)
router.get('/logout',logout)
router.put('/updatedetails',protect,updateDetails)
router.put('/updatepassword',protect,updatePassword)
router.post('/forgotpassword',forgotPassword )
router.post('/cancel',cancel )
router.post('/cancelbyexpiration',cancelByExpiration)
router.put('/resetpassword/:resettoken',resetPassword )

module.exports = router;