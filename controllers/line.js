const line = require("linebot");
const request = require("request");
const Post = require("../models/Post");
const asyncHandler = require("../middleware/async");

// 用於辨識Line Channel的資訊
const bot = line({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_TOEKN,
});

// 傳送到Google Sheet記錄使用情境
function sendPostGS(userID, messageInput, recordTime) {
  let dateTW = new Date(recordTime).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
  });

  let parameter = {
    userID: userID,
    messageInput: messageInput.trim(),
    dateTW: dateTW,
    sheetUrl: process.env.SHEET_URL,
    sheetTag: process.env.SHEET_TAG,
  };

  var options = {
    url: process.env.GOOGLE_APP,
    method: "POST",
    followAllRedirects: true,
    form: parameter,
  };
  request(options, function (err, res, body) {
    console.log(`GAS傳送狀態：${body} ${dateTW}`);
  });
}

// 加入好友顯示的歡迎的訊息
bot.on("follow", function (event) {
  event
    .reply(
      `感謝您使用公示送達LINE BOT服務！\n\n您可以輸入名字，系統將會顯示該名字對應之最近三筆的公示送達資料；也可以輸入字號來查詢該案件最近三筆公示送達公告。\n\n公示送達LINE服務使用方式：\n1. 搜尋應受送達人：\n請輸入「搜尋 名字」\n（中間為半形空格）\n例如：\n搜尋 王小明\n搜尋 Steve\n\n2. 查詢特定案件字號：\n請輸入「搜尋 案件字號」\n（中間為半形空格）\n例如：\n搜尋 109年度訴字第1號\n\n3. 查詢特定字號&特定日期之公告：\n請輸入「搜尋 案件字號&民國年-月-日」\n例如：\n搜尋 109年度訴字第1號&110-01-01`
    )
    .then(function () {
      console.log(`${event.source.userId} ${event.type}`);
      sendPostGS(
        event.source.userId,
        `FOLLOWED_${event.type}`,
        event.timestamp
      );
    })
    .catch(function (error) {
      console.error(error);
    });;
});

// 當有人傳送訊息給Bot時
bot.on("message", function (event) {
  if (typeof event.message.text !== `string`) {
    event
      .reply(`本服務尚不接受多媒體檔案，敬請見諒！`)
      .then(function () {
        console.log(`${event.source.userId} ${event.message.type}`);
        sendPostGS(
          event.source.userId,
          `NOT_A_STRING--${event.message.type}`,
          event.timestamp
        );
      })
      .catch(function (error) {
        console.error(error);
      });
  } else {
    if (event.message.text.includes("搜尋 ")) {
      // 使用搜尋功能
      const publishDateRegExp = /(\d{1,3})\-(\d{2})\-(\d{2})/;
      // 搜尋字號
      if (event.message.text.includes("年度")) {
        let caseName = event.message.text.split("搜尋 ")[1].trim();
        // 搜尋字號&日期
        if (publishDateRegExp.test(event.message.text)) {
          let publishDate = caseName.split(`&`)[1].trim();
          caseName = caseName.split(`&`)[0].trim();

          let threePosts = ``;

          //確認公告數目
          Post.find({
            title: caseName,
            datePosted: publishDate,
          })
            .sort({ datePosted: -1 })
            .then((res) => {
              let resLength = res.length;
              if (resLength > 3) resLength = 3;
              for (let i = 0; i < resLength; i++) {
                threePosts += `〔第${i + 1}篇公告〕\n應受送達人姓名：${
                  res[i].addressee
                }\n公告內容：${res[i].innerContent}\n公告網址：${
                  res[i].urlDetailed
                }\n`;
              }
              event
                .reply(
                  `搜尋${caseName}\n於${publishDate}的公告\n最新${resLength}筆結果如下\n\n${threePosts}`
                )
                .then(function () {
                  console.log(`${event.source.userId} ${event.message.text}`);
                  sendPostGS(
                    event.source.userId,
                    event.message.text,
                    event.timestamp
                  );
                })
                .catch(function (error) {
                  console.error(error);
                });
            })
            .catch((error) => {
              console.error(error);
              event.reply(
                `發生錯誤，仍在維修中，請稍候再重試！\n如有疑問，歡迎來信聯繫：\ngssd.subscription@gmail.com\n`
              );
              console.log(`${event.source.userId} ${event.message.text}`);
            });
        }
        // 搜尋單純字號
        else {
          let threePosts = ``;

          Post.find({ title: caseName })
            .sort({ datePosted: -1 })
            .then((res) => {
              let resLength = res.length;
              if (resLength > 3) resLength = 3;
              for (let i = 0; i < resLength; i++) {
                threePosts += `〔第${i + 1}篇公告〕\n應受送達人姓名：${
                  res[i].addressee
                }\n公告內容：${res[i].innerContent}\n公告網址：${
                  res[i].urlDetailed
                }\n`;
              }
              event
                .reply(
                  `搜尋${caseName}的公告\n最新${resLength}筆結果如下\n\n${threePosts}`
                )
                .then(function () {
                  console.log(`${event.source.userId} ${event.message.text}`);
                  sendPostGS(
                    event.source.userId,
                    event.message.text,
                    event.timestamp
                  );
                })
                .catch(function (error) {
                  console.error(error);
                  console.log(`${event.source.userId} ${event.message.text}`);
                });
            })
            .catch((error) => {
              console.error(error);
              event.reply(
                `發生錯誤，仍在維修中，請稍候再重試！\n如有疑問，歡迎來信聯繫：\ngssd.subscription@gmail.com\n`
              );
              console.log(`${event.source.userId} ${event.message.text}`);
            });
        }
      }
      // 搜尋送達人
      else {
        let addressee = event.message.text.split("搜尋 ")[1].trim();

        let threePosts = ``;

          Post.find({addressee:{ "$regex": `${addressee}`, "$options": "i" }})
            .sort({ datePosted: -1 })
            .then((res) => {
              let resLength = res.length;
              if (resLength > 3) resLength = 3;
              for (let i = 0; i < resLength; i++) {
                threePosts += `〔第${i + 1}篇公告〕\n應受送達人姓名：${
                  res[i].addressee
                }\n法院：${res[i].court}\n字號：${res[i].title}\n公告日期：${
                  res[i].datePosted
                }\n公告網址：${res[i].urlDetailed}\n`;
              }
              event
                .reply(
                  `搜尋 ${addressee} 最新${resLength}筆結果如下\n${threePosts}`
                )
                .then(function () {
                  console.log(`${event.source.userId} ${event.message.text}`);
                  sendPostGS(
                    event.source.userId,
                    event.message.text,
                    event.timestamp
                  );
                })
                .catch(function (error) {
                  console.error(error);
                });
            })
            .catch((error) => {
              console.error(error);
              event.reply(
                `發生錯誤，仍在維修中，請稍候再重試！\n如有疑問，歡迎來信聯繫：\ngssd.subscription@gmail.com\n`
              );
              console.log(`${event.source.userId} ${event.message.text}`);
            });  
      }
    }
    // 測試字元
    else if (event.message.text.includes("測試 ")) {
      let replyText = event.message.text.split("測試 ")[1].trim();
      event
        .reply(`測試訊息：\n${replyText}`)
        .then(function () {
          console.log(`${event.source.userId} ${event.message.text}`);
          sendPostGS(event.source.userId, event.message.text, event.timestamp);
        })
        .catch(function (error) {
          console.error(error);
        });
    }
    // 顯示說明
    else {
      event
        .reply(
          `抱歉，您的訊息目前不支援！\n\n您可以輸入名字，系統將會顯示該名字對應之最近三筆的公示送達資料；也可以輸入字號來查詢該案件最近三筆公示送達公告。\n\n公示送達LINE服務使用方式：\n1. 搜尋應受送達人：\n請輸入「搜尋 名字」\n（中間為半形空格）\n例如：\n搜尋 王小明\n搜尋 Steve\n\n2. 查詢特定案件字號：\n請輸入「搜尋 案件字號」\n（中間為半形空格）\n例如：\n搜尋 109年度訴字第1號\n\n3. 查詢特定字號&特定日期之公告：\n請輸入「搜尋 案件字號&民國年-月-日」\n例如：\n搜尋 109年度訴字第1號&110-01-01`
        )
        .then(function () {
          console.log(`${event.source.userId} ${event.message.text}`);
          sendPostGS(event.source.userId, event.message.text, event.timestamp);
        })
        .catch(function (error) {
          console.error(error);
        });
    }
  }
});

// set body parser
exports.linebotParser = bot.parser();

exports.lineReply = asyncHandler(async (req, res, next) => {
  Promise.all(req.body.events.map(handleEvent)).then((result) =>
    res.json(result)
  );
});
