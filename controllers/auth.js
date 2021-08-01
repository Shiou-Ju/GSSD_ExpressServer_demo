const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const Match = require("../models/Match");

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  //create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  sendTokenResponse(user, 200, res);

  //寄送確認信至信箱
  const message = `感謝您註冊本服務，系統將會在收到有關公告後，立即通知您。\n\n您所填的應受送達人為：${name}。\n\n如您不需要使用此服務，歡迎隨時到訪我們的網站取消訂閱。\n公示送達訂閱服務：https://www.gongshisongda.site/`;

  try {
    await sendEmail({
      email: user.email,
      subject: "感謝您註冊公示送達訂閱服務",
      message,
    });
    //成功寄送確認信以後變更成已寄送
    await User.findOneAndUpdate(
      { email: email, name: name, isSentConfirmed: false, isCancelled: false },
      { isSentConfirmed: true }
    );
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse(`email寄送發生錯誤`, 500));
  }
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse("請提供email或密碼", 400));
  }

  //check for user
  const user = await User.findOne({ email: email }).select("+password"); //預設不會顯示密碼，需要後面的option

  if (!user) {
    return next(new ErrorResponse("用戶資訊錯誤", 401)); //不存在這個用戶
  }

  //check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("用戶資訊錯誤", 401)); //密碼錯誤
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Cancel Subscription by self 自己取消註冊
// @route   POST /api/v1/cancel
// @access  Private

exports.cancel = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse("請提供email或密碼", 400));
  }

  //check for user
  const user = await User.findOne({ email: email, isCancelled: false }).select(
    "+password"
  ); //因為預設不會顯示密碼，所以要後面的option

  if (!user) {
    return next(new ErrorResponse("用戶資訊錯誤", 401)); //不存在這個用戶
  }

  //check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("用戶資訊錯誤", 401)); //密碼錯誤
  }

  //避免將來用戶以同樣送達人註冊，不會寄送同樣條件的資料
  await Match.updateMany({ email: email }, { subscription: false });
  //刪除用戶
  let cancelledDate = new Date(Date.now()).toString();
  await User.findOneAndUpdate(
    { email: email, isCancelled: false },
    { isCancelled: true, email: `${email} cancelled at ${cancelledDate}` }
  );

  res.status(200).json({ success: true, data: {} });
});

// @desc    Cancel Subscription after 180 days  180天後自動取消註冊
// @route   POST /api/v1/cancel
// @access  Private

exports.cancelByExpiration = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  //check for user
  const user = await User.findOne({ email: email, isCancelled: false });
  const matches = await Match.find({ email: email, subscription: true });

  if (!user) {
    return next(new ErrorResponse("用戶資訊錯誤", 401));
  }

  let dateCreated = user.createdAt;

  //寄送通知信至信箱
  const message = `感謝您使用本服務，您所註冊之資料已到期。\n\n您於${dateCreated.getFullYear()}年${
    dateCreated.getMonth() + 1
  }月${dateCreated.getDate()}日所填的應受送達人為：${
    user.name
  }，註冊期間系統共寄出${
    matches.length
  }篇通知。\n\n如您需要繼續使用此服務，歡迎隨時到訪我們的網站再次訂閱。\n公示送達訂閱服務：https://www.gongshisongda.site/`;

  try {
    await sendEmail({
      email: user.email,
      subject: "公示送達訂閱服務已到期，感謝您的使用",
      message,
    });
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse(`email寄送發生錯誤`, 500));
  }

  //避免將來用戶以同樣送達人註冊，不會寄送同樣條件的資料
  await Match.updateMany({ email: email }, { subscription: false });
  //使用戶過期
  let cancelledDate = new Date(Date.now()).toString();
  await User.findOneAndUpdate(
    { email: email, isCancelled: false },
    { isCancelled: true, email: `${email} cancelled at ${cancelledDate}` }
  );

  res.status(200).json({ success: true, data: {} });
});

// @desc    Get current logged in user
// @route   POST /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  //set cookie to none
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update Password
// @route   POST /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  //check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse(`密碼不正確`, 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forget password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse(`無此用戶`, 404));
  }

  //get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  //create reset url
  const resetUrl = `https://www.gongshisongda.site/reset#${resetToken}`;

  const message = `您已於公示送達訂閱服務申請進行密碼重置。請移至以下網址進行操作：\n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "重置密碼",
      message,
    });

    res.status(200).json({ success: true, data: `郵件已寄送至信箱` });
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse(`email寄送發生錯誤`, 500));
  }
});

// @desc    Reset Through email link
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  //get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse(`無效的token`, 400));
  }

  //set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
});

//get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  //create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // set in https
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
  });
};
