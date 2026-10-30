"""Unit tests for security-performance-check/scripts/check_findings.py; run by test/run.js."""
import base64
import json
import sys
import tempfile
import unittest
from pathlib import Path

# Keep the skill source free of __pycache__, which the installer would copy.
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "skills/security-performance-check/scripts"))
import check_findings as c  # noqa: E402


def har_doc(body_text, *, size=None, redaction=None, url="http://127.0.0.1:3000/api/me",
            mime="application/json", encoding=None, file_ref=None, method="GET",
            scan_allow=None, extra_entries=None):
    text = body_text
    if size is None and text is not None and encoding != "base64" and file_ref is None:
        size = c.utf8_size(text)
    content = {"size": size if size is not None else 0, "mimeType": mime}
    if text is not None:
        content["text"] = text
    if encoding is not None:
        content["encoding"] = encoding
    if file_ref is not None:
        content["_file"] = file_ref
    if redaction is not None:
        content["_spc_redaction"] = redaction
    if scan_allow is not None:
        content["_spc_scan_allow"] = scan_allow
    entries = [{
        "request": {"method": method, "url": url},
        "response": {"status": 200, "content": content},
    }]
    if extra_entries:
        entries.extend(extra_entries)
    return {
        "log": {
            "version": "1.2",
            "entries": entries,
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
        self.assertIn("content.text or content._file is required", str(ctx.exception))

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

    def test_base64_entry_accepted_with_decoded_size(self):
        body = '{"ok":true}'
        b64 = base64.b64encode(body.encode("utf-8")).decode("ascii")
        data = har_doc(b64, size=len(body.encode("utf-8")), encoding="base64")
        summaries = c.check_har(data, path="<har>")
        self.assertEqual(summaries[0]["size"], len(body.encode("utf-8")))
        self.assertEqual(summaries[0]["text"], body)
        self.assertEqual(summaries[0]["sha256"], c.body_sha256(body.encode("utf-8")))

    def test_base64_entry_rejected_with_wrong_size(self):
        body = '{"ok":true}'
        b64 = base64.b64encode(body.encode("utf-8")).decode("ascii")
        data = har_doc(b64, size=len(b64), encoding="base64")
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_har(data)
        self.assertIn("decoded base64", str(ctx.exception))

    def test_attach_file_accepted_and_missing_sidecar_rejected(self):
        body = b'{"id":1}'
        with tempfile.TemporaryDirectory() as tmp:
            har_path = Path(tmp) / "probe.har"
            sidecar = Path(tmp) / "body0.bin"
            sidecar.write_bytes(body)
            data = har_doc(None, size=len(body), file_ref="body0.bin")
            har_path.write_text(json.dumps(data), encoding="utf-8")
            summaries = c.check_har(json.loads(har_path.read_text(encoding="utf-8")), str(har_path))
            self.assertEqual(summaries[0]["size"], len(body))
            self.assertEqual(summaries[0]["sha256"], c.body_sha256(body))

            bad = har_doc(None, size=3, file_ref="missing.bin")
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_har(bad, str(har_path))
            self.assertIn("missing", str(ctx.exception))

    def test_non_probed_image_entry_does_not_fail_har(self):
        data = {
            "log": {
                "entries": [{
                    "request": {"method": "GET", "url": "http://127.0.0.1:3000/logo.png"},
                    "response": {
                        "status": 200,
                        "content": {"size": 4096, "mimeType": "image/png"},
                    },
                }],
            }
        }
        summaries = c.check_har(data)
        self.assertEqual(len(summaries), 1)
        self.assertFalse(summaries[0]["body_present"])


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

    def test_css_span_not_a_hit(self):
        css = "div { span: 1px; margin: 0; }"
        result = c.scan_body_text(css, url="http://x/app.css", mime="text/css")
        self.assertEqual(result, [])
        # Even without mime skip, boundary rules must not treat "pan" inside "span".
        result = c.scan_body_text(css, url="http://x/raw", mime="text/plain")
        self.assertEqual(result, [])

    def test_null_password_hash_not_a_hit(self):
        body = json.dumps({"passwordHash": None, "id": 1})
        result = c.scan_har_bodies(har_doc(body))
        self.assertEqual(result["hits"], [])
        body_empty = json.dumps({"passwordHash": "", "secret": False})
        result = c.scan_har_bodies(har_doc(body_empty))
        self.assertEqual(result["hits"], [])

    def test_exempted_access_token_not_a_hit_but_password_hash_never_exemptable(self):
        body = json.dumps({
            "access_token": "eyJhbGciOiJIUzI1NiJ9.e30.sig",
            "passwordHash": "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUV",
        })
        allow = [{"key": "access_token", "reason": "own token on login response"}]
        data = har_doc(body, scan_allow=allow)
        result = c.scan_har_bodies(data)
        self.assertTrue(any(h.get("key") == "passwordHash" for h in result["hits"]), result)
        self.assertFalse(any(h.get("key") == "access_token" for h in result["hits"]), result)
        self.assertFalse(any(h.get("reason") == "jwt" for h in result["hits"]), result)

        with self.assertRaises(c.Inconsistent) as ctx:
            c.parse_scan_allow(
                [{"key": "passwordHash", "reason": "should fail"}],
                "test",
            )
        self.assertIn("never exemptable", str(ctx.exception))


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

    def test_bypassed_without_access_fields_rejected(self):
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_request({
                "role": "user-b",
                "method": "GET",
                "url": "/api/orders/1",
                "status": 200,
                "length": 0,
                "body_hash": c.body_sha256(b""),
                "access_verdict": "bypassed",
            }, "req", signal_id="authz-route")
        self.assertIn("expected_access", str(ctx.exception))

    def test_authz_requires_access_fields(self):
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_request({
                "role": "user-b",
                "method": "GET",
                "url": "/api/orders/1",
                "status": 200,
                "length": 0,
                "body_hash": c.body_sha256(b""),
            }, "req", signal_id="object-id-access")
        self.assertIn("expected_access is required", str(ctx.exception))


class PathExcludeTests(unittest.TestCase):
    def test_i18n_and_tests_excluded(self):
        rows = c.load_signals()
        loaded = c.match_signals(rows, [
            "src/i18n/en.ts",
            "locales/vi.ts",
            "__tests__/redirect.test.ts",
            "fixtures/data.ts",
            "cypress/e2e/login.cy.ts",
            "e2e/smoke.spec.ts",
            "src/test-utils/render.ts",
            "src/messages/en.json",
            "src/api/orders.ts",
            "src/auth/redirect.ts",
        ])
        by_id = {e["id"]: e["matched_paths"] for e in loaded}
        self.assertEqual(by_id.get("open-redirect"), ["src/auth/redirect.ts"])
        self.assertEqual(by_id.get("client-secrets"), ["src/api/orders.ts", "src/auth/redirect.ts"])
        self.assertNotIn("src/i18n/en.ts", by_id.get("object-id-access", []))
        self.assertNotIn("cypress/e2e/login.cy.ts", by_id.get("object-id-access", []))
        self.assertNotIn("src/messages/en.json", by_id.get("object-id-access", []))
        self.assertNotIn("src/test-utils/render.ts", by_id.get("client-secrets", []))

    def test_server_layout_matches_authz(self):
        rows = c.load_signals()
        loaded = c.match_signals(rows, ["server/index.ts", "backend/app.ts"])
        authz = next(e for e in loaded if e["id"] == "authz-route")
        self.assertIn("server/index.ts", authz["matched_paths"])
        self.assertIn("backend/app.ts", authz["matched_paths"])

    def test_client_secrets_skips_server_only_tree(self):
        rows = c.load_signals()
        loaded = c.match_signals(rows, ["server/secrets.ts", "src/config/public.ts"])
        by_id = {e["id"]: e["matched_paths"] for e in loaded}
        self.assertNotIn("server/secrets.ts", by_id.get("client-secrets", []))
        self.assertIn("src/config/public.ts", by_id.get("client-secrets", []))


class CrossCheckAndRunTests(unittest.TestCase):
    def test_cross_check_matches_by_method_url_with_extra_entries(self):
        body = '{"ok":true}'
        digest = c.body_sha256(body.encode("utf-8"))
        har = {
            "log": {
                "entries": [
                    {
                        "request": {"method": "GET", "url": "http://127.0.0.1:3000/logo.png"},
                        "response": {"status": 200, "content": {"size": 99, "mimeType": "image/png"}},
                    },
                    {
                        "request": {"method": "GET", "url": "http://127.0.0.1:3000/api/orders/1"},
                        "response": {
                            "status": 200,
                            "content": {
                                "size": c.utf8_size(body),
                                "mimeType": "application/json",
                                "text": body,
                            },
                        },
                    },
                ]
            }
        }
        finding = {
            "track": "security",
            "requests": [{
                "role": "user-b",
                "method": "GET",
                "url": "/api/orders/1",
                "status": 200,
                "length": c.utf8_size(body),
                "body_hash": digest,
            }],
        }
        c.cross_check_finding_har(finding, "<har>", har)

    def test_cross_check_unmatched_request_errors(self):
        har = har_doc('{"a":1}', url="http://127.0.0.1:3000/api/other")
        finding = {
            "track": "security",
            "requests": [{
                "role": "user-b",
                "method": "GET",
                "url": "/api/orders/1",
                "status": 200,
                "length": 0,
                "body_hash": c.body_sha256(b""),
            }],
        }
        with self.assertRaises(c.Inconsistent) as ctx:
            c.cross_check_finding_har(finding, "<har>", har)
        self.assertIn("no HAR entry matches", str(ctx.exception))

    def test_missing_har_path_rejected_on_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            finding = {
                "schema": c.FINDING_SCHEMA,
                "track": "security",
                "signal_id": "sensitive-response",
                "file": "src/api/me.ts",
                "line": 1,
                "cwe": "CWE-200",
                "severity": "med",
                "status": "exploited",
                "introduced": True,
                "roles_tested": ["user-a"],
                "requests": [{
                    "role": "user-a",
                    "method": "GET",
                    "url": "/api/me",
                    "status": 200,
                    "length": 0,
                    "body_hash": c.body_sha256(b""),
                }],
                "repro_curl": "curl -s -H 'Cookie: <redacted>' http://127.0.0.1:3000/api/me",
                "evidence": {"har_path": "missing.har", "screenshot": None},
                "validator": "agent",
            }
            summary = {
                "schema": c.SUMMARY_SCHEMA,
                "track": "security",
                "target": {"label": "t"},
                "signals_loaded": [],
                "coverage": [{"path": "src/api/me.ts", "in_scope": True}],
                "conditions": {},
                "body_scan": {"ran": True, "hars": [], "hit_count": 0},
                "limits": ["Not a penetration test, dependency CVE audit, or load test."],
            }
            (run_dir / "finding-1.json").write_text(json.dumps(finding), encoding="utf-8")
            (run_dir / "summary.json").write_text(json.dumps(summary), encoding="utf-8")
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(run_dir)
            self.assertIn("does not exist", str(ctx.exception))

    def test_missing_scan_record_fails_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            body = ""
            har = har_doc(body, size=0, url="http://127.0.0.1:3000/api/me")
            (run_dir / "finding-1.har").write_text(json.dumps(har), encoding="utf-8")
            finding = {
                "schema": c.FINDING_SCHEMA,
                "track": "security",
                "signal_id": "sensitive-response",
                "file": "src/api/me.ts",
                "line": 1,
                "cwe": "CWE-200",
                "severity": "med",
                "status": "exploited",
                "introduced": True,
                "roles_tested": ["user-a"],
                "requests": [{
                    "role": "user-a",
                    "method": "GET",
                    "url": "/api/me",
                    "status": 200,
                    "length": 0,
                    "body_hash": c.body_sha256(b""),
                }],
                "repro_curl": "curl -s -H 'Cookie: <redacted>' http://127.0.0.1:3000/api/me",
                "evidence": {"har_path": "finding-1.har", "screenshot": None},
                "validator": "agent",
            }
            summary = {
                "schema": c.SUMMARY_SCHEMA,
                "track": "security",
                "target": {"label": "t"},
                "signals_loaded": [],
                "coverage": [{"path": "src/api/me.ts", "in_scope": True}],
                "conditions": {},
                "limits": ["Not a penetration test, dependency CVE audit, or load test."],
            }
            (run_dir / "finding-1.json").write_text(json.dumps(finding), encoding="utf-8")
            (run_dir / "summary.json").write_text(json.dumps(summary), encoding="utf-8")
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(run_dir)
            self.assertIn("scan-bodies", str(ctx.exception))


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
