const localFrontendOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function getAllowedOrigins(configuredOrigins = process.env.FRONTEND_ORIGIN) {
  if (!configuredOrigins || !configuredOrigins.trim()) {
    return localFrontendOrigins;
  }

  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin, allowedOrigins) {
  return !origin || allowedOrigins.includes(origin);
}

function createCorsOptions(allowedOrigins = getAllowedOrigins()) {
  return {
    origin(origin, callback) {
      callback(null, isOriginAllowed(origin, allowedOrigins));
    },
  };
}

module.exports = { createCorsOptions, getAllowedOrigins, isOriginAllowed };
