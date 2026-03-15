#!/usr/bin/env node

const { main } = require("./lib/main");
const { error } = require("./lib/logger");

main().catch((installError) => {
  error(installError.message);
  process.exit(1);
});
