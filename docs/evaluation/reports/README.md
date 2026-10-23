# Báo cáo đánh giá workflow

Evaluation artifacts produced by `docs/evaluation/STANDARD.md`.

Mỗi file `docs/evaluation/reports/{name}.html` là một báo cáo HTML tiếng Việt, self-contained. Với workflow improvement, report ưu tiên session behavior, first divergence, rework, recovery, human intervention và cause attribution trước khi map vấn đề về workflow. Với adoption review không có trace, report dùng artifact-first evidence và controlled exercise.

## Audit session hằng tuần (thử nghiệm)

Chế độ weekly session audit của `workflow-evaluation` là experimental; hypothesis, success criteria và flow nằm trong `references/weekly-audit.md` của skill.
Human tự mở một session riêng để chạy audit; không có schedule, cron hay hook.

- `weekly-audit-YYYY-MM-DD.md`: một báo cáo Markdown tiếng Việt cho mỗi lần audit, đặt tên theo ngày kết thúc cửa sổ audit, gồm độ phủ theo project, tối đa 5 phát hiện chính, mức lặp lại so với ledger và tối đa 3 thử nghiệm đề xuất kèm rung của response ladder.
- `findings-ledger.md`: ledger phát hiện dùng chung giữa các lần audit, mỗi phát hiện có ID ổn định, failure mechanism, các lần xuất hiện, status (`new`, `confirmed`, `experimenting`, `resolved`, `recurred`, `rejected`) và verdict của human.
