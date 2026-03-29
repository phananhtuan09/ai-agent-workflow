import type {
  LocalizedCopy,
  WorkflowMacroPhase,
  WorkflowSourceKind,
  WorkflowTierCardData,
} from "@/types/content";

function copy(en: string, vi: string): LocalizedCopy {
  return { en, vi };
}

function source(
  id: string,
  label: LocalizedCopy,
  kind: WorkflowSourceKind,
  path: string,
  tools: WorkflowTierCardData["tools"],
  note: LocalizedCopy,
) {
  return { id, label, kind, path, tools, note };
}

function card(cardData: WorkflowTierCardData): WorkflowTierCardData {
  return cardData;
}

export const workflowPhases: WorkflowMacroPhase[] = [
  {
    id: "requirement",
    title: copy("Requirement", "Yêu cầu"),
    shortLabel: copy("01", "01"),
    summary: copy(
      "Start with raw intent. Decide whether you stay lightweight, invoke a planning command, or spin up requirement orchestration.",
      "Bắt đầu từ nhu cầu ban đầu. Chọn hướng đi gọn nhẹ, gọi command lập kế hoạch, hoặc dùng orchestration cho requirement.",
    ),
    caption: copy(
      "Clicking this node reveals how raw prompts become requirement-ready structure across all three workflow levels.",
      "Bấm vào node này để xem prompt thô được chuyển thành cấu trúc đủ rõ để viết requirement như thế nào ở cả ba mức workflow.",
    ),
    cards: [
      card({
        id: "basic",
        title: copy("Basic", "Basic"),
        summary: copy(
          "Natural-language intake where the assistant infers your intent and triggers a fitting skill when the request is obvious enough.",
          "Luồng tiếp nhận bằng ngôn ngữ tự nhiên, nơi assistant tự suy ra ý định và kích hoạt skill phù hợp khi yêu cầu đã đủ rõ.",
        ),
        useCase: copy(
          "Use this when the ask is still fuzzy, exploratory, or small enough that you want speed over formal artifacts.",
          "Dùng khi yêu cầu còn mơ hồ, mang tính khám phá, hoặc đủ nhỏ để ưu tiên tốc độ hơn tài liệu chính thức.",
        ),
        benefit: copy(
          "Lowest friction. Users stay in one chat thread and get value immediately without memorizing commands.",
          "Ít rào cản nhất. User vẫn ở trong cùng một đoạn chat và nhận được giá trị ngay mà không cần nhớ command.",
        ),
        accent: "cyan",
        tools: ["claude", "codex"],
        graph: {
          nodes: [
            {
              id: "prompt",
              label: copy("Prompt", "Prompt"),
              x: 14,
              y: 52,
              emphasis: "primary",
            },
            { id: "intent", label: copy("Intent", "Ý định"), x: 48, y: 28 },
            {
              id: "skill",
              label: copy("Skill", "Skill"),
              x: 82,
              y: 52,
              emphasis: "primary",
            },
          ],
          edges: [
            { from: "prompt", to: "intent" },
            { from: "intent", to: "skill" },
          ],
        },
        sources: [
          source(
            "basic-rule",
            copy("Prompt rules", "Quy tắc prompt"),
            "rule",
            "AGENTS.md",
            ["claude", "codex"],
            copy(
              "Shared repo guidance that shapes how plain prompts are interpreted before explicit commands enter the picture.",
              "Bộ hướng dẫn chung của repo, quyết định cách các prompt tự nhiên được hiểu trước khi có command tường minh.",
            ),
          ),
          source(
            "brainstorm-partner",
            copy("brainstorm-partner", "brainstorm-partner"),
            "skill",
            ".agents/skills/brainstorm-partner/SKILL.md",
            ["codex"],
            copy(
              "A representative keyword-triggered skill for early discovery when the user still needs framing more than execution.",
              "Ví dụ tiêu biểu về skill kích hoạt theo từ khóa cho giai đoạn khám phá ban đầu, khi user cần định hình vấn đề hơn là thực thi.",
            ),
          ),
        ],
      }),
      card({
        id: "advanced",
        title: copy("Advanced", "Advanced"),
        summary: copy(
          "Explicit command entry for users who already know they want a planning artifact instead of freeform exploration.",
          "Điểm vào bằng command dành cho user đã biết mình cần artifact lập kế hoạch thay vì tiếp tục khám phá tự do.",
        ),
        useCase: copy(
          "Use this when you have a concrete feature request and want to move directly into `create-plan` or `manage-epic`.",
          "Dùng khi bạn đã có feature request cụ thể và muốn đi thẳng vào `create-plan` hoặc `manage-epic`.",
        ),
        benefit: copy(
          "You get predictable docs fast. The command choice makes scope and output format clearer from the first step.",
          "Bạn có tài liệu ổn định nhanh hơn. Việc chọn command giúp làm rõ phạm vi và định dạng đầu ra ngay từ bước đầu.",
        ),
        accent: "blue",
        tools: ["claude"],
        graph: {
          nodes: [
            {
              id: "request",
              label: copy("Request", "Yêu cầu"),
              x: 14,
              y: 50,
              emphasis: "primary",
            },
            {
              id: "command",
              label: copy("Command", "Command"),
              x: 48,
              y: 24,
              emphasis: "primary",
            },
            {
              id: "artifact",
              label: copy("Artifact", "Artifact"),
              x: 82,
              y: 50,
              emphasis: "primary",
            },
          ],
          edges: [
            { from: "request", to: "command" },
            { from: "command", to: "artifact" },
          ],
        },
        sources: [
          source(
            "create-plan-command",
            copy("/create-plan", "/create-plan"),
            "command",
            ".claude/commands/create-plan.md",
            ["claude"],
            copy(
              "Turns a bounded request into a feature plan without routing through orchestration.",
              "Biến một yêu cầu có phạm vi rõ ràng thành feature plan mà không cần đi qua lớp orchestration.",
            ),
          ),
          source(
            "manage-epic-command",
            copy("/manage-epic", "/manage-epic"),
            "command",
            ".claude/commands/manage-epic.md",
            ["claude"],
            copy(
              "Breaks larger requirement input into tracked feature-plan slices when one plan is not enough.",
              "Tách requirement lớn thành các lát cắt feature plan được theo dõi khi một plan là chưa đủ.",
            ),
          ),
        ],
      }),
      card({
        id: "power",
        title: copy("Power", "Power"),
        summary: copy(
          "Requirement orchestration for requests that need role-based discovery, bounded packets, and explicit handoffs before planning begins.",
          "Dành cho các yêu cầu cần khám phá theo vai trò, packet giới hạn và handoff rõ ràng trước khi bước vào planning.",
        ),
        useCase: copy(
          "Use this when the request is cross-layer, domain-heavy, or still too ambiguous to trust without BA/SA/UIUX-style structure.",
          "Dùng khi yêu cầu trải rộng qua nhiều lớp, nặng về domain, hoặc còn quá mơ hồ để tin cậy nếu không có cấu trúc kiểu BA/SA/UI/UX.",
        ),
        benefit: copy(
          "Highest confidence at intake. The workflow reduces guessing by delegating requirement discovery to specialized roles.",
          "Mức tin cậy cao nhất ở khâu tiếp nhận. Workflow giảm đoán mò bằng cách giao phần khám phá requirement cho các vai trò chuyên biệt.",
        ),
        accent: "amber",
        tools: ["claude", "codex"],
        graph: {
          nodes: [
            {
              id: "idea",
              label: copy("Idea", "Ý tưởng"),
              x: 10,
              y: 56,
              emphasis: "primary",
            },
            {
              id: "orch",
              label: copy("Orchestrator", "Orchestrator"),
              x: 38,
              y: 22,
              emphasis: "primary",
            },
            { id: "roles", label: copy("Roles", "Vai trò"), x: 66, y: 56 },
            {
              id: "req",
              label: copy("Req doc", "Tài liệu req"),
              x: 90,
              y: 30,
              emphasis: "primary",
            },
          ],
          edges: [
            { from: "idea", to: "orch" },
            { from: "orch", to: "roles" },
            { from: "roles", to: "req" },
          ],
        },
        sources: [
          source(
            "requirements-orch-command",
            copy("/requirements-orchestrator", "/requirements-orchestrator"),
            "command",
            ".claude/commands/requirements-orchestrator.md",
            ["claude"],
            copy(
              "Claude Code control plane for turning vague requests into a requirement package.",
              "Control plane của Claude Code để biến yêu cầu mơ hồ thành một gói requirement rõ ràng.",
            ),
          ),
          source(
            "requirements-orch-skill",
            copy("requirements-orchestrator", "requirements-orchestrator"),
            "skill",
            ".agents/skills/requirements-orchestrator/SKILL.md",
            ["codex"],
            copy(
              "Codex-compatible mirror that keeps the same routing, role selection, and bounded handoff model.",
              "Bản tương ứng cho Codex, giữ nguyên cách route, chọn vai trò và handoff có giới hạn.",
            ),
          ),
          source(
            "requirement-agents",
            copy("Requirement sub-agents", "Sub-agent cho requirement"),
            "agent",
            ".codex/agents/requirement-ba.toml",
            ["codex"],
            copy(
              "Named agents such as BA, SA, and UI/UX deepen discovery before downstream planning is allowed.",
              "Các agent đặt tên sẵn như BA, SA và UI/UX giúp đào sâu bước khám phá trước khi sang planning.",
            ),
          ),
        ],
      }),
    ],
  },
  {
    id: "planning",
    title: copy("Planning", "Lập kế hoạch"),
    shortLabel: copy("02", "02"),
    summary: copy(
      "Turn scoped input into docs, slices, and gates. This is where command discipline and orchestration start to diverge sharply.",
      "Biến đầu vào đã có phạm vi thành tài liệu, các lát cắt công việc và các điểm kiểm soát. Đây là lúc command và orchestration bắt đầu khác nhau rõ rệt.",
    ),
    caption: copy(
      "Planning exposes the biggest gap between lightweight prompting and orchestrated work: docs, gates, and review boundaries.",
      "Planning cho thấy khoảng cách lớn nhất giữa cách prompt nhẹ và cách làm có orchestration: tài liệu, các điểm kiểm soát và ranh giới review.",
    ),
    cards: [
      card({
        id: "basic",
        title: copy("Basic", "Basic"),
        summary: copy(
          "Planning still happens, but the user stays in a conversational mode and lets keyword-triggered skills do the shaping.",
          "Planning vẫn diễn ra, nhưng user giữ nhịp hội thoại và để skill kích hoạt theo từ khóa tự định hình đầu ra.",
        ),
        useCase: copy(
          "Use this when you want a quick execution plan but do not need command syntax or a larger orchestration envelope.",
          "Dùng khi bạn muốn có execution plan nhanh mà chưa cần cú pháp command hay một lớp orchestration lớn hơn.",
        ),
        benefit: copy(
          "You keep momentum. The assistant can still produce structured planning output without forcing users through command ceremony.",
          "Giữ được nhịp làm việc. Assistant vẫn có thể tạo đầu ra lập kế hoạch có cấu trúc mà không buộc user đi qua nghi thức command.",
        ),
        accent: "cyan",
        tools: ["codex"],
        graph: {
          nodes: [
            {
              id: "ask",
              label: copy("Ask", "Hỏi"),
              x: 14,
              y: 54,
              emphasis: "primary",
            },
            {
              id: "plan-skill",
              label: copy("Plan skill", "Skill lập kế hoạch"),
              x: 48,
              y: 24,
              emphasis: "primary",
            },
            {
              id: "doc",
              label: copy("Plan doc", "Tài liệu plan"),
              x: 82,
              y: 54,
              emphasis: "primary",
            },
          ],
          edges: [
            { from: "ask", to: "plan-skill" },
            { from: "plan-skill", to: "doc" },
          ],
        },
        sources: [
          source(
            "create-plan-skill",
            copy("create-plan skill", "Skill create-plan"),
            "skill",
            ".agents/skills/create-plan/SKILL.md",
            ["codex"],
            copy(
              "Produces a feature plan from repo context without requiring the user to call the Claude command form.",
              "Tạo feature plan từ ngữ cảnh repo mà không cần user gọi đúng cú pháp command của Claude.",
            ),
          ),
          source(
            "manage-epic-skill",
            copy("manage-epic skill", "Skill manage-epic"),
            "skill",
            ".agents/skills/manage-epic/SKILL.md",
            ["codex"],
            copy(
              "Expands requirement input into multiple tracked slices when planning needs decomposition.",
              "Mở rộng requirement thành nhiều lát cắt được theo dõi khi công việc lập kế hoạch cần tách nhỏ.",
            ),
          ),
        ],
      }),
      card({
        id: "advanced",
        title: copy("Advanced", "Advanced"),
        summary: copy(
          "Planning is command-first. Users choose the exact artifact path and let the command generate reviewable docs.",
          "Planning đi theo hướng command-first. User chọn chính xác đường dẫn artifact rồi để command tạo ra tài liệu có thể review.",
        ),
        useCase: copy(
          "Use this when you want clean feature plans, explicit epic breakdown, and direct control over which planning command runs.",
          "Dùng khi bạn muốn feature plan rõ ràng, cách tách epic minh bạch và quyền kiểm soát trực tiếp command lập kế hoạch sẽ chạy.",
        ),
        benefit: copy(
          "Higher predictability than basic mode. Output shape is stable and easier to hand off to `/execute-plan`.",
          "Dễ dự đoán hơn basic mode. Đầu ra ổn định và dễ bàn giao sang `/execute-plan`.",
        ),
        accent: "blue",
        tools: ["claude"],
        graph: {
          nodes: [
            { id: "scope", label: copy("Scope", "Phạm vi"), x: 10, y: 54 },
            {
              id: "epic",
              label: copy("Epic", "Epic"),
              x: 38,
              y: 24,
              emphasis: "primary",
            },
            {
              id: "plan",
              label: copy("Plan", "Plan"),
              x: 68,
              y: 54,
              emphasis: "primary",
            },
            { id: "review", label: copy("Review", "Review"), x: 90, y: 28 },
          ],
          edges: [
            { from: "scope", to: "epic" },
            { from: "epic", to: "plan" },
            { from: "plan", to: "review" },
          ],
        },
        sources: [
          source(
            "create-plan-command-plan",
            copy("/create-plan", "/create-plan"),
            "command",
            ".claude/commands/create-plan.md",
            ["claude"],
            copy(
              "Generates a single feature plan from a bounded request or requirement slice.",
              "Tạo một feature plan từ yêu cầu đã được khoanh phạm vi hoặc một lát cắt requirement.",
            ),
          ),
          source(
            "manage-epic-command-plan",
            copy("/manage-epic", "/manage-epic"),
            "command",
            ".claude/commands/manage-epic.md",
            ["claude"],
            copy(
              "Tracks multiple feature plans and dependency order when planning spans more than one deliverable.",
              "Theo dõi nhiều feature plan và thứ tự phụ thuộc khi planning trải rộng hơn một deliverable.",
            ),
          ),
        ],
      }),
      card({
        id: "power",
        title: copy("Power", "Power"),
        summary: copy(
          "Planning becomes a gated system with classification, investigation, readiness checks, and delegated review.",
          "Planning trở thành một hệ có kiểm soát với phân loại, điều tra, kiểm tra sẵn sàng và bước review được giao riêng.",
        ),
        useCase: copy(
          "Use this when planning accuracy matters as much as the final code, especially for ambiguous or cross-file work.",
          "Dùng khi độ chính xác của planning quan trọng ngang với code cuối, đặc biệt cho công việc mơ hồ hoặc cắt qua nhiều file.",
        ),
        benefit: copy(
          "The workflow lowers planning risk before implementation starts by adding bounded investigation and explicit readiness gates.",
          "Workflow giảm rủi ro ở khâu planning trước khi implementation bắt đầu bằng điều tra có giới hạn và các cổng sẵn sàng rõ ràng.",
        ),
        accent: "amber",
        tools: ["claude", "codex"],
        graph: {
          nodes: [
            {
              id: "route",
              label: copy("Route", "Route"),
              x: 8,
              y: 52,
              emphasis: "primary",
            },
            {
              id: "investigate",
              label: copy("Investigate", "Điều tra"),
              x: 32,
              y: 22,
              emphasis: "primary",
            },
            {
              id: "gate",
              label: copy("Gate", "Kiểm tra"),
              x: 58,
              y: 52,
              emphasis: "primary",
            },
            {
              id: "review",
              label: copy("Review", "Review"),
              x: 86,
              y: 24,
              emphasis: "primary",
            },
          ],
          edges: [
            { from: "route", to: "investigate" },
            { from: "investigate", to: "gate" },
            { from: "gate", to: "review" },
          ],
        },
        sources: [
          source(
            "dev-orch-command-plan",
            copy("/development-orchestrator", "/development-orchestrator"),
            "command",
            ".claude/commands/development-orchestrator.md",
            ["claude"],
            copy(
              "Coordinates classify, investigate, gate, plan, review, execute, verify, and sync from one entry point.",
              "Điều phối các bước classify, investigate, gate, plan, review, execute, verify và sync từ một điểm vào duy nhất.",
            ),
          ),
          source(
            "dev-orch-skill-plan",
            copy("development-orchestrator", "development-orchestrator"),
            "skill",
            ".agents/skills/development-orchestrator/SKILL.md",
            ["codex"],
            copy(
              "Codex mirror of the same orchestration flow, including task size, task type, and run-mode rules.",
              "Bản tương ứng cho Codex của cùng luồng orchestration, bao gồm cả quy tắc về task size, task type và run mode.",
            ),
          ),
          source(
            "plan-review-agents",
            copy("Planning agents", "Agent lập kế hoạch"),
            "agent",
            ".codex/agents/dev-plan-reviewer.toml",
            ["codex"],
            copy(
              "Named agents like `task_investigator` and `dev_plan_reviewer` bound the read-heavy steps before coding.",
              "Các agent đặt tên sẵn như `task_investigator` và `dev_plan_reviewer` giúp giới hạn những bước đọc nhiều trước khi viết code.",
            ),
          ),
        ],
      }),
    ],
  },
  {
    id: "implement",
    title: copy("Implement", "Thực thi"),
    shortLabel: copy("03", "03"),
    summary: copy(
      "This phase turns intent into code. The main difference between tiers is how much guardrail, context packeting, and validation discipline you want.",
      "Giai đoạn này biến ý định thành code. Khác biệt chính giữa các tầng là mức guardrail, cách đóng gói ngữ cảnh và kỷ luật validation mà bạn muốn.",
    ),
    caption: copy(
      "Implementation is where a lightweight prompt feels fast, but orchestration starts to pay off on larger or riskier changes.",
      "Implementation là nơi prompt gọn cho cảm giác nhanh, nhưng orchestration bắt đầu phát huy giá trị ở các thay đổi lớn hoặc rủi ro hơn.",
    ),
    cards: [
      card({
        id: "basic",
        title: copy("Basic", "Basic"),
        summary: copy(
          "The assistant moves straight into code edits from chat context, usually by matching the request to an execution-oriented skill.",
          "Assistant đi thẳng vào sửa code từ ngữ cảnh cuộc trò chuyện, thường bằng cách ghép yêu cầu với một skill thiên về thực thi.",
        ),
        useCase: copy(
          "Use this when the implementation is bounded enough that you do not need formal orchestration overhead.",
          "Dùng khi implementation đủ gói gọn để bạn không cần thêm chi phí orchestration chính thức.",
        ),
        benefit: copy(
          "Fastest path to a patch. Great for contained changes where the surrounding context is already obvious.",
          "Đường ngắn nhất để ra patch. Phù hợp với thay đổi nhỏ khi ngữ cảnh xung quanh đã rõ.",
        ),
        accent: "cyan",
        tools: ["codex"],
        graph: {
          nodes: [
            {
              id: "chat",
              label: copy("Chat", "Chat"),
              x: 12,
              y: 54,
              emphasis: "primary",
            },
            {
              id: "execute",
              label: copy("Execute", "Execute"),
              x: 48,
              y: 24,
              emphasis: "primary",
            },
            {
              id: "code",
              label: copy("Code", "Code"),
              x: 84,
              y: 54,
              emphasis: "primary",
            },
          ],
          edges: [
            { from: "chat", to: "execute" },
            { from: "execute", to: "code" },
          ],
        },
        sources: [
          source(
            "execute-plan-skill",
            copy("execute-plan skill", "Skill execute-plan"),
            "skill",
            ".agents/skills/execute-plan/SKILL.md",
            ["codex"],
            copy(
              "Implements remaining plan tasks directly from the planning doc with a single-writer model.",
              "Triển khai các task còn lại trong plan trực tiếp từ planning doc theo mô hình một người ghi chính.",
            ),
          ),
          source(
            "agents-rule",
            copy("Execution rules", "Quy tắc thực thi"),
            "rule",
            "AGENTS.md",
            ["claude", "codex"],
            copy(
              "Repo-level guardrails keep edits incremental, scoped, and synchronized with plan state.",
              "Các guardrail ở cấp repo giúp chỉnh sửa tăng dần, có phạm vi rõ và bám theo trạng thái plan.",
            ),
          ),
        ],
      }),
      card({
        id: "advanced",
        title: copy("Advanced", "Advanced"),
        summary: copy(
          "Execution is explicit: the user chooses `/execute-plan` and the command works phase by phase from the feature plan.",
          "Execution diễn ra tường minh: user chọn `/execute-plan` và command triển khai từng phase từ feature plan.",
        ),
        useCase: copy(
          "Use this when you want command-driven task progression and checkbox sync without the broader orchestration envelope.",
          "Dùng khi bạn muốn tiến độ task theo command và đồng bộ checkbox mà chưa cần cả lớp orchestration rộng hơn.",
        ),
        benefit: copy(
          "Predictable implementation cadence. The plan stays the source of truth while code changes remain reviewable.",
          "Nhịp implementation dễ dự đoán. Plan vẫn là nguồn sự thật trong khi các thay đổi mã vẫn dễ review.",
        ),
        accent: "blue",
        tools: ["claude"],
        graph: {
          nodes: [
            {
              id: "plan",
              label: copy("Plan", "Plan"),
              x: 12,
              y: 50,
              emphasis: "primary",
            },
            {
              id: "tasks",
              label: copy("Tasks", "Tác vụ"),
              x: 48,
              y: 24,
              emphasis: "primary",
            },
            {
              id: "patch",
              label: copy("Patch", "Bản vá"),
              x: 82,
              y: 50,
              emphasis: "primary",
            },
          ],
          edges: [
            { from: "plan", to: "tasks" },
            { from: "tasks", to: "patch" },
          ],
        },
        sources: [
          source(
            "execute-plan-command",
            copy("/execute-plan", "/execute-plan"),
            "command",
            ".claude/commands/execute-plan.md",
            ["claude"],
            copy(
              "Executes the plan phase by phase, updates checkboxes, and runs focused validation as work progresses.",
              "Thực thi plan theo từng phase, cập nhật checkbox và chạy validation tập trung trong suốt quá trình.",
            ),
          ),
          source(
            "check-implementation-command",
            copy("/check-implementation", "/check-implementation"),
            "command",
            ".claude/commands/check-implementation.md",
            ["claude"],
            copy(
              "Supports spot-checking whether the implementation still aligns with the intended plan or requirement.",
              "Giúp kiểm tra nhanh xem implementation còn bám đúng plan hoặc requirement ban đầu hay không.",
            ),
          ),
        ],
      }),
      card({
        id: "power",
        title: copy("Power", "Power"),
        summary: copy(
          "Implementation is only one stage inside a broader control loop that routes, gates, executes, verifies, and syncs.",
          "Implementation chỉ là một chặng trong vòng điều phối lớn hơn gồm route, gate, execute, verify và sync.",
        ),
        useCase: copy(
          "Use this when the code change is risky enough that you want context packets, readiness logic, and explicit resume points.",
          "Dùng khi thay đổi code đủ rủi ro để bạn muốn có context packet, readiness logic và resume point rõ ràng.",
        ),
        benefit: copy(
          "The workflow keeps implementation bounded and observable. You always know which gate already passed and which stage owns the next decision.",
          "Workflow giữ cho implementation có phạm vi rõ và dễ quan sát. Bạn luôn biết cổng nào đã qua và bước nào quyết định tiếp theo.",
        ),
        accent: "amber",
        tools: ["claude", "codex"],
        graph: {
          nodes: [
            {
              id: "gate",
              label: copy("Gate", "Kiểm tra"),
              x: 8,
              y: 52,
              emphasis: "primary",
            },
            {
              id: "exec",
              label: copy("Execute", "Execute"),
              x: 34,
              y: 24,
              emphasis: "primary",
            },
            {
              id: "verify",
              label: copy("Verify", "Xác minh"),
              x: 62,
              y: 54,
              emphasis: "primary",
            },
            {
              id: "sync",
              label: copy("Sync", "Đồng bộ"),
              x: 90,
              y: 28,
              emphasis: "primary",
            },
          ],
          edges: [
            { from: "gate", to: "exec" },
            { from: "exec", to: "verify" },
            { from: "verify", to: "sync" },
          ],
        },
        sources: [
          source(
            "dev-orch-command-implement",
            copy("/development-orchestrator", "/development-orchestrator"),
            "command",
            ".claude/commands/development-orchestrator.md",
            ["claude"],
            copy(
              "Keeps implementation inside a full workflow with readiness, verification, and sync rules.",
              "Giữ implementation nằm trong một workflow đầy đủ với các quy tắc về readiness, verification và sync.",
            ),
          ),
          source(
            "dev-orch-skill-implement",
            copy("development-orchestrator", "development-orchestrator"),
            "skill",
            ".agents/skills/development-orchestrator/SKILL.md",
            ["codex"],
            copy(
              "Carries the same single-writer execution policy and bounded packets into Codex-native execution.",
              "Mang cùng chính sách single-writer và packet có giới hạn vào kiểu execution native của Codex.",
            ),
          ),
          source(
            "implement-reviewers",
            copy("Execution roles", "Vai trò thực thi"),
            "agent",
            ".agents/roles/task-investigator.md",
            ["codex"],
            copy(
              "Read-heavy helpers like `task_investigator` and `dev_plan_reviewer` keep execution aligned with the active plan.",
              "Các trợ thủ đọc nhiều như `task_investigator` và `dev_plan_reviewer` giúp execution luôn bám đúng plan đang chạy.",
            ),
          ),
        ],
      }),
    ],
  },
  {
    id: "review-testing",
    title: copy("Review + Testing", "Review + Kiểm thử"),
    shortLabel: copy("04", "04"),
    summary: copy(
      "Finish the loop with review, validation, and sync. This phase explains why orchestrated workflows feel safer on real delivery work.",
      "Khép vòng lặp bằng review, validation và sync. Giai đoạn này cho thấy vì sao workflow có orchestration an toàn hơn trong công việc giao hàng thực tế.",
    ),
    caption: copy(
      "The last node merges review and testing in the hero rail, but the cards still show the distinct artifacts that police quality and sync.",
      "Node cuối gộp review và testing trên thanh hero, nhưng các card vẫn tách rõ những artifact chịu trách nhiệm giữ chất lượng và đồng bộ.",
    ),
    cards: [
      card({
        id: "basic",
        title: copy("Basic", "Basic"),
        summary: copy(
          "Quality checks are still available, but users stay in a prompt-first loop and trigger review-oriented skills only when needed.",
          "Các bước kiểm tra chất lượng vẫn sẵn sàng, nhưng user vẫn ở trong vòng lặp prompt-first và chỉ gọi skill thiên về review khi cần.",
        ),
        useCase: copy(
          "Use this when you want a lightweight sanity check after a bounded change without standing up a full test workflow.",
          "Dùng khi bạn muốn một lượt kiểm tra nhanh sau thay đổi có phạm vi rõ mà không phải dựng cả workflow test.",
        ),
        benefit: copy(
          "Fast feedback with low ceremony. Good for early polish, spot checks, and small iterations.",
          "Phản hồi nhanh với ít thủ tục. Hợp cho giai đoạn tinh chỉnh sớm, spot check và các vòng lặp nhỏ.",
        ),
        accent: "cyan",
        tools: ["codex"],
        graph: {
          nodes: [
            {
              id: "code",
              label: copy("Code", "Code"),
              x: 12,
              y: 50,
              emphasis: "primary",
            },
            {
              id: "review",
              label: copy("Review", "Review"),
              x: 48,
              y: 24,
              emphasis: "primary",
            },
            {
              id: "check",
              label: copy("Check", "Kiểm tra"),
              x: 82,
              y: 50,
              emphasis: "primary",
            },
          ],
          edges: [
            { from: "code", to: "review" },
            { from: "review", to: "check" },
          ],
        },
        sources: [
          source(
            "review-plan-skill",
            copy("review-plan", "review-plan"),
            "skill",
            ".agents/skills/review-plan/SKILL.md",
            ["codex"],
            copy(
              "Keeps planning and implementation aligned by reviewing the active plan before or after a change.",
              "Giữ planning và implementation khớp nhau bằng cách review plan đang dùng trước hoặc sau thay đổi.",
            ),
          ),
          source(
            "quality-skill",
            copy("quality-code-check", "quality-code-check"),
            "skill",
            ".agents/skills/quality-code-check/SKILL.md",
            ["codex"],
            copy(
              "Focuses on linting, type checking, and validation debugging when quality work becomes the main task.",
              "Tập trung vào linting, type checking và gỡ lỗi validation khi công việc về chất lượng trở thành trọng tâm.",
            ),
          ),
        ],
      }),
      card({
        id: "advanced",
        title: copy("Advanced", "Advanced"),
        summary: copy(
          "Review and testing happen through explicit commands, keeping the user in control of which validation lens runs next.",
          "Review và testing diễn ra qua command tường minh, giúp user kiểm soát bước validation nào sẽ chạy tiếp.",
        ),
        useCase: copy(
          "Use this when you want to separate review, testing, and implementation checks instead of delegating everything to an orchestrator.",
          "Dùng khi bạn muốn tách riêng review, testing và kiểm tra implementation thay vì giao hết cho orchestrator.",
        ),
        benefit: copy(
          "More explicit than basic mode and easier to audit step by step, especially in teams that prefer command-driven rituals.",
          "Rõ ràng hơn basic mode và dễ audit từng bước, nhất là với team chuộng quy trình dựa trên command.",
        ),
        accent: "blue",
        tools: ["claude"],
        graph: {
          nodes: [
            {
              id: "review-cmd",
              label: copy("Review", "Review"),
              x: 10,
              y: 50,
              emphasis: "primary",
            },
            {
              id: "tests",
              label: copy("Tests", "Kiểm thử"),
              x: 48,
              y: 24,
              emphasis: "primary",
            },
            {
              id: "report",
              label: copy("Report", "Báo cáo"),
              x: 84,
              y: 50,
              emphasis: "primary",
            },
          ],
          edges: [
            { from: "review-cmd", to: "tests" },
            { from: "tests", to: "report" },
          ],
        },
        sources: [
          source(
            "code-review-command",
            copy("/code-review", "/code-review"),
            "command",
            ".claude/commands/code-review.md",
            ["claude"],
            copy(
              "Runs a review-specific workflow when the user wants findings first instead of implementation chatter.",
              "Chạy workflow chuyên cho review khi user muốn xem findings trước thay vì trao đổi thiên về implementation.",
            ),
          ),
          source(
            "run-test-command",
            copy("/run-test", "/run-test"),
            "command",
            ".claude/commands/run-test.md",
            ["claude"],
            copy(
              "Executes the project-native test workflow using the smallest useful scope first.",
              "Thực thi workflow test gốc của project theo nguyên tắc bắt đầu từ phạm vi nhỏ nhưng hữu ích nhất.",
            ),
          ),
          source(
            "check-implementation-review",
            copy("/check-implementation", "/check-implementation"),
            "command",
            ".claude/commands/check-implementation.md",
            ["claude"],
            copy(
              "Bridges the gap between finished code and the plan or requirement it was supposed to satisfy.",
              "Nối khoảng cách giữa code đã hoàn thành với plan hoặc requirement mà nó cần đáp ứng.",
            ),
          ),
        ],
      }),
      card({
        id: "power",
        title: copy("Power", "Power"),
        summary: copy(
          "Validation becomes a routed system with dedicated analysis, authored test artifacts, and explicit verification verdicts.",
          "Validation trở thành một hệ được route rõ ràng với bước phân tích riêng, test artifact được tạo ra và kết luận verification minh bạch.",
        ),
        useCase: copy(
          "Use this when testing and verification are first-class workstreams, not just a final button press after coding.",
          "Dùng khi testing và verification là những luồng công việc ngang hàng, không chỉ là nút bấm cuối sau khi code xong.",
        ),
        benefit: copy(
          "Strongest safety net. The workflow can explain not only whether a check failed, but which stage owns the gap and how to resume safely.",
          "Lớp an toàn mạnh nhất. Workflow không chỉ cho biết việc kiểm tra có thất bại hay không mà còn chỉ rõ bước nào sở hữu vấn đề và cách tiếp tục an toàn.",
        ),
        accent: "amber",
        tools: ["claude", "codex"],
        graph: {
          nodes: [
            {
              id: "analyze",
              label: copy("Analyze", "Phân tích"),
              x: 8,
              y: 54,
              emphasis: "primary",
            },
            {
              id: "author",
              label: copy("Author", "Soạn"),
              x: 34,
              y: 24,
              emphasis: "primary",
            },
            {
              id: "run",
              label: copy("Run", "Chạy"),
              x: 62,
              y: 54,
              emphasis: "primary",
            },
            {
              id: "verify",
              label: copy("Verify", "Xác minh"),
              x: 90,
              y: 28,
              emphasis: "primary",
            },
          ],
          edges: [
            { from: "analyze", to: "author" },
            { from: "author", to: "run" },
            { from: "run", to: "verify" },
          ],
        },
        sources: [
          source(
            "test-web-orch-command",
            copy("/test-web-orchestrator", "/test-web-orchestrator"),
            "command",
            ".claude/commands/test-web-orchestrator.md",
            ["claude"],
            copy(
              "Coordinates browser-based web testing from spec, plan, runtime, and verification inputs.",
              "Điều phối kiểm thử web trên trình duyệt từ spec, plan, runtime và các đầu vào verification.",
            ),
          ),
          source(
            "test-web-orch-skill",
            copy("test-web-orchestrator", "test-web-orchestrator"),
            "skill",
            ".agents/skills/test-web-orchestrator/SKILL.md",
            ["codex"],
            copy(
              "Codex-native mirror for the same multi-agent testing control plane.",
              "Bản native cho Codex của cùng control plane kiểm thử đa agent.",
            ),
          ),
          source(
            "verify-agents",
            copy("Verification agents", "Agent xác minh"),
            "agent",
            ".codex/agents/dev-verifier.toml",
            ["codex"],
            copy(
              "Named agents like `dev_verifier`, `test_web_analyst`, and `test_web_verifier` turn validation into an explainable pipeline.",
              "Các agent đặt tên sẵn như `dev_verifier`, `test_web_analyst` và `test_web_verifier` biến validation thành một pipeline dễ giải thích.",
            ),
          ),
        ],
      }),
    ],
  },
];

export const workflowGraphCount = workflowPhases.reduce((count, phase) => {
  return count + phase.cards.length;
}, 0);
