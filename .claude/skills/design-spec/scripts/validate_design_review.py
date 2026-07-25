#!/usr/bin/env python3
"""Validate the human-facing design review HTML before serving it."""

from __future__ import annotations

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


KEBAB_CASE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DECISION_ID = re.compile(r"^D-\d{3}$")
WORD = re.compile(r"\b[\wÀ-ỹ]+\b", re.UNICODE)
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
OUTPUT_KINDS = {"ui", "api", "full-stack", "workflow", "data", "generic"}


class ReviewParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.root: dict[str, str | None] | None = None
        self.stack: list[str] = []
        self.skip_depth = 0
        self.details_depth = 0
        self.capture: dict[str, tuple[int, list[str]]] = {}
        self.captured_values: dict[str, str] = {}
        self.scope_context: tuple[int, str] | None = None
        self.output_context: tuple[int, str] | None = None
        self.scope_counts = {"in": 0, "out": 0}
        self.output_counts = {"deliverables": 0, "primary_interfaces": 0, "observable_results": 0}
        self.output_preview_found = False
        self.output_kind = ""
        self.flow_nodes: list[dict[str, str]] = []
        self.required_decisions: dict[str, dict[str, Any]] = {}
        self.feedback_targets: set[str] = set()
        self.visible_words = 0
        self.has_approval_button = False
        self.has_changes_button = False
        self.has_live_status = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "html" and self.root is None:
            self.root = attributes

        if tag in {"script", "style"}:
            self.skip_depth += 1
        if tag == "details":
            self.details_depth += 1

        if "data-design-goal" in attributes:
            self.capture["goal"] = (len(self.stack), [])
        if "data-target-user" in attributes:
            self.capture["target_user"] = (len(self.stack), [])
        if "data-current-problem" in attributes:
            self.capture["current_problem"] = (len(self.stack), [])
        if "data-output-summary" in attributes:
            self.capture["output_summary"] = (len(self.stack), [])
        if "data-output-preview" in attributes:
            self.output_preview_found = True
            self.output_kind = (attributes.get("data-preview-kind") or "").strip()

        scope = attributes.get("data-scope-list")
        if scope in {"in", "out"}:
            self.scope_context = (len(self.stack) + 1, scope)
        output_list = attributes.get("data-output-list")
        if output_list in self.output_counts:
            self.output_context = (len(self.stack) + 1, output_list)
        if tag == "li" and self.scope_context and len(self.stack) >= self.scope_context[0]:
            self.scope_counts[self.scope_context[1]] += 1
        if tag == "li" and self.output_context and len(self.stack) >= self.output_context[0]:
            self.output_counts[self.output_context[1]] += 1
        if "data-flow-node" in attributes:
            self.flow_nodes.append(
                {
                    "label": (attributes.get("data-flow-label") or "").strip(),
                    "description": (attributes.get("data-flow-description") or "").strip(),
                }
            )

        if tag == "fieldset" and "decision-card" in (attributes.get("class") or "").split() and attributes.get("data-required") == "true":
            decision_id = (attributes.get("data-decision-id") or "").strip()
            if decision_id in self.required_decisions:
                self.required_decisions[decision_id]["duplicate"] = True
            else:
                self.required_decisions[decision_id] = {"question": (attributes.get("data-question") or "").strip(), "options": 0}
        if tag == "input" and attributes.get("type") == "radio":
            decision_id = attributes.get("name") or ""
            if decision_id in self.required_decisions:
                self.required_decisions[decision_id]["options"] += 1

        target = attributes.get("data-feedback-target")
        if target:
            self.feedback_targets.add(target)
        self.has_approval_button |= attributes.get("id") == "approve-design"
        self.has_changes_button |= attributes.get("id") == "request-changes"
        self.has_live_status |= "aria-live" in attributes

        if tag not in VOID_TAGS:
            self.stack.append(tag)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"} and self.skip_depth:
            self.skip_depth -= 1
        if tag == "details" and self.details_depth:
            self.details_depth -= 1
        if self.scope_context and len(self.stack) == self.scope_context[0] and self.stack[-1] == tag:
            self.scope_context = None
        if self.output_context and len(self.stack) == self.output_context[0] and self.stack[-1] == tag:
            self.output_context = None
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()

        finished = [key for key, (depth, _) in self.capture.items() if depth == len(self.stack)]
        for key in finished:
            _, values = self.capture.pop(key)
            self.captured_values[key] = " ".join(values).strip()

    def handle_data(self, data: str) -> None:
        if self.skip_depth:
            return
        if self.details_depth == 0:
            self.visible_words += len(WORD.findall(data))
        for _, (_, values) in self.capture.items():
            values.append(data)


def validate_review(path: Path) -> dict[str, Any]:
    source = path.read_text(encoding="utf-8")
    errors: list[str] = []
    warnings: list[str] = []
    if "REPLACE_" in source:
        errors.append("design HTML still contains REPLACE_ placeholders")

    parser = ReviewParser()
    parser.feed(source)
    if parser.root is None:
        errors.append("design HTML must contain an html root element")
    else:
        slug = (parser.root.get("data-feature-slug") or "").strip()
        if not KEBAB_CASE.fullmatch(slug):
            errors.append("HTML data-feature-slug must be kebab-case")
        if not (parser.root.get("data-design-revision") or "").strip():
            errors.append("HTML data-design-revision is required")

    if not parser.captured_values.get("goal"):
        errors.append("design HTML must contain a non-empty data-design-goal")
    if not parser.captured_values.get("target_user"):
        errors.append("design HTML must identify the target user with data-target-user")
    if not parser.captured_values.get("current_problem"):
        errors.append("design HTML must identify the current problem with data-current-problem")
    if not parser.output_preview_found:
        errors.append("design HTML must contain one data-output-preview section")
    if parser.output_kind not in OUTPUT_KINDS:
        errors.append(f"output preview kind must be one of {sorted(OUTPUT_KINDS)}")
    if not parser.captured_values.get("output_summary"):
        errors.append("output preview must contain a non-empty data-output-summary")
    for name, count in parser.output_counts.items():
        if count == 0:
            errors.append(f"output preview {name} must contain at least one item")
    if len(parser.flow_nodes) < 2:
        errors.append("output preview graph must contain at least two flow nodes")
    if len(parser.flow_nodes) > 6:
        errors.append("output preview graph must contain no more than six flow nodes")
    for index, node in enumerate(parser.flow_nodes):
        if not node["label"] or not node["description"]:
            errors.append(f"flow node {index + 1} must contain data-flow-label and data-flow-description")
    if not parser.has_approval_button or not parser.has_changes_button:
        errors.append("design HTML must contain approve and request-changes controls")
    if not parser.has_live_status:
        errors.append("design HTML must contain an aria-live status region")
    if not parser.required_decisions:
        errors.append("design HTML must contain at least one required decision card")
    if len(parser.required_decisions) > 3:
        errors.append("design HTML should contain no more than three required decision cards")
    for decision_id, decision in parser.required_decisions.items():
        if decision.get("duplicate"):
            errors.append(f"duplicate required decision id: {decision_id or '<empty>'}")
        if not DECISION_ID.fullmatch(decision_id):
            errors.append(f"invalid required decision id: {decision_id or '<empty>'}")
        if not decision["question"]:
            errors.append(f"required decision {decision_id or '<empty>'} question is empty")
        if decision["options"] < 1:
            errors.append(f"required decision {decision_id or '<empty>'} must have a radio option")
    if parser.scope_counts["in"] == 0 or parser.scope_counts["out"] == 0:
        errors.append("scope must contain at least one in-scope and one out-of-scope item")
    if parser.visible_words > 700:
        warnings.append(f"initial review content is dense ({parser.visible_words} visible words; target is 700 or fewer)")
    if parser.scope_counts["in"] > 5 or parser.scope_counts["out"] > 5:
        warnings.append("scope has more than five items on one side")
    if any(count > 5 for count in parser.output_counts.values()):
        warnings.append("output preview has more than five items in one list")
    if "D-001" not in parser.feedback_targets:
        warnings.append("decision cards should expose decision-level feedback")

    if errors:
        raise ValueError("; ".join(errors))
    return {
        "valid": True,
        "warnings": warnings,
        "visible_words": parser.visible_words,
        "decision_count": len(parser.required_decisions),
        "output_kind": parser.output_kind,
        "flow_node_count": len(parser.flow_nodes),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("design_path", type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(validate_review(args.design_path), ensure_ascii=False))
    except (OSError, ValueError) as error:
        print(f"invalid: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
