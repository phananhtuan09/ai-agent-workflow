# Fix Handoff Templates

Two outputs come from one source: a block written into the verification artifact, and a paste-ready prompt printed on request.

| Output | Written by | When |
|---|---|---|
| artifact block | the verify run, in its report phase | while the evidence is still fresh |
| paste-ready prompt | `handoff` | on request, printed to the response only |

`handoff` is read-only.
It never writes the artifact block, never edits the checklist, and never re-runs a testcase.

If `handoff` finds no block for a confirmed failure, report that and let the human re-run `/verify-workflow`.
Do not reconstruct a reproduction path after the fact; the browser context and dataset that produced the failure are gone by then.

The prompt must never contain information the block does not already carry, because the fix session reads the block, not the prompt.

## Success Condition

A fresh fix session with no memory of this run must reproduce the failure on its first attempt.

`fix-bug` starts by clarifying bug shape and then reproducing.
If it cannot reproduce, it drops to low confidence and either stops to ask or proceeds speculatively.
Every field below exists to prevent that.

## Artifact Block — Confirmed Failure

The verify run appends this into `docs/ai/features/verifications/{feature-slug}.md` in its report phase, not on `handoff`.
Keep headings in English and descriptions in Vietnamese.

````markdown
## Fix Handoff — {TC-ID}

**Verdict:** CONFIRMED FAILURE
**Oracle:** {spec path → AC id | Bug Fix Summary path | intent do người dùng nêu}
**Severity:** {Major | Minor} — {hệ quả với người dùng}

### Bug shape
- **Expected:** {kết quả đúng, trích từ oracle}
- **Actual:** {điều thực tế xảy ra, kèm số liệu quan sát được}
- **Trigger:** {input, state, hoặc trình tự chính xác; nêu rõ có phụ thuộc role/viewport hay không}
- **Repro stability:** {n}/{n} lần

### Reproduction path
1. {bước chạy được, kèm lệnh nếu có}
2. {điều kiện dữ liệu cần có}
3. {hành động}
4. {quan sát}

### Environment
- Branch / commit: {branch} @ {sha}
- Base URL: {url}
- Browser / viewport: {browser}, {WxH}
- Role: {role hoặc guest}
- Dataset: {seed, fixture, hoặc dữ liệu cần chuẩn bị}

### Observed evidence
- Request:  {method url}
- Response: {status} — {body ngắn}
- Console:  {error và vị trí}
- Screenshot: {path}
- Network:  {path}

### Observed surfaces — chưa xác nhận nguyên nhân
- {file:line từ stack trace hoặc endpoint quan sát được}

Test module không phân tích underlying cause; đó là `fix-bug` step 3.

### Must not break
{danh sách id đang 🟢}

{giới hạn phạm vi fix, một câu}

### Re-verify
```
/verify-workflow {feature-slug}
```
````

Rules:

- Fill every field or state why it is unknown.
- Never write a clean reproduction path for a failure that reproduced intermittently; write the real ratio instead.
- Never assert a root cause. `Observed surfaces` holds only what a stack trace, response body, or network record showed.
- `Must not break` lists the ids currently `VERIFIED`, which the next run re-checks.

## Artifact Block — Insufficient Evidence

````markdown
## Evidence Gap — {TC-ID}

**Verdict:** UNVERIFIED — không phải lỗi đã xác nhận.
**Không giao cho session fix.** Chưa có bằng chứng nào nói code sai.

- **Cần chứng minh:** {required evidence chưa đạt}
- **Đã thu được:** {evidence đã có}
- **Thiếu:** {gate missing, nguyên văn}
- **Vì sao chưa kết luận được:** {hai khả năng mà evidence hiện tại không phân biệt được}
- **Cần người xác nhận:** {việc cụ thể human phải làm}
- Evidence: {path}
````

## Prompt — Confirmed Failure

Print on `handoff`.
One prompt per confirmed failure, or one combined prompt when several failures share the same surface.

```text
/fix-bug
Đọc docs/ai/features/verifications/{feature-slug}.md, mục
"Fix Handoff — {TC-ID}", và fix theo đó.

Tóm tắt: {một câu, actual vs expected, kèm số liệu}
Repro: {một câu, trích từ Reproduction path}
Không được phá: {danh sách id đang 🟢}

Sau khi fix xong tôi sẽ chạy lại /verify-workflow {feature-slug}.
```

## Prompt — Missing Spec Scope

Use when the failure is scope the approved spec required but the implementation never delivered.

```text
/execute-spec
Đọc docs/ai/features/specs/{feature-slug}.md và
docs/ai/features/verifications/{feature-slug}.md, mục "Fix Handoff — {TC-ID}".

Phần còn thiếu: {AC id} — {mô tả ngắn}
Không được phá: {danh sách id đang 🟢}

Sau khi xong tôi sẽ chạy lại /verify-workflow {feature-slug}.
```

## No Prompt

For `INSUFFICIENT_EVIDENCE` and `ORACLE_UNCLEAR`, emit no fix prompt.

Return instead:

```text
{TC-ID} chưa giao được cho session fix: {lý do một câu}
Bạn cần: {việc cụ thể}
Chi tiết: docs/ai/features/verifications/{feature-slug}.md
```
