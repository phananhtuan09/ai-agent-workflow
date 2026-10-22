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
            {"type": "event_msg", "payload": {"type": "web_search_call", "query": "no id"}},
        ]
        source = self.write(self.root / "input.jsonl", records)
        result = subprocess.run([sys.executable, "-B", str(SCRIPT), "--runtime", "codex", "--input", str(source),
                                 "--output-dir", str(self.root / "output")], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        coverage = json.loads((self.root / "output/session-trace.json").read_text())["coverage"]
        self.assertEqual(coverage["raw_tool_calls"], 2)
        self.assertEqual(coverage["calls_without_results"], ["search"])
        self.assertEqual(coverage["tool_events_without_call_id"], [2])

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

    def claude_session(self, folder, session_id, timestamps, texts, cwd=None, path=None, **extra):
        records = [{"type": "user" if index % 2 == 0 else "assistant", "sessionId": session_id,
                    "cwd": str(cwd or self.project), "timestamp": timestamp,
                    "message": {"content": [{"type": "text", "text": text}]}, **extra}
                   for index, (timestamp, text) in enumerate(zip(timestamps, texts))]
        return self.write(path or self.roots["CLAUDE_CONFIG_DIR"] / "projects" / folder / f"{session_id}.jsonl",
                          records)

    def run_triage(self, *args):
        from io import StringIO
        argv = [str(SCRIPT), "--triage", "--since", "2026-10-15T00:00:00+00:00",
                "--until", "2026-10-22T00:00:00+00:00", *args]
        with patch.object(sys, "argv", argv), patch("sys.stdout", new_callable=StringIO) as output:
            MODULE["main"]()
        return json.loads(output.getvalue())

    def test_triage_inventories_projects_by_transcript_time_and_ranks_friction_first(self):
        other = self.root / "other"
        other.mkdir()
        week = ["2026-10-20T09:00:00Z", "2026-10-20T09:05:00Z", "2026-10-20T09:10:00Z", "2026-10-20T09:15:00Z"]
        self.claude_session("p", "noisy", week + ["2026-10-20T09:20:00Z"],
                            ["build it", "Done, implemented.", "that is wrong, redo", "Done.",
                             "[Request interrupted by user]"])
        marked = self.claude_session("p", "marked", week[:2], ["fix tests #friction agent ignored the plan", "ok"])
        with marked.open("a", encoding="utf-8") as handle:
            for block in [{"type": "tool_use", "id": "s", "name": "Skill", "input": {"skill": "planner"}},
                          {"type": "tool_use", "id": "r", "name": "Read",
                           "input": {"file_path": "/x/.claude/skills/review-pr/SKILL.md"}}]:
                handle.write(json.dumps({"type": "assistant", "sessionId": "marked", "timestamp": week[1],
                                         "message": {"content": [block]}}) + "\n")
        # File mtime is recent, but the transcript itself predates the window.
        self.claude_session("p", "old", ["2026-09-01T09:00:00Z"], ["old work"])
        self.claude_session("p", "audit", week[:1], ["run the weekly audit"])
        self.claude_session("p", "noisy", week[:1], ["subagent"], isSidechain=True,
                            path=self.roots["CLAUDE_CONFIG_DIR"] / "projects/p/noisy/subagents/agent-1.jsonl")
        self.claude_session("o", "elsewhere", week[:1], ["other project"], cwd=other)
        agents = self.roots["PASEO_HOME"] / "agents/project"
        agents.mkdir(parents=True)
        for aid, sid, activity in [("wrapper", "noisy", "2026-10-20T09:20:00Z"),
                                   ("lost", "gone", "2026-10-20T09:00:00Z"),
                                   ("stale", "gone-old", "2026-09-01T09:00:00Z")]:
            (agents / f"{aid}.json").write_text(json.dumps({
                "id": aid, "provider": "claude", "cwd": str(self.project), "lastStatus": "closed",
                "lastActivityAt": activity, "persistence": {"sessionId": sid}}))
        before = set(self.root.rglob("*"))
        with patch.dict("os.environ", {"CLAUDE_CODE_SESSION_ID": "", "PASEO_AGENT_ID": ""}):
            result = self.run_triage("--project", str(self.project), "--project", str(other),
                                     "--exclude-session", "audit", "--top", "1")
        self.assertEqual(before, set(self.root.rglob("*")))
        project, second = result["projects"]
        self.assertEqual(sorted(item["session_id"] for item in project["sessions"]), ["marked", "noisy"])
        noisy = next(item for item in project["sessions"] if item["session_id"] == "noisy")
        self.assertEqual([ref["agent_id"] for ref in noisy["paseo_agents"]], ["wrapper"])
        self.assertEqual(noisy["triage"]["interrupts"], 1)
        self.assertEqual(noisy["triage"]["human_after_done_claim"], 1)
        self.assertEqual(project["counts"], {"sessions": 2, "subagents": 1, "excluded": 1, "evidence_gaps": 1,
                                             "unknown_activity": 0, "outside_window": 1, "issues": 0})
        self.assertEqual(project["evidence_gaps"][0]["paseo"]["agent_id"], "lost")
        self.assertEqual([item["session_id"] for item in second["sessions"]], ["elsewhere"])
        ranking = [(item["session_id"], item["friction"], item["deep_dive"]) for item in result["triage"]]
        self.assertEqual(ranking[0], ("marked", True, True))
        self.assertFalse(any(deep for _, _, deep in ranking[1:]))
        self.assertEqual(len(ranking), 3)
        marked = next(item for item in project["sessions"] if item["session_id"] == "marked")
        self.assertEqual(marked["triage"]["friction_notes"][0]["note"], "agent ignored the plan")
        self.assertLess(marked["triage"]["score"], noisy["triage"]["score"])
        self.assertEqual(marked["triage"]["skills_used"], ["planner", "review-pr"])

    def test_triage_excludes_the_running_audit_session_from_the_environment(self):
        self.claude_session("p", "current", ["2026-10-20T09:00:00Z"], ["audit"])
        with patch.dict("os.environ", {"CLAUDE_CODE_SESSION_ID": "current", "PASEO_AGENT_ID": ""}):
            result = self.run_triage("--project", str(self.project))
        self.assertEqual(result["projects"][0]["excluded"][0]["reason"], "audit_session")
        self.assertEqual(result["triage"], [])

    def test_triage_counts_string_messages_once_and_dedupes_projects(self):
        self.write(self.roots["CLAUDE_CONFIG_DIR"] / "projects/p/plain.jsonl", [
            {"type": "user", "sessionId": "plain", "cwd": str(self.project), "timestamp": "2026-10-20T09:00:00Z",
             "message": {"role": "user", "content": "fix it #friction wrong file"}},
            {"type": "assistant", "sessionId": "plain", "cwd": str(self.project), "timestamp": "2026-10-20T09:01:00Z",
             "message": {"role": "assistant", "content": [{"type": "text", "text": "ok"}]}}])
        with patch.dict("os.environ", {"CLAUDE_CODE_SESSION_ID": "", "PASEO_AGENT_ID": ""}):
            result = self.run_triage("--project", str(self.project), "--project", str(self.project) + "/.")
        self.assertEqual(len(result["projects"]), 1)
        self.assertEqual(len(result["triage"]), 1)
        triage = result["projects"][0]["sessions"][0]["triage"]
        self.assertEqual(triage["human_messages"], 1)
        self.assertEqual(len(triage["friction_notes"]), 1)

    def test_triage_evidence_gaps_respect_exclusion_and_unknown_activity(self):
        agents = self.roots["PASEO_HOME"] / "agents/project"
        agents.mkdir(parents=True)
        for aid, activity in [("audit-agent", "2026-10-20T09:00:00Z"), ("undated", None)]:
            (agents / f"{aid}.json").write_text(json.dumps({
                "id": aid, "provider": "claude", "cwd": str(self.project), "lastStatus": "closed",
                "lastActivityAt": activity, "persistence": {"sessionId": f"missing-{aid}"}}))
        with patch.dict("os.environ", {"CLAUDE_CODE_SESSION_ID": "", "PASEO_AGENT_ID": "audit-agent"}):
            project = self.run_triage("--project", str(self.project))["projects"][0]
        self.assertEqual(project["evidence_gaps"], [])
        self.assertEqual([item["agent_id"] for item in project["excluded"]], ["audit-agent"])
        self.assertEqual([item["paseo"]["agent_id"] for item in project["unknown_activity"]], ["undated"])

    def test_triage_options_are_validated(self):
        for args in (["--list", "--runtime", "claude", "--project", "a", "--since", "2026-10-01"],
                     ["--list", "--runtime", "claude", "--project", "a", "--project", "b"],
                     ["--triage"],
                     ["--triage", "--project", "a", "--since", "2026-10-22", "--until", "2026-10-01"]):
            result = subprocess.run([sys.executable, "-B", str(SCRIPT), *args], capture_output=True, text=True)
            self.assertEqual(result.returncode, 2, args)

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
