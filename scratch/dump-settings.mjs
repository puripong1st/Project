// scratch/dump-settings.mjs
import { getSystemSettings } from "./my-app/lib/db.ts";

async function main() {
  try {
    const settings = await getSystemSettings({ force: true });
    console.log("=== DB SETTINGS ===");
    console.log(JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
