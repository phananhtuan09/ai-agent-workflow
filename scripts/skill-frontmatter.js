// Dependency-free strict check of the YAML frontmatter subset skills use.
// Lenient runtimes accept invalid YAML that strict ones (Codex, OpenCode) drop.
//
// Supported: top-level `key: value` scalars (plain, single- or double-quoted),
// plain scalars continued on indented lines, block scalars (`|`, `>`), and
// indented blocks under an empty key. Anything else is reported, not guessed.

const BLOCK_SCALAR = /^[|>][-+0-9]*$/;

function checkPlain(text) {
  if (/: |:$/.test(text)) {
    return 'contains ": "; wrap it in double quotes';
  }
  if (/ #/.test(text)) {
    return 'contains " #", which YAML reads as a comment; wrap it in double quotes';
  }
  return null;
}

// Returns { fields, errors } where errors are { line, message } with 1-based
// line numbers in the whole file.
function checkFrontmatter(text) {
  const errors = [];
  const fields = {};
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") {
    return { fields, errors: [{ line: 1, message: "missing YAML frontmatter" }] };
  }
  const end = lines.indexOf("---", 1);
  if (end === -1) {
    return { fields, errors: [{ line: 1, message: "unterminated YAML frontmatter" }] };
  }

  // What indented lines after the current key mean.
  let mode = null; // "empty" | "mapping" | "block-scalar" | "plain" | "quoted" | null
  let currentKey = null;

  lines.slice(1, end).forEach((line, index) => {
    const lineNumber = index + 2;
    const report = (message) => errors.push({ line: lineNumber, message });
    const indented = /^\s/.test(line);

    if (indented && mode === "block-scalar") {
      return;
    }
    if (line.trim() === "" || line.trimStart().startsWith("#")) {
      return;
    }
    if (indented) {
      if (mode === "empty") {
        // The first indented line decides: a nested mapping or sequence, or a
        // plain scalar that starts on the next line (`description:\n  text`).
        if (/^\s+(?:- |-$|[A-Za-z0-9_-]+:(?: |$))/.test(line)) {
          mode = "mapping";
          return;
        }
        mode = "plain";
        const problem = checkPlain(line.trim());
        if (problem) {
          report(`unquoted value for "${currentKey}" ${problem}`);
        }
        fields[currentKey] = line.trim();
        return;
      }
      if (mode === "mapping") {
        return;
      }
      if (mode === "plain") {
        const problem = checkPlain(line.trim());
        if (problem) {
          report(`unquoted value for "${currentKey}" ${problem}`);
        }
        fields[currentKey] = `${fields[currentKey]} ${line.trim()}`;
        return;
      }
      if (mode === "quoted") {
        report(`multi-line quoted value for "${currentKey}" is not supported; keep it on one line`);
        return;
      }
      report("indented line outside a key");
      return;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):(?: (.*))?$/);
    if (!match) {
      report('expected "key: value"');
      mode = null;
      return;
    }
    const [, key, rawValue = ""] = match;
    // A value starting with `#` is a comment, so the key itself is empty.
    const value = rawValue.trim().startsWith("#") ? "" : rawValue.trim();
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      report(`duplicate key "${key}"`);
    }
    currentKey = key;
    fields[key] = value;

    if (value === "") {
      mode = "empty";
    } else if (BLOCK_SCALAR.test(value)) {
      mode = "block-scalar";
      fields[key] = "(block scalar)";
    } else if (value.startsWith('"')) {
      mode = "quoted";
      try {
        fields[key] = JSON.parse(value);
      } catch (error) {
        report(`invalid double-quoted value for "${key}"`);
      }
    } else if (value.startsWith("'")) {
      mode = "quoted";
      const inner = value.slice(1, -1);
      if (value.length < 2 || !value.endsWith("'") || inner.replace(/''/g, "").includes("'")) {
        report(`invalid single-quoted value for "${key}"`);
      }
      fields[key] = inner.replace(/''/g, "'");
    } else {
      mode = "plain";
      const problem = checkPlain(value);
      if (problem) {
        report(`unquoted value for "${key}" ${problem}`);
      }
    }
  });

  return { fields, errors };
}

module.exports = { checkFrontmatter };
