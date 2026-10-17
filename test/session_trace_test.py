import json
import runpy
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / "skills/workflow-evaluation/extract_session_trace.py"
MODULE = runpy.run_path(str(SCRIPT), run_name="session_trace_test")


def response(kind, **payload):
    return {"type": "response_item", "timestamp": "2026-10-16T09:00:00Z",
            "payload": {"type": kind, **payload}}


class SessionTraceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="session-trace-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.project = self.root / "project"
        self.project.mkdir()
        self.roots = {"CODEX_HOME": self.root / "codex", "CLAUDE_CONFIG_DIR": self.root / "claude",
                      "PASEO_HOME": self.root / "paseo"}
        # Patch root resolution rather than touching the user's runtime configuration.
        globals_ = MODULE["discover_transcripts"].__globals__
        self.root_patch = patch.dict(globals_, {"local_root": lambda variable, default: self.roots[variable]})
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)

    def write(self, path, records):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("".join(json.dumps(record) + "\n" for record in records), encoding="utf-8")
        return path

    def codex_records(self, session_id="session", cwd=None):
        return [
            {"type": "session_meta", "payload": {"id": session_id, "cwd": str(cwd or self.project)}},
            response("custom_tool_call", call_id="custom", name="exec",
                     input='await tools.exec_command({cmd: "false"})'),
            response("custom_tool_call_output", call_id="custom", output=[
                {"type": "input_text", "text": '{"exit_code": 1, "output": "failed"}'},
                {"type": "input_text", "text": "Warning: truncated output (original token count: 500)"},
            ]),
            response("function_call", call_id="function", name="exec_command", arguments='{"cmd":"pwd"}'),
            response("function_call_output", call_id="function", output="/project"),
            response("message", role="assistant", phase="final", content=[{"type": "output_text", "text": "Done"}]),
        ]

    def test_cli_preserves_custom_and_function_tools_and_reports_limits(self):
        records = self.codex_records() + [
            response("custom_tool_call", call_id="pending", name="exec", input="pending"),
            response("function_call_output", call_id="orphan", output="orphan result"),
            response("future_tool_event", content=[]),
            response("message", role="user", content=[{"type": "input_image", "image_url": "opaque"}]),
            {"type": "compacted", "payload": {}},
        ]
        source = self.write(self.root / "input.jsonl", records)
        result = subprocess.run([sys.executable, "-B", str(SCRIPT), "--runtime", "codex", "--input", str(source),
                                 "--output-dir", str(self.root / "output")], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        trace = json.loads((self.root / "output/session-trace.json").read_text())
        tools = trace["session_trace"]["tool_call_trace"]
        self.assertEqual(tools[0]["input"], records[1]["payload"]["input"])
        self.assertEqual(tools[1]["output"], records[2]["payload"]["output"])
        self.assertEqual(tools[3]["output"], "/project")
        self.assertEqual(trace["session_trace"]["handoff_notes"][0]["message"], "Done")
        coverage = trace["coverage"]
        self.assertEqual(coverage["raw_tool_calls"], 3)
        self.assertEqual(coverage["preserved_tool_calls"], 3)
        self.assertEqual(coverage["preserved_tool_results"], 3)
        self.assertEqual(coverage["missing_tool_event_indices"], [])
        self.assertEqual(coverage["calls_without_results"], ["pending"])
        self.assertEqual(coverage["results_without_calls"], ["orphan"])
        self.assertEqual(coverage["truncation_marker_indices"], [2])
        self.assertEqual(coverage["omitted_media_indices"], [9])
        self.assertEqual(coverage["compaction_indices"], [10])
        self.assertIn("response_item/future_tool_event", coverage["records_without_trace_entries"])
        self.assertEqual(coverage["session_completion"], "unknown")

    def test_discovery_includes_archives_without_project_prefix_collisions(self):
        records = self.codex_records()
        records[0]["payload"]["session_id"] = records[0]["payload"].pop("id")
        archived = self.write(self.roots["CODEX_HOME"] / "archived_sessions/session.jsonl", records)
        self.write(self.roots["CODEX_HOME"] / "sessions/other.jsonl",
                   self.codex_records("other", self.root / "project-other"))
        found, _ = MODULE["discover_transcripts"]("codex", str(self.project))
        self.assertEqual([item["transcript_path"] for item in found], [str(archived)])
        self.assertTrue(found[0]["archived"])
        self.assertEqual(found[0]["session_id"], "session")
        self.assertEqual(MODULE["find_latest_transcript"]("codex", str(self.project)), archived)

    def test_claude_discovery_reads_cwd_after_queue_records(self):
        source = self.write(self.roots["CLAUDE_CONFIG_DIR"] / "projects/arbitrary-folder/source.jsonl", [
            {"type": "queue-operation", "sessionId": "claude"},
            {"type": "user", "sessionId": "claude", "cwd": str(self.project), "message": {"content": "hello"}},
        ])
        found, _ = MODULE["discover_transcripts"]("claude", str(self.project))
        self.assertEqual([item["transcript_path"] for item in found], [str(source)])

    def test_paseo_resolves_provider_session_and_surfaces_unavailable_sources(self):
        source = self.write(self.roots["CODEX_HOME"] / "archived_sessions/session.jsonl", self.codex_records())
        root = self.roots["PASEO_HOME"] / "agents/project"
        root.mkdir(parents=True)
        for aid, provider, sid in [("agent", "codex", "session"), ("missing", "codex", "missing"),
                                   ("unsupported", "other", "other")]:
            (root / (aid + ".json")).write_text(json.dumps({
                "id": aid, "provider": provider, "cwd": str(self.project), "lastStatus": "closed",
                "persistence": {"sessionId": sid}, "archivedAt": "2026-10-16T10:00:00Z",
            }))
        found, _ = MODULE["discover_paseo"](str(self.project))
        by_id = {item["paseo"]["agent_id"]: item for item in found}
        self.assertEqual(by_id["agent"]["transcript_path"], str(source))
        self.assertTrue(by_id["agent"]["available"])
        self.assertFalse(by_id["missing"]["available"])
        self.assertFalse(by_id["unsupported"]["available"])
        self.assertEqual(MODULE["discover_paseo"](str(self.root / "different"))[0], [])
        with patch.object(sys, "argv", [str(SCRIPT), "--runtime", "paseo", "--project", str(self.project),
                                      "--session-id", "agent", "--output-dir", str(self.root / "output")]):
            from io import StringIO
            with patch("sys.stdout", new_callable=StringIO):
                MODULE["main"]()
        artifact = json.loads((self.root / "output/session-trace.json").read_text())
        self.assertEqual(artifact["runtime"], "codex")
        self.assertEqual(artifact["source"]["paseo"]["agent_id"], "agent")
        self.assertEqual(artifact["coverage"]["preserved_tool_results"], 2)
        # Two copies cannot silently choose the wrong evidence source.
        self.write(self.roots["CODEX_HOME"] / "sessions/copy.jsonl", self.codex_records())
        found, _ = MODULE["discover_paseo"](str(self.project))
        self.assertEqual(next(x for x in found if x["paseo"]["agent_id"] == "agent")["unavailable_reason"],
                         "ambiguous_transcript")

    def test_paseo_claude_parent_resolves_despite_subagent_transcripts(self):
        user = {"type": "user", "sessionId": "claude", "cwd": str(self.project), "message": {"content": "hello"}}
        parent = self.write(self.roots["CLAUDE_CONFIG_DIR"] / "projects/p/claude.jsonl", [user])
        self.write(self.roots["CLAUDE_CONFIG_DIR"] / "projects/p/claude/subagents/agent-1.jsonl",
                   [dict(user, isSidechain=True)])
        agents = self.roots["PASEO_HOME"] / "agents/project"
        agents.mkdir(parents=True)
        (agents / "agent.json").write_text(json.dumps({
            "id": "agent", "provider": "claude", "cwd": str(self.project), "persistence": {"sessionId": "claude"},
        }))
        found, _ = MODULE["discover_paseo"](str(self.project))
        self.assertTrue(found[0]["available"])
        self.assertEqual(found[0]["transcript_path"], str(parent))

    def test_unmatched_codex_web_search_is_reported(self):
        records = [
            {"type": "session_meta", "payload": {"id": "s", "cwd": str(self.project)}},
            {"type": "event_msg", "payload": {"type": "web_search_call", "call_id": "search", "query": "q"}},
        ]
        source = self.write(self.root / "input.jsonl", records)
        result = subprocess.run([sys.executable, "-B", str(SCRIPT), "--runtime", "codex", "--input", str(source),
                                 "--output-dir", str(self.root / "output")], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        coverage = json.loads((self.root / "output/session-trace.json").read_text())["coverage"]
        self.assertEqual(coverage["raw_tool_calls"], 1)
        self.assertEqual(coverage["calls_without_results"], ["search"])

    def test_claude_preserves_errors_model_and_usage_without_claiming_completion(self):
        records = [
            {"type": "assistant", "message": {"model": "example-model", "usage": {"input_tokens": 12},
             "content": [{"type": "tool_use", "id": "call", "name": "Bash", "input": {"command": "false"}}]}},
            {"type": "user", "message": {"content": [{"type": "tool_result", "tool_use_id": "call",
                                                        "content": "failure", "is_error": True}]}},
        ]
        artifact = MODULE["parse_claude_transcript"](records, self.root / "claude.jsonl")
        MODULE["assess_coverage"](artifact, records)
        self.assertEqual(artifact["session"]["model"], "example-model")
        self.assertEqual(artifact["session_trace"]["artifact_trail"][0]["usage"], {"input_tokens": 12})
        self.assertEqual(len(artifact["session_trace"]["failure_retry_log"]), 1)
        self.assertEqual(artifact["coverage"]["preserved_tool_results"], 1)
        self.assertEqual(artifact["coverage"]["session_completion"], "unknown")

    def test_inventory_writes_nothing_and_keeps_discovery_failures_visible(self):
        root = self.roots["CODEX_HOME"] / "sessions"
        self.write(root / "good.jsonl", self.codex_records())
        (root / "bad.jsonl").write_text("{invalid")
        (root / "wrong-shape.jsonl").write_text("null\n")
        before = set(self.root.rglob("*"))
        with patch.object(sys, "argv", [str(SCRIPT), "--list", "--runtime", "codex", "--project", str(self.project)]):
            from io import StringIO
            with patch("sys.stdout", new_callable=StringIO) as output:
                MODULE["main"]()
                inventory = json.loads(output.getvalue())
        self.assertEqual(len(inventory["sessions"]), 1)
        self.assertTrue(any(issue["reason"] == "JSONDecodeError" for issue in inventory["issues"]))
        self.assertTrue(any(issue["reason"] == "AttributeError" for issue in inventory["issues"]))
        self.assertEqual(before, set(self.root.rglob("*")))

    def test_malformed_snapshot_fails_without_partial_artifacts(self):
        source = self.root / "partial.jsonl"
        source.write_text('{"type":"session_meta"}\n{"type":')
        output = self.root / "output"
        result = subprocess.run([sys.executable, "-B", str(SCRIPT), "--runtime", "codex", "--input", str(source),
                                 "--output-dir", str(output)], capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("JSONL line 2", result.stderr)
        self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
