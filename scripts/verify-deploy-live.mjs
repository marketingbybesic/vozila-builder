import https from "node:https";

const url = process.argv[2];
if (!url) {
  console.error("usage: node verify-deploy-live.mjs <url>");
  process.exit(1);
}

https
  .get(url, (res) => {
    if (res.statusCode === 200) {
      console.log("DEPLOY_LIVE_OK status=" + res.statusCode);
      process.exit(0);
    } else {
      console.error("FAIL status=" + res.statusCode);
      process.exit(1);
    }
  })
  .on("error", (e) => {
    console.error("FAIL error=" + e.message);
    process.exit(1);
  });
