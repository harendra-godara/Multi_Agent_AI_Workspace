// Starts the Tasks service. PORT, RATE_LIMIT_MAX and MAINTENANCE=1 can be set through the environment.
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
const server = createApp().listen(PORT, () => console.log(`Tasks service (A06) on http://localhost:${PORT}`));

// Timeouts: a slow or stalled client must not hold a connection forever.
server.headersTimeout = 10_000;
server.requestTimeout = 15_000;
server.keepAliveTimeout = 5_000;
