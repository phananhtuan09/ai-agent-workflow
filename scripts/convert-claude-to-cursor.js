#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const sourceDir = path.join(__dirname, "..", ".claude", "commands");
const cursorDir = path.join(__dirname, "..", ".cursor", "commands");
const githubDir = path.join(__dirname, "..", ".github", "prompts");

/**
 * Convert Claude-specific tool syntax to generic instructions
 */
function convertContent(content) {
  let converted = content;

  // Remove or convert Claude-specific tool references
  converted = converted
    // Convert Task() tool references to generic instructions
    .replace(/\*\*Tool:\*\* Task\(([\s\S]*?)\)/g, (match, params) => {
      return "**Automated process:**\n- Use workspace search and analysis to accomplish this task";
    })
    // Convert AskUserQuestion references (various formats)
    .replace(
      /AskUserQuestion\(questions=\[\.\.\.]\)/g,
      "ask user for clarification"
    )
    .replace(/using AskUserQuestion:/g, "by asking user:")
    .replace(/AskUserQuestion with/g, "ask user with")
    .replace(/Use AskUserQuestion/g, "Ask user")

    // Convert Read() to generic read
    .replace(/Read\(file_path="([^"]+)"\)/g, "read `$1`")
    .replace(/- Read\(`([^`]+)`\)/g, "- Read `$1`")

    // Convert Write() to generic write
    .replace(/Write\(file_path="([^"]+)"(.*?)\)/g, "create file `$1`")

    // Convert Edit() to generic edit
    .replace(/Edit\(file_path="([^"]+)"(.*?)\)/g, "edit `$1`")

    // Convert Glob() to generic search
    .replace(/Glob\(pattern="([^"]+)"\)/g, "search for files matching `$1`")

    // Convert Bash() to generic command
    .replace(/Bash\(command="([^"]+)"\)/g, "run command: `$1`")

    // Remove references to Explore agent
    .replace(
      /\*\*Tool:\*\* Task\([\s\S]*?subagent_type='Explore'[\s\S]*?\)/g,
      "**Automated analysis:**\n- Systematically analyze the codebase to discover patterns"
    )
    .replace(/\(Explore Agent\)/g, "")

    // Convert skill references to file path references
    .replace(
      /Use `quality-code-check` skill for/g,
      "Follow step by step in `.claude/skills/quality/code-check/SKILL.md` for"
    )
    .replace(
      /Use `quality-code-check` skill to/g,
      "Follow step by step in `.claude/skills/quality/code-check/SKILL.md` to"
    )
    .replace(
      /`quality-code-check` skill/g,
      "guidelines in `.claude/skills/quality/code-check/SKILL.md`"
    )
    .replace(
      /Use `figma-design-extraction` skill to:/g,
      "Follow step by step in `.claude/skills/design/figma-extraction/SKILL.md`:"
    )
    .replace(
      /`figma-design-extraction` skill/g,
      "guidelines in `.claude/skills/design/figma-extraction/SKILL.md`"
    )
    .replace(
      /Use design skills to guide/g,
      "Follow design guidelines in `.claude/skills/design/` to guide"
    )
    .replace(
      /`theme-factory`:/g,
      "Theme selection (`.claude/skills/design/theme-factory/SKILL.md`):"
    )
    .replace(
      /`design-fundamentals`:/g,
      "Design fundamentals (`.claude/skills/design/fundamentals/SKILL.md`):"
    )
    .replace(
      /`design-responsive`:/g,
      "Responsive design (`.claude/skills/design/responsive/SKILL.md`):"
    )
    // Generic skill pattern - try to map to common paths
    .replace(
      /Use `([^`]+)` skill to/g,
      (match, skillName) =>
        `Follow step by step in \`.claude/skills/${skillName.replace(
          /-/g,
          "/"
        )}/SKILL.md\` to`
    )
    .replace(
      /Use `([^`]+)` skill for/g,
      (match, skillName) =>
        `Follow step by step in \`.claude/skills/${skillName.replace(
          /-/g,
          "/"
        )}/SKILL.md\` for`
    )

    // Remove parallel execution strategy sections (Cursor/Copilot don't support this explicitly)
    .replace(/## Parallel Execution Strategy[\s\S]*?(?=\n## )/g, "")
    .replace(/## Parallel Execution Strategy[\s\S]*?(?=\n##|$)/g, "")

    // Simplify thoroughness parameters
    .replace(/thoroughness='medium'/g, "")
    .replace(/thoroughness='quick'/g, "")

    // Convert "Fallback" sections to simpler format
    .replace(/\*\*Fallback:\*\*/g, "**Alternative approach:**")

    // Clean up **Tools:** sections
    .replace(/\*\*Tools:\*\*\n([\s\S]*?)(?=\n\n|\n\*\*)/g, (match, content) => {
      let cleaned = content
        .replace(
          /- AskUserQuestion\(questions=\[\.\.\.]\)/g,
          "- Ask user for input"
        )
        .replace(/- Read\(file_path="([^"]+)"\)/g, "- Read `$1`")
        .replace(/- Write\(file_path="([^"]+)"(.*?)\)/g, "- Create `$1`")
        .replace(/- Edit\(file_path="([^"]+)"(.*?)\)/g, "- Edit `$1`")
        .replace(/- Glob\(pattern="([^"]+)"\)/g, "- Search for `$1`")
        .replace(/- Bash\(command="([^"]+)"\)/g, "- Run `$1`");
      return "**Actions:**\n" + cleaned;
    });

  return converted;
}

/**
 * Process a single file
 */
function processFile(filename) {
  const sourcePath = path.join(sourceDir, filename);
  const cursorPath = path.join(cursorDir, filename);
  const githubPath = path.join(
    githubDir,
    filename.replace(".md", ".prompt.md")
  );

  console.log(`Processing ${filename}...`);

  try {
    // Read source content
    const content = fs.readFileSync(sourcePath, "utf8");

    // Convert content
    const converted = convertContent(content);

    // Write to cursor commands
    fs.writeFileSync(cursorPath, converted, "utf8");
    console.log(`  ✓ Updated ${cursorPath}`);

    // Write to github prompts
    fs.writeFileSync(githubPath, converted, "utf8");
    console.log(`  ✓ Updated ${githubPath}`);
  } catch (error) {
    console.error(`  ✗ Error processing ${filename}:`, error.message);
  }
}

/**
 * Main execution
 */
function main() {
  console.log("Converting Claude commands to Cursor/Copilot format...\n");

  const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith(".md"));

  files.forEach(processFile);

  console.log(`\nDone! Processed ${files.length} files.`);
}

main();
