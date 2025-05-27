exports.sendResponse = (res, statusCode, data = null, message = null) => {
  const response = {};

  if (data !== null) response.data = data;
  if (message !== null) response.message = message;

  return res.status(statusCode).json(response);
};
