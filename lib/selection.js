const readline = require("readline");

const {
  AI_TOOLS,
  DEFAULT_KIT_ID,
  WORKFLOW_KITS,
} = require("./config");
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

function getDefaultKit() {
  return WORKFLOW_KITS.find((kit) => kit.id === DEFAULT_KIT_ID);
}

function getCliSelectedKit(args = process.argv.slice(2)) {
  const kitFlagIndex = args.indexOf("--kit");
  if (kitFlagIndex === -1) {
    return null;
  }

  const kitId = args[kitFlagIndex + 1];
  if (!kitId) {
    error("Missing value for --kit. Example: --kit coding-standard");
    process.exit(1);
  }

  const kit = WORKFLOW_KITS.find((item) => item.id === kitId);
  if (!kit) {
    error(`Unknown kit: ${kitId}`);
    process.exit(1);
  }

  return kit;
}

async function singleSelect(options, title) {
  const selectedOptions = await multiSelect(options, title, {
    allowSelectAll: false,
    singleSelect: true,
  });
  return selectedOptions[0] || null;
}

async function multiSelect(options, title, config = {}) {
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
      if (config.singleSelect) {
        console.log(
          `${colors.dim}Use ↑↓ to navigate, Enter or Space to confirm${colors.reset}\n`
        );
      } else {
        console.log(
          `${colors.dim}Use ↑↓ to navigate, Space to select, Enter to confirm, A to select all${colors.reset}\n`
        );
      }

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

      console.log(`\n${colors.dim}Selected: ${selected.size}${colors.reset}`);
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
        if (config.singleSelect) {
          finish([options[cursor]]);
          return;
        }
        if (selected.has(cursor)) {
          selected.delete(cursor);
        } else {
          selected.add(cursor);
        }
        render();
        return;
      }

      if (key.name === "a") {
        if (config.singleSelect || config.allowSelectAll === false) {
          return;
        }
        if (selected.size === options.length) {
          selected.clear();
        } else {
          options.forEach((_, index) => selected.add(index));
        }
        render();
        return;
      }

      if (key.name === "return") {
        if (config.singleSelect) {
          finish([options[cursor]]);
          return;
        }
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

async function simpleSelect(options = AI_TOOLS, title = "🤖 Which AI option(s) do you want to setup?") {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log(`\n${title}`);
    console.log("─".repeat(50));
    options.forEach((tool, index) => {
      console.log(
        `  ${index + 1}. ${tool.name} - ${colors.dim}${tool.description}${colors.reset}`
      );
    });
    console.log(`  ${options.length + 1}. All`);
    console.log("─".repeat(50));
    console.log(
      `${colors.dim}Enter numbers separated by comma (e.g., 1,3) or 'all'${colors.reset}`
    );

    rl.question("\nYour choice: ", (answer) => {
      rl.close();

      const input = answer.trim().toLowerCase();
      if (input === "all" || input === String(options.length + 1)) {
        resolve(options);
        return;
      }

      const indices = input
        .split(",")
        .map((value) => Number.parseInt(value.trim(), 10) - 1);
      const selectedTools = indices
        .filter((index) => index >= 0 && index < options.length)
        .map((index) => options[index]);

      if (selectedTools.length === 0) {
        error("No valid selections. Please try again.");
        process.exit(1);
      }

      resolve(selectedTools);
    });
  });
}

async function simpleSingleSelect(options, title) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log(`\n${title}`);
    console.log("─".repeat(50));
    options.forEach((option, index) => {
      console.log(
        `  ${index + 1}. ${option.name} - ${colors.dim}${option.description}${colors.reset}`
      );
    });
    console.log("─".repeat(50));

    rl.question("\nYour choice: ", (answer) => {
      rl.close();
      const index = Number.parseInt(answer.trim(), 10) - 1;
      const selectedOption = options[index];

      if (!selectedOption) {
        error("No valid selection. Please try again.");
        process.exit(1);
      }

      resolve(selectedOption);
    });
  });
}

module.exports = {
  getDefaultKit,
  getCliSelectedKit,
  getCliSelectedTools,
  multiSelect,
  simpleSingleSelect,
  simpleSelect,
  singleSelect,
};
