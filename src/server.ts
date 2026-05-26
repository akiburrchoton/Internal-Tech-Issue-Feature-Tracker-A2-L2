import app from "./app";
import config from "./config";
import { initDB } from "./db";

const main = () => {
  const port = config.port || 3000;
  initDB();
  
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
}

main()