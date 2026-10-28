const express = require("express");
const app = express();

app.use(express.json()); // JSON body parse karne ke liye

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server chal raha hai" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
