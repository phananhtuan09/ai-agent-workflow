# Brainstorm: Lifecycle Modules

Date: 2026-05-17

## Context

Workflow hiện tại đã giải quyết tốt **Development Phase**.
Buổi brainstorm này mở rộng tư duy theo hướng module hóa toàn bộ software lifecycle.

---

## Core Insight

AI agent không có context tự nhiên — mỗi conversation là tờ giấy trắng.
Mỗi module giải quyết một loại "loss" khác nhau:

| Loss | Module |
|------|--------|
| Context loss (không biết intent) | Discovery + Release |
| Urgency loss (không biết severity) | Operations |
| Time loss (không thấy decay) | Maintenance |
| Knowledge loss (không transfer được) | Onboarding |

---

## Full Lifecycle Overview

```
Discovery → Development ✅ → Release → Operations → Maintenance
                                              ↑
                                         Onboarding (parallel)
```

---

## Các Module Đề Xuất

### Discovery
**Vì sao cần:** Agent làm theo assumption của nó nếu không có structured input.
Ép externalize thinking trước khi vào spec.

Commands:
- `/brainstorm` — structured ideation, so sánh approaches, không sinh artifact nặng
- `/spike` — time-boxed research, output ≤20 lines: findings + recommendation
- `/adr` — lưu architectural decision + reasoning cho các conversation sau

Agents:
- `review-brief` — validate idea đủ clear để vào create-spec chưa

Liên kết Development: brief đủ rõ → `/create-spec`

---

### Release
**Vì sao cần:** Agent đã đọc spec+plan+summary suốt development — tận dụng context đó
thay vì viết PR tay mất 10 phút và thường thiếu context.

Commands:
- `/pr-description` — đọc spec+plan+summary → sinh PR body (zero extra exploration)
- `/release-checklist` — checklist trước merge
- `/changelog` — tổng hợp nhiều specs → release notes

Agents:
- `review-release` — validate checklist đủ chưa

Liên kết Development: verify-feature done → `/pr-description` → `/release-checklist` → merge

---

### Operations
**Vì sao cần:** Production bug có urgency khác hẳn development bug.
`/fix-bug` không được design cho emergency context.

Commands:
- `/investigate` — triage trước, narrow scope: "bug ở đâu đó" → "bug ở file X, function Y"
- `/hotfix` — constrained workflow: skip enrich, minimal change, rollback plan bắt buộc
- `/postmortem` — convert incident thành learning, template cố định

Agents:
- `review-hotfix` — check rollback plan có không trước khi execute

Liên kết Development: postmortem action items → `/create-spec` hoặc `/fix-bug`

---

### Maintenance
**Vì sao cần:** Tech debt tích lũy từng file một, agent chỉ thấy file đang đọc.
Cần mandate rõ ràng để nhìn toàn bộ codebase với lens debt.

Commands:
- `/debt-scan` — inventory debt, categorize, prioritize (spawn Explore agent, không fix gì)
- `/dep-upgrade` — audit outdated/vulnerable deps, plan upgrade
- `/deprecate` — có migration path + timeline, khác `/delete-feature`

Liên kết Development: debt inventory → `/create-plan "Refactor: ..."`

---

### Onboarding
**Vì sao cần:** Knowledge nằm trong đầu người, không tự transfer sang người mới.
Agent đọc từng file không có big picture.

Commands:
- `/onboard` — synthesize project knowledge thành narrative
- `/explain-domain` — explain một business area, không phải một file

Agents:
- `explore-domain` — map toàn bộ files liên quan đến domain trước khi explain

---

## Artifact Design (theo `AI_WORKFLOW_RULES.md`)

| Module | Artifact | Giới hạn |
|--------|----------|----------|
| Discovery | `docs/ai/briefs/{name}.md` | ≤20 lines |
| Discovery | `docs/ai/decisions/{date}-{name}.md` | ≤30 lines |
| Discovery | `docs/ai/spikes/{name}.md` | ≤20 lines |
| Release | PR description (stdout) | ≤50 lines |
| Release | `docs/ai/changelogs/{version}.md` | ≤50 lines |
| Operations | `docs/ai/postmortems/{date}-{name}.md` | ≤40 lines |
| Maintenance | `docs/ai/debt/{date}-scan.md` | ≤60 lines |
| Onboarding | `docs/ai/onboarding/{domain}.md` | ≤60 lines |

---

## `AI_WORKFLOW_RULES.md` Constraints cho Module Mới

1. Mỗi module chỉ được đọc artifacts đã tồn tại — không tự explore khi có file sẵn
2. Mỗi module có một artifact output duy nhất — không sinh nhiều files từ 1 command
3. Mỗi module kết thúc bằng human decision point — không auto-chain sang module khác

---

## Build Priority (Rule 3: Add Only What Is Used)

```
Tier 1 — Build ngay:
  Release Module (/pr-description, /changelog)
  → dùng mỗi khi merge, prove utility rõ ràng

Tier 2 — Build khi encounter vấn đề thực tế:
  Discovery (/adr)
  Operations (/hotfix, /investigate)

Tier 3 — Build khi có team:
  Onboarding Module
  Maintenance Module
```

---

## Open Questions

- Solo hay team? → quyết định Onboarding và Maintenance priority
- Có production deployment không? → quyết định Operations priority
- Có cần `/brainstorm` là command riêng hay dùng output-style `brainstorm-partner` sẵn có?
