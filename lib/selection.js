const readline = require("readline");

const { AI_TOOLS } = require("./config");
const { colors, error } = require("./logger");

function getCliSelectedTools(args = process.argv.slice(2)) {
  if (args.includes("--all")) {
    return AI_TOOLS;
  }

  const toolFlagIndex = args.indexOf("--tool");
  if (toolFlagIndex === -1) {
    return null;
  }

  const toolId = args[toolFlagIndex + 1];
  if (!toolId) {
    error("Missing value for --tool. Example: --tool codex");
    process.exit(1);
  }

  const tool = AI_TOOLS.find((item) => item.id === toolId);
  if (!tool) {
    error(`Unknown tool: ${toolId}`);
    process.exit(1);
  }

  return [tool];
}

async function multiSelect(options, title) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin, rl);
    process.stdin.setRawMode(true);
  }

  return new Promise((resolve) => {
    let cursor = 0;
    const selected = new Set();

    const render = () => {
      process.stdout.write("\x1b[2J\x1b[H");
      console.log(
        `\n${colors.bgBlue}${colors.white}${colors.bold} ${title} ${colors.reset}\n`
      );
      console.log(
        `${colors.dim}Use ↑↓ to navigate, Space to select, Enter to confirm, A to select all${colors.reset}\n`
      );

      options.forEach((option, index) => {
        const isSelected = selected.has(index);
        const isCursor = index === cursor;
        const checkbox = isSelected
          ? `${colors.green}[✓]${colors.reset}`
          : `${colors.dim}[ ]${colors.reset}`;
        const pointer = isCursor ? `${colors.cyan}❯${colors.reset}` : " ";
        const name = isCursor
          ? `${colors.bold}${option.name}${colors.reset}`
          : option.name;
        const description = `${colors.dim}${option.description}${colors.reset}`;

        console.log(`  ${pointer} ${checkbox} ${name} - ${description}`);
      });

      console.log(`\n${colors.dim}Selected: ${selected.size} tool(s)${colors.reset}`);
    };

    const cleanup = () => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.removeListener("keypress", onKeypress);
      rl.close();
    };

    const finish = (selectedOptions) => {
      cleanup();
      resolve(selectedOptions);
    };

    const onKeypress = (str, key) => {
      if (key.name === "up") {
        cursor = cursor > 0 ? cursor - 1 : options.length - 1;
        render();
        return;
      }

      if (key.name === "down") {
        cursor = cursor < options.length - 1 ? cursor + 1 : 0;
        render();
        return;
      }

      if (key.name === "space") {
        if (selected.has(cursor)) {
          selected.delete(cursor);
        } else {
          selected.add(cursor);
        }
        render();
        return;
      }

      if (key.name === "a") {
        if (selected.size === options.length) {
          selected.clear();
        } else {
          options.forEach((_, index) => selected.add(index));
        }
        render();
        return;
      }

      if (key.name === "return") {
        finish(Array.from(selected).map((index) => options[index]));
        return;
      }

      if (key.ctrl && key.name === "c") {
        cleanup();
        process.exit(0);
      }
    };

    render();
    process.stdin.on("keypress", onKeypress);
  });
}

async function simpleSelect() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log("\n🤖 Which AI tool(s) do you want to setup?");
    console.log("─".repeat(50));
    AI_TOOLS.forEach((tool, index) => {
      console.log(
        `  ${index + 1}. ${tool.name} - ${colors.dim}${tool.description}${colors.reset}`
      );
    });
    console.log(`  ${AI_TOOLS.length + 1}. All tools`);
    console.log("─".repeat(50));
    console.log(
      `${colors.dim}Enter numbers separated by comma (e.g., 1,3) or 'all'${colors.reset}`
    );

    rl.question("\nYour choice: ", (answer) => {
      rl.close();

      const input = answer.trim().toLowerCase();
      if (input === "all" || input === String(AI_TOOLS.length + 1)) {
        resolve(AI_TOOLS);
        return;
      }

      const indices = input
        .split(",")
        .map((value) => Number.parseInt(value.trim(), 10) - 1);
      const selectedTools = indices
        .filter((index) => index >= 0 && index < AI_TOOLS.length)
        .map((index) => AI_TOOLS[index]);

      if (selectedTools.length === 0) {
        error("No valid tools selected. Please try again.");
        process.exit(1);
      }

      resolve(selectedTools);
    });
  });
}

module.exports = {
  getCliSelectedTools,
  multiSelect,
  simpleSelect,
};
