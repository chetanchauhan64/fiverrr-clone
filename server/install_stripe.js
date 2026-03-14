import { execSync } from "child_process";
try {
  execSync("npm install stripe", { stdio: "inherit" });
  console.log("Successfully installed stripe");
} catch (e) {
  console.error("Failed to install stripe", e);
}
