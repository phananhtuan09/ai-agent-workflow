import type { LocalizedCopy, SkillCategoryId, SkillSummary } from "@/types/content";

function copy(en: string, vi: string): LocalizedCopy {
  return { en, vi };
}

export const skillCategoryOrder: SkillCategoryId[] = [
  "planning",
  "orchestration",
  "requirements",
  "frontend",
  "quality"
];

export const skills: SkillSummary[] = [
  {
    id: "brainstorm-partner",
    name: "Brainstorm Partner",
    description: copy(
      "Read-only thinking partner for vague ideas, hard bugs, and unclear logic before implementation.",
      "Người đồng hành chỉ đọc để cùng gỡ ý tưởng mơ hồ, lỗi khó, và logic chưa rõ trước khi bắt đầu implement."
    ),
    category: "requirements",
    tools: ["claude", "codex", "antigravity"],
    tags: ["discovery", "analysis"],
    triggerKeywords: ["brainstorm", "explore options", "hard bug"],
    useCases: [
      copy(
        "Clarify a risky idea before coding",
        "Làm rõ một ý tưởng nhiều rủi ro trước khi code"
      ),
      copy(
        "Compare implementation directions without editing files",
        "So sánh các hướng triển khai mà không đụng vào file"
      )
    ]
  },
  {
    id: "create-plan",
    name: "Create Plan",
    description: copy(
      "Draft or refresh feature planning docs with acceptance criteria, phases, and file targets.",
      "Soạn mới hoặc cập nhật tài liệu feature plan với acceptance criteria, các phase và file mục tiêu."
    ),
    category: "planning",
    tools: ["claude", "codex", "antigravity"],
    tags: ["planning", "docs"],
    triggerKeywords: ["create plan", "feature plan", "implementation plan"],
    useCases: [
      copy(
        "Turn a requirement into an execution-ready plan",
        "Biến requirement thành plan sẵn sàng để triển khai"
      ),
      copy(
        "Refresh a stale feature plan before coding",
        "Làm mới feature plan đã cũ trước khi code"
      )
    ]
  },
  {
    id: "development-orchestrator",
    name: "Development Orchestrator",
    description: copy(
      "Route requirement, epic, and feature-plan work through planning, execution, verification, and sync.",
      "Điều phối requirement, epic và feature plan xuyên suốt planning, execution, verification và sync."
    ),
    category: "orchestration",
    tools: ["claude", "codex", "antigravity"],
    tags: ["orchestration", "planning"],
    triggerKeywords: ["development orchestrator", "implement from req", "route planning"],
    useCases: [
      copy(
        "Drive a large feature from docs to code",
        "Đẩy một feature lớn đi từ tài liệu tới code"
      ),
      copy(
        "Keep requirement, epic, and plan statuses aligned",
        "Giữ trạng thái requirement, epic và plan luôn khớp nhau"
      )
    ]
  },
  {
    id: "execute-plan",
    name: "Execute Plan",
    description: copy(
      "Implement an existing feature plan phase by phase while keeping task checkboxes synced.",
      "Triển khai feature plan hiện có theo từng phase và giữ checkbox công việc luôn đồng bộ."
    ),
    category: "orchestration",
    tools: ["claude", "codex", "antigravity"],
    tags: ["execution", "tracking"],
    triggerKeywords: ["execute plan", "resume phase", "implement plan"],
    useCases: [
      copy(
        "Land the next feature slice without improvising scope",
        "Hoàn thành lát cắt feature tiếp theo mà không làm scope trôi đi"
      ),
      copy(
        "Resume an interrupted implementation safely",
        "Tiếp tục một lần triển khai đang dở dang theo cách an toàn"
      )
    ]
  },
  {
    id: "frontend-design-figma-extraction",
    name: "Figma Extraction",
    description: copy(
      "Extract a Figma frame into a structured requirements doc with exact specs.",
      "Trích một frame Figma thành tài liệu requirements có cấu trúc với thông số chính xác."
    ),
    category: "frontend",
    tools: ["claude", "codex", "antigravity"],
    tags: ["design", "figma"],
    triggerKeywords: ["figma", "design file", "extract mockup"],
    useCases: [
      copy(
        "Convert a frame into implementation specs",
        "Biến một frame thành spec để triển khai"
      ),
      copy(
        "Prepare exact UI guidance before coding",
        "Chuẩn bị hướng dẫn UI chi tiết trước khi code"
      )
    ]
  },
  {
    id: "frontend-design-fundamentals",
    name: "Frontend Design Fundamentals",
    description: copy(
      "Base design guidance for spacing, typography, hierarchy, color, and visual clarity.",
      "Hướng dẫn thiết kế nền tảng cho spacing, typography, phân cấp, màu sắc và độ rõ thị giác."
    ),
    category: "frontend",
    tools: ["claude", "codex", "antigravity"],
    tags: ["frontend", "design"],
    triggerKeywords: ["ui", "css", "layout", "card"],
    useCases: [
      copy(
        "Improve component structure and visual rhythm",
        "Cải thiện cấu trúc component và nhịp thị giác"
      ),
      copy(
        "Choose stronger hierarchy before polishing",
        "Chốt hệ phân cấp rõ hơn trước khi tinh chỉnh"
      )
    ]
  },
  {
    id: "frontend-design-responsive",
    name: "Frontend Design Responsive",
    description: copy(
      "Mobile-first responsive design guidance for breakpoints, fluid layouts, and touch targets.",
      "Hướng dẫn responsive theo hướng mobile-first cho breakpoint, layout linh hoạt và vùng chạm."
    ),
    category: "frontend",
    tools: ["claude", "codex", "antigravity"],
    tags: ["responsive", "mobile"],
    triggerKeywords: ["responsive", "mobile", "tablet"],
    useCases: [
      copy(
        "Plan route layouts for mobile and tablet first",
        "Lên bố cục route ưu tiên cho mobile và tablet trước"
      ),
      copy(
        "Harden touch targets and breakpoint behavior",
        "Làm chắc vùng chạm và hành vi theo breakpoint"
      )
    ]
  },
  {
    id: "frontend-design-theme-factory",
    name: "Theme Factory",
    description: copy(
      "Pick a theme, palette, and typographic direction when the visual direction is still open.",
      "Chọn theme, bảng màu và hướng typography khi định hướng thị giác vẫn còn bỏ ngỏ."
    ),
    category: "frontend",
    tools: ["claude", "codex", "antigravity"],
    tags: ["theme", "branding"],
    triggerKeywords: ["choose colors", "theme", "aesthetic"],
    useCases: [
      copy(
        "Generate a coherent palette before UI work",
        "Tạo một bảng màu thống nhất trước khi làm UI"
      ),
      copy(
        "Resolve an undecided design direction quickly",
        "Chốt nhanh một hướng thiết kế còn đang lưỡng lự"
      )
    ]
  },
  {
    id: "manage-epic",
    name: "Manage Epic",
    description: copy(
      "Track a requirement across multiple feature plans with dependencies and status sync.",
      "Theo dõi một requirement qua nhiều feature plan với phụ thuộc và trạng thái được đồng bộ."
    ),
    category: "planning",
    tools: ["claude", "codex", "antigravity"],
    tags: ["epic", "planning"],
    triggerKeywords: ["manage epic", "epic", "break into slices"],
    useCases: [
      copy(
        "Split a large requirement into implementation slices",
        "Chia một requirement lớn thành các lát cắt triển khai"
      ),
      copy(
        "Keep a multi-plan roadmap aligned with code progress",
        "Giữ roadmap nhiều plan luôn khớp với tiến độ code"
      )
    ]
  },
  {
    id: "prompt-leverage",
    name: "Prompt Leverage",
    description: copy(
      "Upgrade a raw prompt into a stronger execution brief with clearer rules and structure.",
      "Nâng cấp prompt thô thành bản brief triển khai chặt chẽ hơn với quy tắc và cấu trúc rõ ràng."
    ),
    category: "orchestration",
    tools: ["claude", "codex", "antigravity"],
    tags: ["prompting", "workflow"],
    triggerKeywords: ["refine prompt", "execution brief", "prompt leverage"],
    useCases: [
      copy(
        "Tighten a vague request before handing it to an agent",
        "Làm rõ một yêu cầu mơ hồ trước khi giao cho agent"
      ),
      copy(
        "Create a reusable prompting wrapper",
        "Tạo khung prompt có thể tái sử dụng"
      )
    ]
  },
  {
    id: "quality-code-check",
    name: "Quality Code Check",
    description: copy(
      "Focus lint, typecheck, build, and validation work on the smallest useful scope first.",
      "Tập trung lint, typecheck, build và validation vào phạm vi nhỏ hữu ích nhất trước."
    ),
    category: "quality",
    tools: ["claude", "codex", "antigravity"],
    tags: ["quality", "validation"],
    triggerKeywords: ["lint", "typecheck", "build", "validation"],
    useCases: [
      copy(
        "Debug a failing build without broad refactors",
        "Gỡ lỗi build hỏng mà không cần refactor lan rộng"
      ),
      copy(
        "Run project-native quality checks after a feature slice",
        "Chạy các bước kiểm tra chất lượng gốc của project sau mỗi lát cắt feature"
      )
    ]
  },
  {
    id: "react-best-practices",
    name: "React Best Practices",
    description: copy(
      "Guide React and Next.js architecture, rendering behavior, and data-flow decisions.",
      "Định hướng kiến trúc React và Next.js, hành vi render và các quyết định về luồng dữ liệu."
    ),
    category: "frontend",
    tools: ["claude", "codex", "antigravity"],
    tags: ["react", "nextjs"],
    triggerKeywords: ["react", "next.js", "suspense", "rendering"],
    useCases: [
      copy(
        "Fix architectural issues in a React route",
        "Sửa các vấn đề kiến trúc trong một route React"
      ),
      copy(
        "Improve component boundaries and data flow",
        "Cải thiện ranh giới component và luồng dữ liệu"
      )
    ]
  },
  {
    id: "requirements-orchestrator",
    name: "Requirements Orchestrator",
    description: copy(
      "Coordinate BA, SA, UI/UX, and research inputs into a requirement doc.",
      "Điều phối đầu vào từ BA, SA, UI/UX và nghiên cứu để tạo thành requirement doc."
    ),
    category: "requirements",
    tools: ["claude", "codex", "antigravity"],
    tags: ["requirements", "discovery"],
    triggerKeywords: ["requirements orchestrator", "clarify feature", "req doc"],
    useCases: [
      copy(
        "Turn a rough request into a structured requirement",
        "Biến một yêu cầu thô thành requirement có cấu trúc"
      ),
      copy(
        "Collect upstream design and architecture context",
        "Thu thập sớm ngữ cảnh thiết kế và kiến trúc"
      )
    ]
  },
  {
    id: "review-plan",
    name: "Review Plan",
    description: copy(
      "Review a feature planning doc for clarity, completeness, and execution safety.",
      "Rà soát tài liệu feature plan về độ rõ ràng, đầy đủ và an toàn khi triển khai."
    ),
    category: "planning",
    tools: ["claude", "codex", "antigravity"],
    tags: ["review", "planning"],
    triggerKeywords: ["review plan", "plan review", "check feature plan"],
    useCases: [
      copy(
        "Audit a feature plan before coding",
        "Kiểm tra feature plan trước khi bắt đầu code"
      ),
      copy(
        "Catch missing file targets or weak acceptance criteria",
        "Phát hiện file target còn thiếu hoặc acceptance criteria còn yếu"
      )
    ]
  },
  {
    id: "test-web-orchestrator",
    name: "Test Web Orchestrator",
    description: copy(
      "Coordinate bounded browser-based UI testing work from specs, plans, and runtime hints.",
      "Điều phối kiểm thử UI trên trình duyệt theo phạm vi rõ ràng từ spec, plan và runtime hint."
    ),
    category: "quality",
    tools: ["claude", "codex", "antigravity"],
    tags: ["testing", "web"],
    triggerKeywords: ["web ui test", "playwright", "browser test"],
    useCases: [
      copy(
        "Plan browser coverage for a finished page flow",
        "Lên phạm vi kiểm thử trình duyệt cho một luồng trang đã hoàn thiện"
      ),
      copy(
        "Turn specs and runtime access into web test artifacts",
        "Biến spec và quyền truy cập runtime thành artifact kiểm thử web"
      )
    ]
  },
  {
    id: "ux-feedback-patterns",
    name: "UX Feedback Patterns",
    description: copy(
      "Design loading, success, error, and validation feedback flows for interactive UI.",
      "Thiết kế các luồng phản hồi loading, success, error và validation cho UI tương tác."
    ),
    category: "frontend",
    tools: ["claude", "codex", "antigravity"],
    tags: ["ux", "feedback"],
    triggerKeywords: ["loading", "error", "toast", "validation"],
    useCases: [
      copy(
        "Improve copy/callback feedback on action-heavy pages",
        "Cải thiện thông điệp phản hồi trên các trang có nhiều thao tác"
      ),
      copy(
        "Design clearer async states in forms and flows",
        "Thiết kế trạng thái bất đồng bộ rõ ràng hơn trong form và flow"
      )
    ]
  }
];
