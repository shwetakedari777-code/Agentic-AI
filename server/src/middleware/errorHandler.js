const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  const status = err.statusCode || err.status || 500;
  const code = err.code || (status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');

  res.status(status).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred',
    code,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack }),
  });
};

module.exports = errorHandler;
