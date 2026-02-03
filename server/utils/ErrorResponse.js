const ErrorResponse = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.success = false;
  return error;
};

export default ErrorResponse;
