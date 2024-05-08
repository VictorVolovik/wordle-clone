const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.static("build"));
app.listen(PORT, function () {
  console.log(`App running at http://localhost:${PORT}`);
});
