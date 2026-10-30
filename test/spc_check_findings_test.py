"""Unit tests for security-performance-check/scripts/check_findings.py; run by test/run.js."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

# Keep the skill source free of __pycache__, which the installer would copy.
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "skills/security-performance-check/scripts"))
import check_findings as c  # noqa: E402


def har_doc(body_text, *, size=None, redaction=None, url="http://127.0.0.1:3000/api/me"):
    text = body_text
    if size is None:
        size = c.utf8_size(text)
    content = {"size": size, "mimeType": "application/json", "text": text}
    if redaction is not None:
        content["_spc_redaction"] = redaction
    return {
        "log": {
            "version": "1.2",
            "entries": [{
                "request": {"method": "GET", "url": url},
                "response": {"status": 200, "content": content},
            }],
        }
    }


class HarEvidenceTests(unittest.TestCase):
    def test_size_mismatch_rejected(self):
        data = har_doc('{"ok":true}', size=999)
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_har(data)
        self.assertIn("differs from stored body", str(ctx.exception))

    def test_missing_text_with_positive_size_rejected(self):
        data = {
            "log": {
                "entries": [{
                    "request": {"method": "GET", "url": "/x"},
                    "response": {"status": 200, "content": {"size": 12, "mimeType": "application/json"}},
                }],
            }
        }
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_har(data)
        self.assertIn("content.text is required", str(ctx.exception))

    def test_placeholder_body_hash_rejected(self):
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_request({
                "role": "user-b",
                "method": "GET",
                "url": "/api/x",
                "status": 200,
                "length": 12,
                "body_hash": "sha256:omitted",
            }, "req")
        self.assertIn("placeholder", str(ctx.exception))

    def test_marked_redaction_accepted(self):
        marker = c.REDACTION_MARKER
        body = '{"passwordHash":"' + marker + '","id":1}'
        start = body.index(marker)
        data = har_doc(body, redaction={
            "marker": marker,
            "paths": ["$.passwordHash"],
            "ranges": [[start, start + len(marker)]],
        })
        summaries = c.check_har(data)
        self.assertEqual(len(summaries), 1)
        self.assertEqual(summaries[0]["size"], c.utf8_size(body))

    def test_bad_redaction_range_rejected(self):
        marker = c.REDACTION_MARKER
        body = '{"passwordHash":"' + marker + '"}'
        data = har_doc(body, redaction={
            "marker": marker,
            "paths": ["$.passwordHash"],
            "ranges": [[0, 5]],
        })
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_har(data)
        self.assertIn("marker", str(ctx.exception))


class SensitiveScanTests(unittest.TestCase):
    def test_sensitive_key_detected_without_signal_row(self):
        body = json.dumps({"id": 1, "passwordHash": "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUV"})
        data = har_doc(body)
        result = c.scan_har_bodies(data)
        self.assertTrue(result["hits"], result)
        self.assertTrue(any(h["reason"] == "sensitive_key" for h in result["hits"]), result)

    def test_clean_body_passes(self):
        body = json.dumps({"id": 1, "name": "Ada", "role": "user"})
        result = c.scan_har_bodies(har_doc(body))
        self.assertEqual(result["hits"], [])

    def test_redacted_sensitive_key_not_reported(self):
        body = json.dumps({"passwordHash": c.REDACTION_MARKER, "id": 1})
        result = c.scan_har_bodies(har_doc(body))
        self.assertEqual(result["hits"], [])


class ThresholdBaseZeroTests(unittest.TestCase):
    def test_equal_zeros_pass_relative_lt(self):
        result = c.evaluate_threshold([0], [0], "median < base*1.10")
        self.assertEqual(result["verdict"], "pass")

    def test_head_positive_fails_when_base_zero(self):
        result = c.evaluate_threshold([0], [1], "median < base*1.10")
        self.assertEqual(result["verdict"], "fail")

    def test_count_equal_zeros_still_pass(self):
        result = c.evaluate_threshold([0], [0], "count <= base", aggregation="count")
        self.assertEqual(result["verdict"], "pass")


class AccessClassificationTests(unittest.TestCase):
    def test_bypassed_with_expected_allow_rejected(self):
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_request({
                "role": "admin",
                "method": "GET",
                "url": "/api/orders/1",
                "status": 200,
                "length": 0,
                "body_hash": c.body_sha256(b""),
                "expected_access": "allow",
                "observed_access": "allow",
                "access_verdict": "bypassed",
            }, "req")
        self.assertIn("bypassed", str(ctx.exception))

    def test_authorized_caller_allowed(self):
        c.check_request({
            "role": "owner",
            "method": "GET",
            "url": "/api/orders/1",
            "status": 200,
            "length": 0,
            "body_hash": c.body_sha256(b""),
            "expected_access": "allow",
            "observed_access": "allow",
            "access_verdict": "allowed",
            "caller_authorized": True,
        }, "req")

    def test_derived_bypassed_ok(self):
        c.check_request({
            "role": "user-b",
            "method": "GET",
            "url": "/api/orders/1",
            "status": 200,
            "length": 0,
            "body_hash": c.body_sha256(b""),
            "expected_access": "deny",
            "observed_access": "allow",
            "access_verdict": "bypassed",
            "caller_authorized": False,
        }, "req")


class PathExcludeTests(unittest.TestCase):
    def test_i18n_and_tests_excluded(self):
        rows = c.load_signals()
        loaded = c.match_signals(rows, [
            "src/i18n/en.ts",
            "locales/vi.ts",
            "__tests__/redirect.test.ts",
            "fixtures/data.ts",
            "src/api/orders.ts",
        ])
        by_id = {e["id"]: e["matched_paths"] for e in loaded}
        self.assertEqual(by_id.get("open-redirect"), ["src/api/orders.ts"])
        self.assertEqual(by_id.get("client-secrets"), ["src/api/orders.ts"])
        self.assertNotIn("src/i18n/en.ts", by_id.get("object-id-access", []))

    def test_server_layout_matches_authz(self):
        rows = c.load_signals()
        loaded = c.match_signals(rows, ["server/index.ts", "backend/app.ts"])
        authz = next(e for e in loaded if e["id"] == "authz-route")
        self.assertIn("server/index.ts", authz["matched_paths"])
        self.assertIn("backend/app.ts", authz["matched_paths"])


class CliWiringTests(unittest.TestCase):
    def test_scan_bodies_exit_codes(self):
        with tempfile.TemporaryDirectory() as tmp:
            clean = Path(tmp) / "clean.har"
            dirty = Path(tmp) / "dirty.har"
            clean.write_text(json.dumps(har_doc('{"id":1}')), encoding="utf-8")
            dirty.write_text(
                json.dumps(har_doc(json.dumps({"apiKey": "super-secret-value"}))),
                encoding="utf-8",
            )
            from io import StringIO
            from contextlib import redirect_stdout, redirect_stderr
            buf = StringIO()
            err = StringIO()
            with redirect_stdout(buf), redirect_stderr(err):
                self.assertEqual(c.main(["scan-bodies", str(clean)]), 0)
                self.assertEqual(c.main(["scan-bodies", str(dirty)]), 1)

    def test_har_cli_rejects_mismatch(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.har"
            path.write_text(json.dumps(har_doc("hi", size=99)), encoding="utf-8")
            from io import StringIO
            from contextlib import redirect_stdout, redirect_stderr
            buf = StringIO()
            err = StringIO()
            with redirect_stdout(buf), redirect_stderr(err):
                self.assertEqual(c.main(["har", str(path)]), 2)
            self.assertIn("differs from stored body", err.getvalue())


if __name__ == "__main__":
    unittest.main()
