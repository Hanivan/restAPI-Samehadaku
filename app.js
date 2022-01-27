import express from "express";
import cors from "cors";
import routes from "./routes/index.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use("/api", routes);

app.use("/", (req, res) => {
  res.send({
    message: "Welcome",
    createdBy: "Hanivan Rizky",
  });
});

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});
