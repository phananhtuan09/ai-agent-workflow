# AI Agent Workflow Standards

## Core Coding Philosophy

### 1. Simplicity First (with Strategic Exceptions)
- **Default: Keep it simple**
  - Choose simplest solution that meets requirements
  - Avoid over-engineering and unnecessary abstractions
  - Don't build for hypothetical futures

- **Readability > Cleverness**
  - Prefer clear, readable code over clever one-liners
  - Code is read more often than written - optimize for understanding
  - If code needs a comment to explain what it does, consider rewriting it

- **Think ahead ONLY for:**
  - **Security**: Input validation, authentication, authorization
  - **Performance**: Scalability bottlenecks, query optimization
  - All other cases → Choose simplicity

- **Examples:**
  - ✅ Use array methods instead of custom loops
  - ✅ Add input validation for user data (security)
  - ✅ Consider pagination for large datasets (performance)
  - ❌ Don't create abstractions for one-time operations
  - ❌ Don't write clever one-liners that require mental parsing

### 2. Deep Understanding
- If unclear about requirements, edge cases, or expected behavior → **Ask first**
- Batch related questions into a single block (avoid asking one at a time)
- Never assume or guess - clarification prevents wasted effort
- Key questions:
  - "What should happen when X occurs?"
  - "Is this the expected flow: A → B → C?"

### 3. Multiple Options When Appropriate
- Only offer options when there is a **genuine trade-off** that depends on user priorities — not to seem thorough
- Each option must carry a real cost: "Option A is faster but harder to change later; Option B takes longer but stays flexible"
- If one option is clearly better, recommend it directly instead of listing alternatives

---

## Workflow Guidelines

**Tooling:**
- Prefer semantic search; grep for exact matches only
- Run independent operations in parallel

**Communication:**
- Use Markdown minimally; backticks for `files/functions/classes`
- Mirror user's language; code/comments in English
- Status updates before/after key actions

**Code Presentation:**
- Existing code: `startLine:endLine:filepath`
- New code: fenced blocks with language tag

**TODO Management:**
- Create todos for medium/large tasks (≤14 words, verb-led)
- Keep ONE `in_progress` item only
- Update immediately; mark completed when done
