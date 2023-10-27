module.exports = {
  debug: (message) => console.log(`[${new Date().toISOString()}] [DEBUG] ${message}`),
  info: (message) => console.log(`[${new Date().toISOString()}] [INFO] ${message}`),
  warning: (message) => console.log(`[${new Date().toISOString()}] [WARNING] ${message}`),
  error: (message, error) => console.log(`[${new Date().toISOString()}] [ERROR] ${message}`, error),
};
