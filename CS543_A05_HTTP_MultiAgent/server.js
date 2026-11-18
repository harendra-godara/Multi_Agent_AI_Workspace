// Starts the Tasks service. PORT and RATE_LIMIT_MAX can be set through the environment.
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
createApp().listen(PORT, () => console.log(`Tasks service (A05) on http://localhost:${PORT}`));
