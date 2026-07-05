require("./src/config/env");
const { getDashboardOverview } = require("./src/services/expert-workspace.service");

async function test() {
  try {
    const data = await getDashboardOverview("e1f82c47-3a13-4f99-8263-833444b0e932"); // Random UUID or expert_id
    console.log("SUCCESS");
  } catch (err) {
    console.error("ERROR CAUGHT:");
    console.error(err);
  }
}
test();
