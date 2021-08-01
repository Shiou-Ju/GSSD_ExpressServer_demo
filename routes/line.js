const express = require("express");

//init router
const router = express.Router({ mergeParams: true });

const lineController = require("../controllers/line");

router.post("/", lineController.linebotParser, lineController.lineReply);

module.exports = router;
