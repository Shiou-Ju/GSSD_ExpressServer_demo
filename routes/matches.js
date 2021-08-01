const express = require("express");
const { sendMatch, notifyRevisedSite } = require("../controllers/matches");

//init router
const router = express.Router({ mergeParams: true });

router.route("/").post(sendMatch);
router.post("/revise", notifyRevisedSite);
router.route("/:id");

module.exports = router;
