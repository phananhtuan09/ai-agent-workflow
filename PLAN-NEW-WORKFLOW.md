# AI Workflow Framework - Build Plan

> Framework declarative để define multi-agent workflows cho coding agents (Claude Code, Codex, Cursor).
> Workflow define qua YAML, execute qua slash command.

---

## 1. Mục tiêu

Build MVP framework cho phép:
- User define workflow qua YAML file (agents + flows)
- User trigger workflow qua slash command: `/workflow <name> "<task>"`
- Mỗi step spawn isolated sub-agent với prompt riêng
- Output mỗi agent ghi vào file markdown riêng
- User iterate bằng cách chạy lại workflow với prompt refined

**Non-goals (skip MVP)**:
- Auto-retry, auto-recovery khi fail
- Conditional branching, loops phức tạp trong YAML
- Benchmark suite, LLM judge, A/B testing
- Resume capability
- Cross-platform (chỉ target Claude Code trước)

---

## 2. Design quyết định

### Approach
- **Pure Claude Code orchestration**: slash command đọc YAML và điều phối
- Không build runtime/CLI tool riêng cho orchestration

### Agent path strategy
- Agents dùng native Claude agent system: `.claude/agents/<name>.md`
- Slash command resolve agent path theo `agent_base_path` (default `.claude/agents/`)
- Khi cần support adapter khác (Cursor, Codex): chỉ cần thêm 1 dòng config `agent_base_path` tương ứng

### Core principles
1. **Iterate-friendly**: chạy lại lần 2,3 là natural - không cần perfect first run
2. **Stateless main context**: main context chỉ giữ filenames, không đọc full content
3. **Sub-agent isolation default**: mọi agent isolated để tránh context bloat
4. **File-based handoff**: agents communicate qua files, không qua memory
5. **Simple over perfect**: bỏ mọi feature không thực sự cần

### Token optimization strategy
- Main context **chỉ đọc filename** của output, không đọc content
- Sub-agents tự đọc input files
- Output convention: `## Summary` + `## Details` (cuối workflow chỉ đọc Summary)

### Failure handling
- Step fail → workflow stop, output ra cho user
- User xem logs, refine prompt, trigger lại
- Không có auto-retry phức tạp

---

## 3. Folder Structure

```
your-project/
├── .claude/
│   ├── commands/
│   │   └── workflow.md                  # Slash command entry point
│   │
│   └── agents/                          # Claude native agent files
│       ├── analyzer.md
│       ├── planner.md
│       ├── reviewer.md
│       ├── coder.md
│       ├── tester.md
│       ├── investigator.md
│       ├── fixer.md
│       └── verifier.md
│
└── .ai-workflows/
    ├── workflows/                       # YAML workflow definitions
    │   ├── feature-dev.yaml
    │   └── bug-fix.yaml
    │
    └── runs/                            # Auto-generated per run
        └── 20260425-143022-a3f2/
            ├── 01-analyze.md
            ├── 02-plan.md
            ├── 03-review.md
            ├── 04-implement.md
            └── 05-test.md
```

---

## 4. YAML Schema

### Example: `feature-dev.yaml`

```yaml
name: feature-dev
description: Multi-agent workflow để phát triển feature mới

# agent_base_path: .claude/agents   # default, override khi dùng adapter khác

agents:
  - id: analyzer
    prompt_file: analyzer.md          # relative to agent_base_path
    isolated: true
    
  - id: planner
    prompt_file: planner.md
    isolated: true
    
  - id: reviewer
    prompt_file: reviewer.md
    isolated: true
    
  - id: coder
    prompt_file: coder.md
    isolated: true
    
  - id: tester
    prompt_file: tester.md
    isolated: true

flows:
  - id: analyze
    agent: analyzer
    output: 01-analyze.md
    checkpoint: true
    
  - id: plan
    agent: planner
    inputs:
      - 01-analyze.md
    output: 02-plan.md
    
  - id: review
    agent: reviewer
    inputs:
      - 02-plan.md
    output: 03-review.md
    checkpoint: true
    
  - id: implement
    agent: coder
    inputs:
      - 02-plan.md
      - 03-review.md                  # coder nhận cả plan + review feedback
    output: 04-implement.md
    
  - id: test
    agent: tester
    inputs:
      - 04-implement.md
    output: 05-test.md
```

### Schema fields

**Top-level**:
- `name`: workflow identifier
- `description`: human-readable description
- `agent_base_path`: (optional) path to agent files, default `.claude/agents`
- `agents`: list of agent definitions
- `flows`: ordered list of execution steps

**Agent fields**:
- `id`: unique identifier
- `prompt_file`: filename of agent prompt (resolved against `agent_base_path`)
- `isolated`: spawn as sub-agent (default `true`)

**Flow fields**:
- `id`: unique step identifier
- `agent`: reference agent.id
- `inputs`: list of filenames to read (outputs of previous steps), optional
- `output`: filename to write
- `checkpoint`: pause for user approval after this step

---

## 5. Output Convention

Mọi agent output file PHẢI follow format:

```markdown
## Summary
[2-3 câu tóm tắt: làm gì, key findings, next steps. Max 200 từ.]

## Details
[Full content: analysis, plan, code, test results, etc.]
```

Lý do:
- Cuối workflow, chỉ đọc `## Summary` để generate final report
- User scan nhanh `## Summary` để hiểu mỗi step
- `## Details` cho khi cần drill down

---

## 6. Slash Command Logic

File: `.claude/commands/workflow.md`

Pseudo-logic của slash command:

```
INPUT: $1 = workflow name, $2 = task description

1. SETUP
   - Read .ai-workflows/workflows/$1.yaml
   - Resolve agent_base_path: dùng giá trị trong YAML nếu có, else ".claude/agents"
   - Generate run_id bằng Python:
       python3 -c "
       import datetime, random, string
       ts = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
       suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
       print(f'{ts}-{suffix}')
       "
   - Create run dir: .ai-workflows/runs/<run_id>/
   - Print: "Starting workflow $1, run_id: <run_id>"

2. EXECUTE FLOWS (loop through flows array)
   For each step in flows:
   
   a. Find agent by step.agent (lookup in agents array)
   b. Read agent prompt from: <agent_base_path>/<agent.prompt_file>
   c. Build sub-agent task:
      - Agent prompt content
      - Task description ($2)
      - Input file paths: [<run_dir>/<f> for f in step.inputs] (if any)
      - Output file path: <run_dir>/<step.output>
      - Instruction: "Read each input file yourself. Write output to <run_dir>/<step.output>"
   
   d. If agent.isolated == true:
      - Spawn sub-agent via Task tool
      - Sub-agent runs in fresh context, reads inputs itself
   Else:
      - Execute in current context
   
   e. Verify output file was created
      - If not: STOP, report error to user
   
   f. If step.checkpoint == true:
      - Show ## Summary section of output file to user
      - Ask: "Approve to continue? (y/n)"
      - If n: STOP, ask user what to do
   
   g. Continue to next step

3. FINALIZE
   - Read ## Summary section only from all output files
   - Generate brief final report
   - Show user: list of output files, combined summary
```

### Critical instructions for slash command

```markdown
## Important Rules

1. DO NOT read full content of output files unless:
   - Showing checkpoint to user
   - Generating final report (only ## Summary section)
   
2. When spawning sub-agents:
   - Pass file PATHS, not file CONTENTS
   - Sub-agent will read all input files itself
   
3. DO NOT skip steps unless explicitly told
4. DO NOT merge steps even if they look similar
5. Track only filenames in your working memory
6. State is in filesystem (run dir), not your memory
7. Agent path: always resolve prompt_file against agent_base_path
```

---

## 7. Agent Prompt Template

Mỗi file `.claude/agents/*.md` follow template:

```markdown
# Agent: <Role Name>

## Role
[1-2 câu mô tả role]

## Inputs
- Task description từ user
- (Optional) Input files: [list các file paths được pass vào]

## Process
1. [Step 1]
2. [Step 2]
3. ...

## Constraints
- Maximum 15 file reads (cho exploration agent)
- Do NOT modify files (cho non-coder agents)
- Other constraints...

## Output Format

Save to specified output file with this structure:

## Summary
[2-3 sentences. What you did, key findings, next steps. Max 200 words.]

## Details
[Full output here]
```

---

## 8. Build Order

### Phase 1: Foundation (build first)
1. **Bug-fix workflow** (đơn giản nhất, 3 agents)
   - `workflows/bug-fix.yaml`
   - `.claude/agents/investigator.md`
   - `.claude/agents/fixer.md`
   - `.claude/agents/verifier.md`

2. **Slash command** (`/workflow.md`)
   - Implement orchestration logic
   - Test với bug-fix workflow

### Phase 2: Validate (test với task thực)
3. Tìm 1-2 bug thực trong project, chạy bug-fix workflow
4. Iterate prompts dựa trên kết quả
5. Fix issues phát hiện trong slash command

### Phase 3: Scale up
6. **Feature-dev workflow** (5 agents, phức tạp hơn)
   - `workflows/feature-dev.yaml`
   - `.claude/agents/analyzer.md`
   - `.claude/agents/planner.md`
   - `.claude/agents/reviewer.md`
   - `.claude/agents/coder.md`
   - `.claude/agents/tester.md`

7. Test với feature thực
8. Iterate

### Phase 4: Polish (optional)
9. Thêm workflows khác (refactor, chore...)
10. Convenience commands: `/workflow list`, `/workflow status`
11. Documentation

---

## 9. Definition of Done (MVP)

✅ Chạy được command `/workflow bug-fix "fix login bug"`
✅ Workflow execute hết các steps không cần intervention
✅ Mỗi step output file được tạo với format đúng (Summary + Details)
✅ Checkpoint pause được, user approve được
✅ User có thể chạy lại workflow với prompt refined
✅ Có ít nhất 2 workflows hoạt động (bug-fix, feature-dev)

---

## 10. Known Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Claude Code skip steps | Emphasize "DO NOT skip" trong slash command prompt |
| Sub-agent không follow output format | Strong template trong agent prompts, examples |
| Main context phình to dù đã isolated | Default isolated=true |
| Loop infinite nếu user hiểu sai | MVP không có loop trong YAML, simple sequential |
| Sub-agent prompt injection từ output | Defensive prompting trong main orchestrator |
| Python3 không có trên máy | Fallback: dùng Node.js (`node -e`) hoặc date string thủ công |

---

## 11. Future Enhancements (post-MVP)

Sau khi MVP work, consider:

- Resume capability (state.json + `/workflow resume`)
- Diff command để compare runs
- Conditional logic trong YAML (`skip_if`, `when`)
- Loop với max attempts
- Cross-platform adapters: Cursor, Codex (chỉ cần đổi `agent_base_path`)
- Workflow templates marketplace
- LLM-as-judge cho quality scoring
- Benchmark suite
- VSCode extension

**Nguyên tắc**: chỉ add khi có nhu cầu thực, không add preemptively.

---

## 12. Reference: Workflow Examples

### bug-fix.yaml (3 agents)

```yaml
name: bug-fix
description: Quick workflow để fix bug

# agent_base_path: .claude/agents   # default

agents:
  - id: investigator
    prompt_file: investigator.md
    isolated: true
    
  - id: fixer
    prompt_file: fixer.md
    isolated: true
    
  - id: verifier
    prompt_file: verifier.md
    isolated: true

flows:
  - id: investigate
    agent: investigator
    output: 01-investigate.md
    
  - id: fix
    agent: fixer
    inputs:
      - 01-investigate.md
    output: 02-fix.md
    checkpoint: true
    
  - id: verify
    agent: verifier
    inputs:
      - 02-fix.md
    output: 03-verify.md
```

### feature-dev.yaml (5 agents)

Đã có ở section 4.

---

## 13. Notes for Implementation

Khi build với Claude Code, gợi ý prompts:

**Build slash command**:
```
Read PLAN.md sections 6, 7, 8. Create .claude/commands/workflow.md.
The slash command should follow the orchestration logic in section 6.
Include the critical instructions to prevent over-eager behavior.
```

**Build first workflow**:
```
Read PLAN.md sections 4, 5, 12. Create:
- .ai-workflows/workflows/bug-fix.yaml
- .claude/agents/investigator.md
- .claude/agents/fixer.md
- .claude/agents/verifier.md

Each agent prompt should follow the template in section 7.
```

**Test**:
```
We have a bug: [describe bug]. 
Run: /workflow bug-fix "fix this bug: ..."
Show me the outputs after.
```

---

## End of Plan

Tổng effort estimate: 1-2 ngày build + iterate.
Khi gặp vấn đề, refer back lên section tương ứng để xem design decisions và rationale.
