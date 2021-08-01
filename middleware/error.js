const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  //handling mongoose bad ObjectID
  if (err.name === "CastError") {
    const message = `無法找到此資源`;
    error = new ErrorResponse(message, 404);
  }

  //handling mongoose duplicate key
  if (err.code === 11000) {
    const message = `內容已存在！`;
    error = new ErrorResponse(message, 400);
  }

  //handling mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((value) => value.message);
    error = new ErrorResponse(message, 400);
  }

  //final handler
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "伺服器錯誤",
  });
};

module.exports = errorHandler;
