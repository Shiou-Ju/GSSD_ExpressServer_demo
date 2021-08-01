const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Post = require("../models/Post");
const Match = require("../models/Match");
const sendEmail = require("../utils/sendEmail");

// @desc    Send Match
// @route   POST /api/v1/matches
// @access  Public

exports.sendMatch = asyncHandler(async (req, res, next) => {
  const { name, email, title, court, urlDetailed, datePosted } = req.body;

  let finder = await Match.find({
    email: email,
    title: title,
    court: court,
    datePosted: datePosted,
    urlDetailed: urlDetailed,
    subscription: true,
  });
  if (finder.length === 0) {
    //確認公告數目
    const postNum = await Post.find({
      addressee: { $regex: `${name}`, $options: "i" },
      title: title,
      urlDetailed: urlDetailed,
      datePosted: datePosted,
      court: court,
    });

    const postFind = await Post.findOne({
      addressee: { $regex: `${name}`, $options: "i" },
      title: title,
      urlDetailed: urlDetailed,
      datePosted: datePosted,
      court: court,
    });

    let message = "";

    //填寫信件內容
    if (postNum.length === 1) {
      message = `此信為系統搜尋及比對後自動通知，請勿回信。\n若對於內容有任何疑惑，還請親自前往司法院官網確認。\n司法院公示送達專區：https://www.judicial.gov.tw/tw/lp-139-1-1-40.html\n\n法院：${postFind.court}\n字號：${postFind.title}\n類別：${postFind.type}\n內容：${postFind.innerContent}\n此篇公告連結：${postFind.urlDetailed}`;
    } else if (postNum.length > 1) {
      let posts = "";

      for (i = 0; i < postNum.length; i++) {
        posts += `\n\n第${i + 1}篇\n法院：${postNum[i].court}\n字號：${
          postNum[i].title
        }\n類別：${postNum[i].type}\n內容：${
          postNum[i].innerContent
        }\n此篇公告連結：${postNum[i].urlDetailed}`;
      }

      message =
        `此信為系統搜尋及比對後自動通知，請勿回信。\n另外系統偵測到同一時段有兩篇條件的公告，以下為所有公告之內容。若對於內容有任何疑惑，還請親自前往司法院官網確認。\n司法院公示送達專區：https://www.judicial.gov.tw/tw/lp-139-1-1-40.html` +
        posts;
    } else {
      return next(new ErrorResponse(`發生未預期之錯誤`, 500));
    }

    //寄送確認信至信箱
    try {
      const mailResponse = await sendEmail({
        email: email,
        subject: `公示送達公告：${court} ${title}`,
        message,
      });

      res.status(200).json({ success: true, data: `公告郵件已寄送至信箱` });
    } catch (error) {
      console.log(error);
      return next(new ErrorResponse(`email寄送發生錯誤`, 500));
    }

    //建立比對記錄 //因為上方如果有error的話，會直接return，不會創造match記錄
    const match = await Match.create({
      name,
      email,
      title,
      court,
      urlDetailed,
      datePosted,
    });
  } else if (finder.length !== 0) {
    return next(new ErrorResponse(`已寄送此篇公告`, 500));
  } else {
    return next(new ErrorResponse(`發生未預期之錯誤`, 500));
  }
});

// @desc    Notify if source website is revised
// @route   POST /api/v1/matches/revise
// @access  Public

exports.notifyRevisedSite = asyncHandler(async (req, res, next) => {
  let message = "公示送達網站已經改版，要儘速更新！";
  let recipients = ["gssd.subscription@gmail.com", "shyunsuke31s@gmail.com"];

  //寄送通知信至個人信箱
  try {
    let mailResponse = await sendEmail({
      email: recipients,
      subject: `重要：公示送達網站已經改版`,
      message,
    });

    res
      .status(200)
      .json({ success: true, data: `公告郵件已寄送至${recipients}` });
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse(`email寄送發生錯誤`, 500));
  }
});
