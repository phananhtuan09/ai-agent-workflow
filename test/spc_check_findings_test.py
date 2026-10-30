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

SEC_FILE = "references/security-signals.md"


def all_rows_loaded():
    """signals_loaded with every security row: rows always load, hints only rank them."""
    return [{"id": row["id"], "file": SEC_FILE, "matched_paths": []} for row in c.load_signals()]


def row_reasons(skip=()):
    """One coverage reason per security row (applies or skipped + why)."""
    out = []
    for row in c.load_signals():
        if row["id"] in skip:
            continue
        out.append({"signal_id": row["id"], "decision": "skipped",
                    "reason": "the diff has no code with this behavior"})
    return out


def security_fields(file_path="src/api/me.ts"):
    return {
        "signals_loaded": all_rows_loaded(),
        "coverage": [{"path": file_path, "in_scope": True}] + row_reasons(),
        "probes": [],
        "budgets": {"probes": {"used": 0, "limit": 20}},
    }


WEB_SCOPE = {"project_type": "web-ui", "collectors": ["playwright"]}
# Both commits are named so the report can be reproduced; 40-hex SHAs are not secrets.
TARGET = {"label": "t", "base_sha": "9fceb02d0ae598e95dc970b74767f19372d61af8",
          "head_sha": "e83c5163316f89bfbde7d9ab23ca2e25604af290"}
BROWSER_METRIC_IDS = ("lcp", "cls", "inp-tbt", "long-tasks")


def browser_samples(n=5):
    """summary.browser_metrics with n interleaved base/head samples per noisy browser metric."""
    return {sid: {"order": "interleaved", "base": [100.0 + i for i in range(n)],
                  "head": [101.0 + i for i in range(n)], "verdict": "pass"} for sid in BROWSER_METRIC_IDS}


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

    def test_redacted_sensitive_key_still_reported(self):
        # Redaction hides the value, not the fact that the response carried the field.
        body = json.dumps({"passwordHash": c.REDACTION_MARKER, "id": 1}, ensure_ascii=False)
        start = body.index(c.REDACTION_MARKER)
        result = c.scan_har_bodies(har_doc(body, redaction={
            "marker": c.REDACTION_MARKER, "paths": ["$.passwordHash"],
            "ranges": [[start, start + len(c.REDACTION_MARKER)]]}))
        self.assertEqual([h["reason"] for h in result["hits"]], ["redacted_sensitive_key"])

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
                "introduced_reason": "the route returns 404 on base",
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
                "target": dict(TARGET),
                **security_fields(),
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
                "introduced_reason": "the route returns 404 on base",
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
                "target": dict(TARGET),
                **security_fields(),
                "conditions": {},
                "limits": ["Not a penetration test, dependency CVE audit, or load test."],
            }
            (run_dir / "finding-1.json").write_text(json.dumps(finding), encoding="utf-8")
            (run_dir / "summary.json").write_text(json.dumps(summary), encoding="utf-8")
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(run_dir)
            self.assertIn("scan-bodies", str(ctx.exception))


class RunScanEnforcementTests(unittest.TestCase):
    LEAK = '{"author":{"name":"a","passwordHash":"$2b$10$abcdefghijklmnopqrstuuJ8S7ZqLx0lJgqv1nO3gk2Yw5o4i2K6"}}'

    def summary(self, body_scan=None, track="security"):
        data = {
            "schema": c.SUMMARY_SCHEMA,
            "track": track,
            "target": dict(TARGET),
            **security_fields("server/notes.ts"),
            "conditions": {},
            "limits": ["Not a penetration test, dependency CVE audit, or load test."],
        }
        if track in ("performance", "both"):
            data["performance_scope"] = WEB_SCOPE
            data["browser_metrics"] = browser_samples()
        if body_scan is not None:
            data["body_scan"] = body_scan
        return data

    def write(self, run_dir, summary, har_body=None):
        (run_dir / "summary.json").write_text(json.dumps(summary), encoding="utf-8")
        if har_body is not None:
            (run_dir / "probes.har").write_text(json.dumps(har_doc(har_body)), encoding="utf-8")

    def test_security_run_without_findings_still_needs_scan_record(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            self.write(run_dir, self.summary())
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(run_dir)
            self.assertIn("scan-bodies", str(ctx.exception))

    def test_hit_without_sensitive_finding_fails_even_with_zero_findings(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            self.write(run_dir, self.summary({"ran": True, "hars": ["probes.har"]}), self.LEAK)
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(run_dir)
            self.assertIn("sensitive-response", str(ctx.exception))

    def test_declared_hit_count_is_recomputed(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            self.write(run_dir, self.summary({"ran": True, "hars": ["probes.har"], "hit_count": 0}), self.LEAK)
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(run_dir)
            self.assertIn("hit_count", str(ctx.exception))

    def test_unlisted_har_in_run_dir_is_scanned(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            self.write(run_dir, self.summary({"ran": True, "hars": []}), self.LEAK)
            with self.assertRaises(c.Inconsistent):
                c.check_run_dir(run_dir)

    def test_clean_security_run_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            self.write(run_dir, self.summary({"ran": True, "hars": ["probes.har"], "hit_count": 0}), '{"ok":true}')
            result = c.check_run_dir(run_dir)
            self.assertEqual(result["exploited"], 0)

    def test_performance_only_run_without_hars_needs_no_scan(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            summary = self.summary(track="performance")
            try:
                self.write(run_dir, summary)
                c.check_run_dir(run_dir)
            except c.Inconsistent as error:
                self.assertNotIn("scan-bodies", str(error))


class PathMatchingCaseAndUtilsTests(unittest.TestCase):
    def test_glob_is_case_insensitive(self):
        self.assertTrue(c.matcher(["**/*login*"])("src/pages/LoginPage.tsx"))
        self.assertTrue(c.matcher(["**/auth/**"])("src/Auth/session.ts"))

    def test_test_utils_files_excluded(self):
        self.assertTrue(c.is_excluded_path("src/test-utils.ts"))
        self.assertTrue(c.is_excluded_path("src/test_helpers.py"))
        self.assertFalse(c.is_excluded_path("src/utils.ts"))


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


# ---------------------------------------------------------------------------
# Previously fixed behaviors (locked before further changes).
# ---------------------------------------------------------------------------

def sec_request(body_bytes, *, url="/api/me", role="user-a", **extra):
    req = {
        "role": role, "method": "GET", "url": url, "status": 200,
        "length": len(body_bytes), "body_hash": c.body_sha256(body_bytes),
    }
    req.update(extra)
    return req


def sec_finding(requests, *, signal_id="sensitive-response", har="finding-1.har"):
    return {
        "schema": c.FINDING_SCHEMA, "track": "security", "signal_id": signal_id,
        "file": "src/api/me.ts", "line": 1, "cwe": "CWE-200", "severity": "med",
        "status": "exploited", "introduced": True, "roles_tested": ["user-a"],
        "introduced_reason": "the route returns 404 on base",
        "requests": requests,
        "repro_curl": "curl -s -H 'Cookie: <redacted>' http://127.0.0.1:3000/api/me",
        "evidence": {"har_path": har, "screenshot": None}, "validator": "agent",
    }


def base_summary(track="security", **extra):
    data = {
        "schema": c.SUMMARY_SCHEMA, "track": track, "target": dict(TARGET),
        **security_fields(),
        "conditions": {}, "limits": ["Not a penetration test, dependency CVE audit, or load test."],
    }
    if track in ("performance", "both"):
        data["performance_scope"] = WEB_SCOPE
        data["browser_metrics"] = browser_samples()
    data.update(extra)
    return data


class NoTruncationTests(unittest.TestCase):
    BODY = json.dumps({"items": [{"id": i, "name": f"item-{i}"} for i in range(40)]})

    def test_truncated_body_with_original_size_rejected(self):
        full = c.utf8_size(self.BODY)
        data = har_doc(self.BODY[:200], size=full)
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_har(data)
        self.assertIn("differs from stored body", str(ctx.exception))

    def test_full_body_length_matches_size_and_finding(self):
        data = har_doc(self.BODY)
        summaries = c.check_har(data)
        self.assertEqual(summaries[0]["size"], c.utf8_size(self.BODY))
        finding = sec_finding([sec_request(self.BODY.encode("utf-8"), url="http://127.0.0.1:3000/api/me")])
        c.cross_check_finding_har(finding, "<har>", data)

    def test_finding_length_of_truncated_preview_rejected(self):
        data = har_doc(self.BODY)
        preview = self.BODY[:100].encode("utf-8")
        finding = sec_finding([sec_request(preview)])
        with self.assertRaises(c.Inconsistent) as ctx:
            c.cross_check_finding_har(finding, "<har>", data)
        self.assertIn("disagrees", str(ctx.exception))


class ScanWithoutSensitiveRowTests(unittest.TestCase):
    """The body scan runs even when the agent judged sensitive-response not to apply."""
    LEAK = json.dumps({"id": 7, "owner": {"name": "a", "passwordHash": "$2b$10$abcdefghijklmnopqrstuuJ8S7ZqLx0lJgqv1nO3gk2Yw5o4i2K6"}})

    def test_run_requires_sensitive_finding_when_row_not_loaded(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            summary = base_summary(body_scan={"ran": True, "hars": ["probes.har"]})
            reasons = {e.get("signal_id"): e for e in summary["coverage"]}
            self.assertEqual(reasons["sensitive-response"]["decision"], "skipped")
            (run_dir / "summary.json").write_text(json.dumps(summary), encoding="utf-8")
            (run_dir / "probes.har").write_text(json.dumps(har_doc(self.LEAK)), encoding="utf-8")
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(run_dir)
            self.assertIn("sensitive-response", str(ctx.exception))

    def test_scan_hits_regardless_of_loaded_rows(self):
        hits = c.scan_har_bodies(har_doc(self.LEAK))["hits"]
        self.assertTrue(any(h["key"] == "passwordHash" for h in hits), hits)


class CallerAuthorizedTableTests(unittest.TestCase):
    # (role, expected, observed, verdict, caller_authorized, ok)
    CASES = [
        ("owner", "allow", "allow", "allowed", True, True),
        ("admin", "allow", "allow", "allowed", True, True),
        ("admin", "allow", "allow", "bypassed", True, False),
        ("owner", "allow", "allow", "bypassed", None, False),
        ("user-b", "deny", "allow", "bypassed", False, True),
        ("anonymous", "deny", "allow", "bypassed", None, True),
        ("anonymous", "deny", "deny", "enforced", False, True),
        ("user-b", "deny", "deny", "bypassed", False, False),
        ("user-b", "deny", "allow", "allowed", False, False),
        ("admin", "deny", "allow", "bypassed", True, False),
    ]

    def test_table(self):
        for role, expected, observed, verdict, authorized, ok in self.CASES:
            req = sec_request(b"", url="/api/orders/1", role=role, expected_access=expected,
                              observed_access=observed, access_verdict=verdict)
            if authorized is not None:
                req["caller_authorized"] = authorized
            with self.subTest(role=role, verdict=verdict, authorized=authorized):
                if ok:
                    c.check_request(req, "req", signal_id="object-id-access")
                else:
                    with self.assertRaises(c.Inconsistent):
                        c.check_request(req, "req", signal_id="object-id-access")


class ThresholdBaseZeroTableTests(unittest.TestCase):
    CASES = [
        ("count <= base", [0], [0], "count", "pass"),
        ("count <= base", [0], [1], "count", "fail"),
        ("median < base*1.10", [0], [0], None, "pass"),
        ("median < base*1.10", [0], [3], None, "fail"),
        ("median < base*1.10; abs < 2500", [0], [0], None, "pass"),
        ("median > base*0.90", [0], [0], None, "pass"),
    ]

    def test_table(self):
        for expr, base, head, agg, verdict in self.CASES:
            with self.subTest(expr=expr, base=base, head=head):
                self.assertEqual(c.evaluate_threshold(base, head, expr, aggregation=agg)["verdict"], verdict)


def recorded_har(entries, *, creator=True):
    log = {"version": "1.2", "entries": entries}
    if creator:
        log["creator"] = {"name": "Playwright", "version": "1.48.0"}
        log["browser"] = {"name": "chromium", "version": "130.0"}
    return {"log": log}


def har_entry(url, started, *, body='{"ok":true}', mime="application/json", method="GET"):
    return {
        "startedDateTime": started,
        "time": 12.5,
        "request": {"method": method, "url": url},
        "response": {"status": 200, "content": {"size": c.utf8_size(body), "mimeType": mime, "text": body}},
        "timings": {"send": 0.1, "wait": 10.0, "receive": 2.4},
    }


def perf_finding(signal_id="background-requests", *, base=0, head=3, har="head.har", base_har="base.har",
                 request_filter=None):
    evidence = {"har_path": har, "screenshot": None}
    if base_har is not None:
        evidence["base_har_path"] = base_har
    if request_filter is not None:
        evidence["request_filter"] = request_filter
    return {
        "schema": c.FINDING_SCHEMA, "track": "performance", "signal_id": signal_id,
        "file": "src/pages/OrdersPage.tsx", "line": 10, "severity": "high", "status": "exploited",
        "introduced": True,
        "metric": {
            "class": "exact", "aggregation": "count", "unit": "requests",
            "base": {"median": base, "min": base, "max": base, "n": 1},
            "head": {"median": head, "min": head, "max": head, "n": 1},
            "delta_pct": 100 if base == 0 else (head - base) * 100 / base,
            "threshold": "count <= base", "effective_threshold": "count <= base",
            "aa_spread": None, "verdict": "fail",
        },
        "evidence": evidence,
        "fix_hint": "Clear the interval on unmount.",
    }


class BackgroundRequestsNavigationTests(unittest.TestCase):
    """background-requests must be counted after navigating away, on base and head."""

    def write_run(self, run_dir, finding, base_entries, head_entries):
        (run_dir / "summary.json").write_text(json.dumps(base_summary(track="performance")), encoding="utf-8")
        (run_dir / "finding-1.json").write_text(json.dumps(finding), encoding="utf-8")
        (run_dir / "base.har").write_text(json.dumps(recorded_har(base_entries)), encoding="utf-8")
        (run_dir / "head.har").write_text(json.dumps(recorded_har(head_entries)), encoding="utf-8")

    def page_then_polls(self, polls):
        entries = [
            har_entry("http://127.0.0.1:3000/orders", "2026-01-01T00:00:00.000Z", body="<html></html>", mime="text/html"),
            har_entry("http://127.0.0.1:3000/api/orders", "2026-01-01T00:00:00.400Z"),
            har_entry("http://127.0.0.1:3000/", "2026-01-01T00:00:01.000Z", body="<html></html>", mime="text/html"),
        ]
        for i in range(polls):
            entries.append(har_entry("http://127.0.0.1:3000/api/orders/poll", f"2026-01-01T00:00:0{3 + i}.000Z"))
        return entries

    NAV = {"after": {"base": "2026-01-01T00:00:01.000Z", "head": "2026-01-01T00:00:01.000Z"},
           "window_ms": 15000, "exclude_assets": True}

    def test_counted_after_navigation_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            self.write_run(run_dir, perf_finding(request_filter=self.NAV), self.page_then_polls(0), self.page_then_polls(3))
            c.check_run_dir(run_dir)

    def test_missing_navigation_boundary_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            self.write_run(run_dir, perf_finding(request_filter={"exclude_assets": True}),
                           self.page_then_polls(0), self.page_then_polls(3))
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(run_dir)
            self.assertIn("after", str(ctx.exception))

    def test_window_shorter_than_15s_rejected(self):
        nav = dict(self.NAV, window_ms=5000)
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            self.write_run(run_dir, perf_finding(request_filter=nav), self.page_then_polls(0), self.page_then_polls(3))
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(run_dir)
            self.assertIn("window_ms", str(ctx.exception))

    def test_no_page_load_before_navigation_rejected(self):
        polls_only = [har_entry("http://127.0.0.1:3000/api/orders/poll", f"2026-01-01T00:00:0{3 + i}.000Z") for i in range(3)]
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            self.write_run(run_dir, perf_finding(request_filter=self.NAV), self.page_then_polls(0), polls_only)
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(run_dir)
            self.assertIn("before", str(ctx.exception))



# ---------------------------------------------------------------------------
# Any language or framework: every row loads, hints come from paths or changed lines.
# ---------------------------------------------------------------------------

import importlib.util  # noqa: E402
import inspect  # noqa: E402
import re  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[1]
VALIDATE_CHANGE = REPO_ROOT / "skills/validate-change/scripts/validate_change.py"


def unified_diff(files):
    """A small unified diff: {path: [added lines]} as modified files."""
    out = []
    for path, lines in files.items():
        out += [f"diff --git a/{path} b/{path}", f"--- a/{path}", f"+++ b/{path}",
                f"@@ -1,1 +1,{len(lines) + 1} @@", " // context"]
        out += [f"+{line}" for line in lines]
    return "\n".join(out) + "\n"


# Each stack: a redirect/login change, a handler that reads an object by id, a template that renders user data.
FRAMEWORK_DIFFS = {
    "express": {
        "src/auth.js": ["app.post('/login', (req, res) => res.redirect(req.query.next));"],
        "src/orders.js": ["const order = await Order.findById(req.params.id);"],
        "views/profile.ejs": ["<p><%- user.bio %></p>"],
    },
    "nextjs": {
        "app/login/route.ts": ["return NextResponse.redirect(new URL(searchParams.get('callbackUrl')));"],
        "app/api/orders/[id]/route.ts": ["export async function GET(req, { params }) {",
                                         "  return Response.json(await db.order.findUnique({ where: { id: params.id } }));"],
        "components/Bio.tsx": ["<div dangerouslySetInnerHTML={{ __html: user.bio }} />"],
    },
    "django": {
        "accounts/views.py": ["    return redirect(request.GET.get('next'))"],
        "orders/views.py": ["    order = get_object_or_404(Order, pk=pk)"],
        "templates/profile.html": ["<p>{{ user.bio|safe }}</p>"],
    },
    "rails": {
        "app/controllers/sessions_controller.rb": ["    redirect_to params[:return_to]"],
        "app/controllers/orders_controller.rb": ["    @order = Order.find(params[:id])"],
        "app/views/users/show.html.erb": ["<p><%== @user.bio %></p>"],
    },
    "laravel": {
        "app/Http/Controllers/LoginController.php": ["        return redirect($request->input('next'));"],
        "app/Http/Controllers/OrderController.php": ["        $order = Order::findOrFail($id);"],
        "resources/views/profile.blade.php": ["<p>{!! $user->bio !!}</p>"],
    },
    "spring-boot": {
        "src/main/java/com/acme/web/LoginController.java": ["        return \"redirect:\" + returnUrl;"],
        "src/main/java/com/acme/web/OrderController.java": ["    @GetMapping(\"/orders/{id}\")",
                                                            "    public Order get(@PathVariable Long id) { return repo.findById(id).orElseThrow(); }"],
        "src/main/resources/templates/profile.html": ["<p th:utext=\"${user.bio}\"></p>"],
    },
    "aspnet-core": {
        "Controllers/AccountController.cs": ["        return Redirect(returnUrl);"],
        "Controllers/OrdersController.cs": ["    [HttpGet(\"{id}\")]",
                                            "    public async Task<IActionResult> Get([FromRoute] int id) => Ok(await _db.Orders.FindAsync(id));"],
        "Views/Profile/Index.cshtml": ["<p>@Html.Raw(Model.Bio)</p>"],
    },
    "go": {
        "internal/web/login.go": ["\thttp.Redirect(w, r, r.URL.Query().Get(\"next\"), http.StatusFound)"],
        "internal/web/orders.go": ["\tid := chi.URLParam(r, \"id\")", "\torder, err := store.Order(ctx, id)"],
        "internal/web/profile.go": ["\tdata := map[string]any{\"Bio\": template.HTML(user.Bio)}"],
    },
    "fastapi": {
        "app/auth.py": ["    return RedirectResponse(request.query_params['next'])"],
        "app/orders.py": ["@router.get('/orders/{id}')", "async def get_order(id: int): return await Order.get(id=id)"],
        "app/templates/profile.html": ["<p>{{ user.bio | safe }}</p>"],
    },
}
EXPECTED_HINTED = ("open-redirect", "object-id-access", "markup-render")


def rows_without_path_hints():
    rows = c.load_signals()
    for row in rows:
        row["patterns"] = []
    return rows


class AnyFrameworkSignalTests(unittest.TestCase):
    def test_every_stack_loads_all_rows_and_hints_by_content(self):
        all_ids = [row["id"] for row in c.load_signals()]
        pathless = rows_without_path_hints()
        for stack, files in FRAMEWORK_DIFFS.items():
            with self.subTest(stack=stack):
                changes = c.parse_unified_diff(unified_diff(files))
                self.assertEqual(set(changes), set(files))
                loaded = c.match_signals(c.load_signals(), list(changes), changes=changes)
                self.assertEqual([e["id"] for e in loaded], all_ids)
                # Content alone hints the rows: path hints are cleared here.
                hinted = c.hinted_paths(pathless, list(changes), changes)
                for row_id in EXPECTED_HINTED:
                    self.assertIn(row_id, hinted, f"{stack}: {row_id} not hinted by changed lines")

    def test_signals_cli_with_diff_returns_every_row(self):
        all_ids = [row["id"] for row in c.load_signals()]
        for stack, files in FRAMEWORK_DIFFS.items():
            with self.subTest(stack=stack), tempfile.TemporaryDirectory() as tmp:
                diff = Path(tmp) / "change.diff"
                diff.write_text(unified_diff(files), encoding="utf-8")
                out = run_cli(["signals", "--diff", str(diff)])
                loaded = json.loads(out)["signals_loaded"]
                self.assertEqual([e["id"] for e in loaded], all_ids)
                hinted = {e["id"] for e in loaded if e["matched_paths"]}
                self.assertTrue(set(EXPECTED_HINTED) <= hinted, f"{stack}: {sorted(hinted)}")

    def test_every_stack_summary_needs_a_reason_per_row(self):
        for stack, files in FRAMEWORK_DIFFS.items():
            with self.subTest(stack=stack):
                changes = c.parse_unified_diff(unified_diff(files))
                loaded = c.match_signals(c.load_signals(), list(changes), changes=changes)
                applies = {e["id"] for e in loaded if e["matched_paths"]}
                coverage = [{"path": f, "in_scope": True} for f in files]
                coverage += [{"signal_id": e["id"], "decision": "applies" if e["id"] in applies else "skipped",
                              "reason": f"{stack} diff {'touches' if e['id'] in applies else 'has no code for'} this behavior"}
                             for e in loaded]
                summary = base_summary(signals_loaded=loaded, coverage=coverage)
                c.check_summary(summary, "summary.json")
                for dropped in EXPECTED_HINTED:
                    short = dict(summary, coverage=[x for x in coverage if x.get("signal_id") != dropped])
                    with self.assertRaises(c.Inconsistent) as ctx:
                        c.check_summary(short, "summary.json")
                    self.assertIn(dropped, str(ctx.exception))

    def test_summary_missing_a_loaded_row_rejected(self):
        loaded = [e for e in all_rows_loaded() if e["id"] != "cookie-flags"]
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_summary(base_summary(signals_loaded=loaded), "summary.json")
        self.assertIn("cookie-flags", str(ctx.exception))

    def test_reason_must_be_text(self):
        coverage = [{"path": "src/api/me.ts", "in_scope": True}] + row_reasons()
        coverage[1] = dict(coverage[1], reason="")
        with self.assertRaises(c.Inconsistent):
            c.check_summary(base_summary(coverage=coverage), "summary.json")

    def test_docs_only_diff_still_loads_every_row_with_no_hints(self):
        changes = c.parse_unified_diff(unified_diff({"README.md": ["Use res.redirect(next) after login."]}))
        loaded = c.match_signals(c.load_signals(), list(changes), changes=changes)
        self.assertEqual(len(loaded), len(c.load_signals()))
        self.assertTrue(all(not e["matched_paths"] for e in loaded))

    def test_deleted_file_lines_count_as_changes(self):
        diff = "--- a/app/auth.py\n+++ /dev/null\n@@ -1 +0,0 @@\n-    return redirect(request.GET['next'])\n"
        changes = c.parse_unified_diff(diff)
        self.assertIn("app/auth.py", changes)
        self.assertIn("open-redirect", c.hinted_paths(rows_without_path_hints(), list(changes), changes))


def run_cli(args):
    import subprocess
    result = subprocess.run([sys.executable, "-B", str(Path(c.__file__)), *args],
                            capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise AssertionError(result.stderr or result.stdout)
    return result.stdout


class NoGlobGatingTests(unittest.TestCase):
    """No path glob decides whether a row loads, in the checker or in validate-change."""

    def test_empty_paths_return_every_row(self):
        self.assertEqual(len(c.match_signals(c.load_signals(), [])), len(c.load_signals()))
        perf = c.load_performance_signals()
        self.assertEqual(len(c.match_performance_signals(perf, [])),
                         len([r for r in perf if r["level"] != "off"]))

    def test_match_functions_do_not_filter_on_trigger_or_patterns(self):
        for fn in (c.match_signals, c.match_performance_signals):
            body = inspect.getsource(fn).split('"""')[-1]
            self.assertNotIn("trigger", body, fn.__name__)
            self.assertNotIn("patterns", body, fn.__name__)
            self.assertNotRegex(body, r"if\s+(not\s+)?(hits|matched|row_hints)", fn.__name__)

    def test_signal_rows_have_no_path_only_trigger(self):
        for row in c.load_signals():
            self.assertIn(row["trigger"], ("always",) , row["id"])
            self.assertTrue(row["content_hints"], f"{row['id']} needs content hints")
        for row in c.load_performance_signals():
            self.assertTrue(row["content_hints"], f"{row['id']} needs content hints")

    def test_validate_change_has_no_glob_gate(self):
        src = VALIDATE_CHANGE.read_text(encoding="utf-8")
        self.assertNotRegex(src, r"if not \w+\.get\(\"matched_paths\"\)")
        self.assertNotIn("match_signals(", src)
        self.assertIn("hinted_paths(rows, path_list, changes)", src)
        self.assertRegex(src, r"separate_tests_from_signals\(kept_paths, diff_changes\(files\)\)")


def load_validate_change():
    spec = importlib.util.spec_from_file_location("vc_under_test", VALIDATE_CHANGE)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def strip_path_hints(doc, path_cell):
    out = []
    for line in doc.splitlines():
        parts = line.split(" | ")
        if re.match(r"^\| `[a-z0-9-]+` \|", line) and len(parts) > path_cell + 2:
            parts[path_cell] = "`**/never-match/**`"
            line = " | ".join(parts)
        out.append(line)
    return "\n".join(out) + "\n"


class ValidateChangeContentDetectionTests(unittest.TestCase):
    def test_recommendation_survives_path_hints_that_never_match(self):
        vc = load_validate_change()
        with tempfile.TemporaryDirectory() as tmp:
            sec = Path(tmp) / "security-signals.md"
            perf = Path(tmp) / "performance-signals.md"
            sec.write_text(strip_path_hints(c.SIGNALS.read_text(encoding="utf-8"), 2), encoding="utf-8")
            perf.write_text(strip_path_hints(c.PERF_SIGNALS.read_text(encoding="utf-8"), 7), encoding="utf-8")
            vc.SPC_SECURITY_SIGNALS, vc.SPC_PERFORMANCE_SIGNALS = sec, perf
            for stack, files in FRAMEWORK_DIFFS.items():
                with self.subTest(stack=stack):
                    changes = c.parse_unified_diff(unified_diff(files))
                    self.assertEqual(
                        [e for e in vc.separate_tests_from_signals(list(changes)) if e["area"] == "security"], [],
                        "path hints alone must not match in this fixture")
                    entries = vc.separate_tests_from_signals(list(changes), changes)
                    ids = {e["signal"].split(":")[0] for e in entries if e["area"] == "security"}
                    for row_id in EXPECTED_HINTED:
                        self.assertIn(row_id, ids, stack)
                    self.assertTrue(all(e["command"].startswith("/security-performance-check ") for e in entries))

    def test_diff_changes_joins_added_and_removed(self):
        vc = load_validate_change()
        got = vc.diff_changes({"a.py": {"added": ["x = 1"], "removed": ["return redirect(n)"]}})
        self.assertEqual(got, {"a.py": "x = 1\nreturn redirect(n)"})


# ---------------------------------------------------------------------------
# Probes: a deterministic exploit is a finding (no evidence downgrade).
# ---------------------------------------------------------------------------

class ProbeOutcomeTests(unittest.TestCase):
    def write(self, run_dir, probes, finding=None):
        body = b'{"id":1}'
        summary = base_summary(probes=probes, body_scan={"ran": True, "hars": ["finding-1.har"], "hit_count": 0})
        (run_dir / "summary.json").write_text(json.dumps(summary), encoding="utf-8")
        (run_dir / "finding-1.har").write_text(json.dumps(har_doc(body.decode())), encoding="utf-8")
        if finding is not None:
            (run_dir / "finding-1.json").write_text(json.dumps(finding), encoding="utf-8")

    def redirect_finding(self, signal_id="open-redirect"):
        f = sec_finding([sec_request(b'{"id":1}')], signal_id=signal_id)
        f["validator"] = "deterministic"
        f["cwe"] = "CWE-601"
        return f

    def test_deterministic_exploit_with_matching_finding_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            probe = {"signal_id": "open-redirect", "validator": "deterministic", "outcome": "exploited",
                     "finding": "finding-1.json"}
            self.write(Path(tmp), [probe], self.redirect_finding())
            c.check_run_dir(Path(tmp))

    def test_deterministic_exploit_without_finding_rejected(self):
        probe = {"signal_id": "open-redirect", "validator": "deterministic", "outcome": "exploited", "finding": None}
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_summary(base_summary(probes=[probe]), "summary.json")
        self.assertIn("no downgrade", str(ctx.exception))

    def test_deterministic_exploit_naming_missing_file_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            probe = {"signal_id": "open-redirect", "validator": "deterministic", "outcome": "exploited",
                     "finding": "finding-9.json"}
            self.write(Path(tmp), [probe])
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(Path(tmp))
            self.assertIn("does not exist", str(ctx.exception))

    def test_deterministic_exploit_with_other_signal_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            probe = {"signal_id": "open-redirect", "validator": "deterministic", "outcome": "exploited",
                     "finding": "finding-1.json"}
            self.write(Path(tmp), [probe], self.redirect_finding("markup-render"))
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(Path(tmp))
            self.assertIn("signal_id 'open-redirect'", str(ctx.exception))

    def test_probe_signal_must_be_a_security_row(self):
        with tempfile.TemporaryDirectory() as tmp:
            probe = {"signal_id": "js-redirect", "validator": "deterministic", "outcome": "exploited",
                     "finding": "finding-1.json"}
            self.write(Path(tmp), [probe], self.redirect_finding("js-redirect"))
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(Path(tmp))
            self.assertIn("best-matching row", str(ctx.exception))

    def test_security_summary_without_probes_rejected(self):
        summary = base_summary()
        del summary["probes"]
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_summary(summary, "summary.json")
        self.assertIn("probes", str(ctx.exception))

    def test_unclear_agent_probe_needs_no_finding(self):
        probe = {"signal_id": "object-id-access", "validator": "agent", "outcome": "unclear", "finding": None}
        c.check_summary(base_summary(probes=[probe]), "summary.json")


# ---------------------------------------------------------------------------
# Performance: recorded base and head HARs, exact counts, project scope.
# ---------------------------------------------------------------------------

def order_entries(n, start_ms=100):
    return [har_entry(f"http://127.0.0.1:3000/api/orders/{i}",
                      f"2026-01-01T00:00:{(start_ms + 100 * i) // 1000:02d}.{(start_ms + 100 * i) % 1000:03d}Z")
            for i in range(n)]


class PerformanceEvidenceTests(unittest.TestCase):
    FILTER = {"url_contains": "/api/orders"}

    def run_with(self, *, finding=None, base=None, head=None, scope=WEB_SCOPE, limits=None):
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            summary = base_summary(track="performance", performance_scope=scope)
            if limits is not None:
                summary["limits"] = limits
            (run_dir / "summary.json").write_text(json.dumps(summary), encoding="utf-8")
            if finding is None:
                finding = perf_finding("request-count", base=2, head=5, request_filter=self.FILTER)
            (run_dir / "finding-1.json").write_text(json.dumps(finding), encoding="utf-8")
            (run_dir / "base.har").write_text(json.dumps(base or recorded_har(order_entries(2))), encoding="utf-8")
            (run_dir / "head.har").write_text(json.dumps(head or recorded_har(order_entries(5))), encoding="utf-8")
            return c.check_run_dir(run_dir)

    def assert_rejected(self, needle, **kw):
        with self.assertRaises(c.Inconsistent) as ctx:
            self.run_with(**kw)
        self.assertIn(needle, str(ctx.exception))

    def test_recorded_base_and_head_pass(self):
        self.run_with()

    def test_har_without_creator_rejected(self):
        self.assert_rejected("creator", head=recorded_har(order_entries(5), creator=False))

    def test_base_har_without_creator_rejected(self):
        self.assert_rejected("base HAR", base=recorded_har(order_entries(2), creator=False))

    def test_missing_started_date_time_rejected(self):
        head = recorded_har(order_entries(5))
        del head["log"]["entries"][2]["startedDateTime"]
        self.assert_rejected("startedDateTime is required", head=head)

    def test_identical_start_times_rejected(self):
        head = recorded_har([har_entry(f"http://127.0.0.1:3000/api/orders/{i}", "2026-01-01T00:00:00.000Z")
                             for i in range(5)])
        self.assert_rejected("same startedDateTime", head=head)

    def test_time_without_zone_rejected(self):
        head = recorded_har(order_entries(5))
        head["log"]["entries"][0]["startedDateTime"] = "2026-01-01T00:00:00.100"
        self.assert_rejected("time zone", head=head)

    def test_missing_base_har_path_rejected(self):
        self.assert_rejected("base_har_path",
                             finding=perf_finding("request-count", base=2, head=5, base_har=None, request_filter=self.FILTER))

    def test_head_count_mismatch_rejected(self):
        self.assert_rejected("must match exactly", head=recorded_har(order_entries(4)))

    def test_base_count_mismatch_rejected(self):
        self.assert_rejected("metric.base", base=recorded_har(order_entries(3)))

    def test_count_with_more_than_one_sample_rejected(self):
        finding = perf_finding("request-count", base=2, head=5, request_filter=self.FILTER)
        finding["metric"]["head"]["n"] = 3
        self.assert_rejected("n=1", finding=finding)

    def test_filter_counts_only_matching_requests(self):
        head = recorded_har(order_entries(5) + [har_entry("http://127.0.0.1:3000/static/app.js",
                                                          "2026-01-01T00:00:09.000Z", mime="text/javascript")])
        self.run_with(head=head)

    def test_collector_outside_scope_rejected(self):
        finding = perf_finding("lcp", base=2, head=5)
        finding["metric"].update({"class": "noisy", "aggregation": "median", "unit": "ms"})
        self.assert_rejected("not by this run's collectors", finding=finding,
                             scope={"project_type": "api-only", "collectors": ["http"]})

    def test_api_only_scope_cannot_use_playwright(self):
        self.assert_rejected("api-only project cannot use playwright",
                             scope={"project_type": "api-only", "collectors": ["playwright"]})

    def test_cli_scope_with_a_finding_rejected(self):
        self.assert_rejected("no performance finding",
                             scope={"project_type": "cli", "collectors": []},
                             limits=["Not a penetration test, dependency CVE audit, or load test.",
                                     "Performance was not measured: CLI project."])

    def test_cli_scope_needs_a_limit(self):
        summary = base_summary(track="performance", performance_scope={"project_type": "library", "collectors": []})
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_summary(summary, "summary.json")
        self.assertIn("not measured", str(ctx.exception))

    def test_performance_track_needs_scope(self):
        summary = base_summary(track="performance")
        del summary["performance_scope"]
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_summary(summary, "summary.json")
        self.assertIn("performance_scope", str(ctx.exception))


# ---------------------------------------------------------------------------
# Redaction of stored bodies.
# ---------------------------------------------------------------------------

class RedactionTests(unittest.TestCase):
    BODY = json.dumps({"user": {"id": 7, "email": "a@example.test", "password_hash": "$2b$12$abcdefghijklmnopqrstuv",
                                "api_token": "tok_live_1234567890abcdef"}, "items": [1, 2]})

    def test_redact_cli_keeps_field_names_and_passes_checks(self):
        with tempfile.TemporaryDirectory() as tmp:
            src, out = Path(tmp) / "raw.har", Path(tmp) / "finding-1.har"
            src.write_text(json.dumps(har_doc(self.BODY)), encoding="utf-8")
            run_cli(["redact", str(src), "--out", str(out)])
            data = json.loads(out.read_text(encoding="utf-8"))
            content = data["log"]["entries"][0]["response"]["content"]
            body = json.loads(content["text"])
            self.assertEqual(body["user"]["password_hash"], c.REDACTION_MARKER)
            self.assertEqual(body["user"]["api_token"], c.REDACTION_MARKER)
            self.assertEqual(body["user"]["email"], "a@example.test")
            self.assertNotIn("tok_live", content["text"])
            self.assertEqual(content["size"], c.utf8_size(content["text"]))
            self.assertEqual(len(content["_spc_redaction"]["ranges"]), 2)
            c.check_har(data, str(out))
            c.check_stored_bodies_redacted(data, str(out))
            # Field names stay, so the scan still reports the sensitive keys.
            keys = {h["key"] for h in c.scan_har_bodies(data, str(out))["hits"]}
            self.assertIn("password_hash", keys)

    def test_clear_secret_in_run_har_rejected(self):
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_stored_bodies_redacted(har_doc(self.BODY), "finding-1.har")
        self.assertIn("redact", str(ctx.exception))

    def test_marker_without_metadata_rejected(self):
        text = json.dumps({"token": c.REDACTION_MARKER}, ensure_ascii=False)
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_har(har_doc(text), "finding-1.har")
        self.assertIn("_spc_redaction", str(ctx.exception))

    def test_size_checked_on_redacted_body(self):
        data = har_doc(self.BODY)
        c.redact_har(data)
        content = data["log"]["entries"][0]["response"]["content"]
        content["size"] = c.utf8_size(self.BODY)
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_har(data, "finding-1.har")
        self.assertIn("content.size", str(ctx.exception))

    def test_finding_hash_is_of_the_redacted_body(self):
        data = har_doc(self.BODY)
        c.redact_har(data)
        stored = data["log"]["entries"][0]["response"]["content"]["text"].encode("utf-8")
        good = sec_finding([sec_request(stored)])
        c.cross_check_finding_har(good, "finding-1.har", data)
        bad = sec_finding([sec_request(self.BODY.encode("utf-8"))])
        with self.assertRaises(c.Inconsistent):
            c.cross_check_finding_har(bad, "finding-1.har", data)


# ---------------------------------------------------------------------------
# Round 4: every evidence file is scanned; redaction covers requests and responses.
# ---------------------------------------------------------------------------

JWT = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ."
       "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
BCRYPT = "$2b$10$abcdefghijklmnopqrstuuJ8S7ZqLx0lJgqv1nO3gk2Yw5o4i2K6a"
ARGON2 = "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$RdescudvJCsgt3ub+b+dWRWJTmaaJObG"
HEX64 = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
TOKEN40 = "Zk3pQ9vX2mR7tL1wB8nC4yH6jD0sF5gK3aE9uT2q"
UUID = "123e4567-e89b-42d3-a456-426614174000"


def har_with(*, request=None, response_body='{"ok":true}', response_headers=None, response_cookies=None,
             mime="application/json", url="http://127.0.0.1:3000/api/login"):
    req = {"method": "POST", "url": url, "headers": [], "queryString": []}
    req.update(request or {})
    content = {"size": c.utf8_size(response_body), "mimeType": mime, "text": response_body}
    resp = {"status": 200, "headers": response_headers or [], "content": content}
    if response_cookies is not None:
        resp["cookies"] = response_cookies
    return {"log": {"version": "1.2", "entries": [{"request": req, "response": resp}]}}


def scan_run(run_dir, files):
    """Write a clean security run plus extra evidence files; return check_run_dir()."""
    summary = base_summary(body_scan={"ran": True, "hit_count": 0})
    (run_dir / "summary.json").write_text(json.dumps(summary), encoding="utf-8")
    for name, data in files.items():
        target = run_dir / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(data if isinstance(data, str) else json.dumps(data), encoding="utf-8")
    return c.check_run_dir(run_dir)


class EvidenceLeakScanTests(unittest.TestCase):
    def assert_run_rejects(self, files, *needles):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(c.Inconsistent) as ctx:
                scan_run(Path(tmp), files)
        for needle in needles:
            self.assertIn(needle, str(ctx.exception))
        return str(ctx.exception)

    def test_request_json_body_password_rejected(self):
        har = har_with(request={"postData": {"mimeType": "application/json",
                                             "text": '{"email":"a@example.test","password":"hunter2-Secret"}'}})
        self.assert_run_rejects({"probe.har": har}, "probe.har", "entries[0].request.postData", "password")

    def test_request_form_body_rejected(self):
        har = har_with(request={"postData": {"mimeType": "application/x-www-form-urlencoded",
                                             "text": "email=a%40example.test&password=hunter2"}})
        self.assert_run_rejects({"probe.har": har}, "request.postData", "password")

    def test_request_post_params_rejected(self):
        har = har_with(request={"postData": {"mimeType": "application/x-www-form-urlencoded",
                                             "params": [{"name": "password", "value": "hunter2"}]}})
        self.assert_run_rejects({"probe.har": har}, "request.postData.params")

    def test_query_token_rejected(self):
        har = har_with(url="http://127.0.0.1:3000/reset?token=abc123def456ghi",
                       request={"method": "GET", "queryString": [{"name": "token", "value": "abc123def456ghi"}]})
        self.assert_run_rejects({"probe.har": har}, "request.url", "request.queryString")

    def test_authorization_and_cookie_headers_rejected(self):
        har = har_with(request={"headers": [{"name": "Authorization", "value": "Bearer abcDEF1234567890xyz"},
                                            {"name": "Cookie", "value": "theme=dark; sid=s3cr3tValue123"}]})
        self.assert_run_rejects({"probe.har": har}, "request.headers[0]", "request.headers[1]")

    def test_set_cookie_and_cookie_list_rejected(self):
        har = har_with(response_headers=[{"name": "Set-Cookie", "value": "session=abcdef123456; Path=/; HttpOnly"}],
                       response_cookies=[{"name": "session", "value": "abcdef123456"}])
        self.assert_run_rejects({"probe.har": har}, "response.headers[0]", "response.cookies[0]")

    def test_custom_secret_header_rejected_and_pseudo_header_ignored(self):
        har = har_with(request={"headers": [{"name": ":authority", "value": "127.0.0.1:3000"},
                                            {"name": "X-Auth-Token", "value": "f00ba7f00ba7f00ba7"}]})
        message = self.assert_run_rejects({"probe.har": har}, "request.headers[1]")
        self.assertNotIn("request.headers[0]", message)

    def test_har_in_subdirectory_rejected(self):
        # Response hits are caught by the scan-bodies re-scan; request-side secrets by the leak check.
        har = har_with(request={"headers": [{"name": "Authorization", "value": "Bearer abcDEF1234567890xyz"}]})
        self.assert_run_rejects({"evidence/probes/p1.har": har}, "evidence/probes/p1.har")
        har = har_with(response_body=json.dumps({"user": {"passwordHash": BCRYPT}}))
        self.assert_run_rejects({"evidence/probes/p1.har": har}, "hit_count")

    def test_probe_json_and_text_log_rejected(self):
        self.assert_run_rejects({"logs/probe-3.json": {"response": {"user": {"password_hash": BCRYPT}}}},
                                "logs/probe-3.json")
        self.assert_run_rejects({"notes.txt": "login ok, token=abcd1234efgh5678 stored"}, "notes.txt")

    def test_html_response_leak_rejected(self):
        html = ('<form><input type="hidden" name="csrf_token" value="Zx81kq0PLm7Qa2Rt">'
                '<input type="password" name="pw" value="hunter2"></form>')
        har = har_with(response_body=html, mime="text/html")
        self.assert_run_rejects({"probe.har": har}, "response.content")

    def test_redacted_har_passes_run_and_keeps_names(self):
        har = har_with(
            url="http://127.0.0.1:3000/reset?token=abc123def456ghi&page=2",
            request={"headers": [{"name": "Authorization", "value": "Bearer abcDEF1234567890xyz"},
                                 {"name": "Cookie", "value": "theme=dark; sid=s3cr3tValue123"}],
                     "queryString": [{"name": "token", "value": "abc123def456ghi"}, {"name": "page", "value": "2"}],
                     "postData": {"mimeType": "application/json", "text": '{"email":"a@example.test","password":"x1"}'}},
            response_headers=[{"name": "Set-Cookie", "value": "session=abcdef123456; Path=/; HttpOnly"}],
            response_body='<input type="password" name="pw" value="hunter2">', mime="text/html")
        c.redact_har(har, "probe.har")
        entry = har["log"]["entries"][0]
        headers = {h["name"]: h["value"] for h in entry["request"]["headers"]}
        self.assertEqual(headers["Authorization"], "Bearer " + c.REDACTION_MARKER)
        # Every cookie value is redacted (names stay): which cookie carries the session is app-specific.
        self.assertEqual(headers["Cookie"], f"theme={c.REDACTION_MARKER}; sid={c.REDACTION_MARKER}")
        self.assertEqual(entry["response"]["headers"][0]["value"], f"session={c.REDACTION_MARKER}; Path=/; HttpOnly")
        self.assertIn("page=2", entry["request"]["url"])
        self.assertNotIn("abc123def456ghi", json.dumps(har))
        self.assertIn('"password"', entry["request"]["postData"]["text"])
        with tempfile.TemporaryDirectory() as tmp:
            scan_run(Path(tmp), {"probe.har": har})


class RawCopyTests(unittest.TestCase):
    CLEAN = har_with()

    def test_raw_named_files_rejected(self):
        for name in ("probe.raw.har", "unredacted-body.json", "orig/finding-1.har", "original.har"):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as tmp:
                with self.assertRaises(c.Inconsistent) as ctx:
                    scan_run(Path(tmp), {name: self.CLEAN})
                self.assertIn("raw", str(ctx.exception))

    def test_ordinary_names_with_raw_inside_a_word_pass(self):
        with tempfile.TemporaryDirectory() as tmp:
            scan_run(Path(tmp), {"drawer-open.har": self.CLEAN, "screens/withdraw.txt": "ok"})

    def test_secret_har_without_redaction_metadata_named(self):
        har = har_with(request={"postData": {"mimeType": "application/json", "text": '{"apiKey":"super-secret-value"}'}})
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(c.Inconsistent) as ctx:
                scan_run(Path(tmp), {"probe.har": har})
        self.assertIn("_spc_redaction", str(ctx.exception))


class RedactionScopeTests(unittest.TestCase):
    def leaks(self, text, mime=None):
        return c.secret_leaks_in_text(text, mime)

    def test_nested_json_keeps_field_names(self):
        body = json.dumps({"data": {"user": {"email": "a@example.test", "profile": {"password_digest": "abc12345"}},
                                    "sessions": [{"token": "t0k3n-value-1"}], "pin": 4321}})
        new, found = c.redact_text(body, "application/json")
        doc = json.loads(new)
        self.assertEqual(doc["data"]["user"]["profile"]["password_digest"], c.REDACTION_MARKER)
        self.assertEqual(doc["data"]["sessions"][0]["token"], c.REDACTION_MARKER)
        self.assertEqual(doc["data"]["pin"], c.REDACTION_MARKER)
        self.assertEqual(doc["data"]["user"]["email"], "a@example.test")
        self.assertEqual(len(found), 3)

    def test_form_urlencoded(self):
        new, found = c.redact_text("username=bob&password=hunter2&remember=true", "application/x-www-form-urlencoded")
        self.assertEqual(new, f"username=bob&password={c.REDACTION_MARKER}&remember=true")
        self.assertTrue(found)

    def test_multipart(self):
        body = ("--XyZ\r\nContent-Disposition: form-data; name=\"username\"\r\n\r\nbob\r\n"
                "--XyZ\r\nContent-Disposition: form-data; name=\"password\"\r\n\r\nhunter2\r\n"
                "--XyZ\r\nContent-Disposition: form-data; name=\"avatar\"; filename=\"a.txt\"\r\n"
                "Content-Type: text/plain\r\n\r\nhello\r\n--XyZ--\r\n")
        new, found = c.redact_text(body, "multipart/form-data; boundary=XyZ")
        self.assertIn("\r\n\r\nbob\r\n", new)
        self.assertIn(f"\r\n\r\n{c.REDACTION_MARKER}\r\n", new)
        self.assertNotIn("hunter2", new)
        self.assertIn("hello", new)

    def test_html_and_plain_text(self):
        html = '<meta name="csrf-token" content="Zx81kq0PLm7Qa2Rt"><input type="password" value="hunter2">'
        new, _ = c.redact_text(html, "text/html")
        self.assertNotIn("Zx81kq0PLm7Qa2Rt", new)
        self.assertNotIn("hunter2", new)
        self.assertIn('name="csrf-token"', new)
        text_body = "Authorization: Bearer abcDEF1234567890xyz\nuser password = 'hunter2'\nall good"
        new, _ = c.redact_text(text_body, "text/plain")
        self.assertIn("Authorization: Bearer " + c.REDACTION_MARKER, new)
        self.assertNotIn("hunter2", new)
        self.assertIn("all good", new)

    def test_value_shapes_under_any_key(self):
        for value in (BCRYPT, ARGON2, HEX64, TOKEN40, JWT, "pbkdf2_sha256$600000$s0mesalt$Q2hhbmdlTWVQbGVhc2UxMjM0NTY3OA==",
                      "a1b2c3d4e5f60718:" + HEX64):
            with self.subTest(value=value[:12]):
                self.assertTrue(self.leaks(json.dumps({"note": {"value": value}})), value)

    def test_strong_shapes_found_in_text(self):
        for value in (BCRYPT, ARGON2, JWT):
            with self.subTest(value=value[:12]):
                self.assertTrue(self.leaks(f"<p>debug {value} end</p>", "text/html"))
                self.assertTrue(self.leaks(f"const x = '{value}';", "application/javascript"))

    def test_no_false_positives(self):
        doc = {"id": UUID, "trace": UUID, "request_uuid": UUID, "password_min_length": 8, "token_type": "Bearer",
               "password_required": True, "etag": "5d41402abc4b2a76b9719d911017c592", "commit": HEX64[:40],
               "body_hash": "sha256:" + HEX64, "file": "src/pages/OrdersPage.tsx", "count": 12345678901234,
               "label": "Reset your password", "url": "http://127.0.0.1:3000/api/orders?page=2"}
        self.assertEqual(self.leaks(json.dumps(doc)), [])
        self.assertEqual(self.leaks("Passwords must be 8+ chars. Use a token-based flow.", "text/plain"), [])
        self.assertEqual(self.leaks("const password = form.password.value;", "application/javascript"), [])

    def test_summary_target_shas_not_flagged(self):
        summary = base_summary()
        self.assertEqual(c.secret_leaks_in_json(summary), [])

    def test_redaction_is_idempotent(self):
        body = json.dumps({"user": {"password": "x", "hash": BCRYPT}, "jwt": JWT})
        once, found = c.redact_text(body, "application/json")
        self.assertTrue(found)
        twice, again = c.redact_text(once, "application/json")
        self.assertEqual(again, [])
        self.assertEqual(once, twice)

    def test_non_json_body_does_not_crash_and_is_scanned(self):
        self.assertEqual(c.unredacted_secrets("hello world", "text/plain"), [])
        self.assertTrue(c.unredacted_secrets("user=bob&password=hunter2", "application/x-www-form-urlencoded"))
        self.assertTrue(c.unredacted_secrets('{"password": "hunter2", "trunc', "application/json"))

    def test_html_and_js_bodies_are_scanned_not_skipped(self):
        self.assertTrue(c.unredacted_secrets('<input type="password" value="hunter2">', "text/html"))
        self.assertTrue(c.unredacted_secrets(f"window.__T = '{JWT}';", "application/javascript"))

    def test_scan_hits_survive_redaction(self):
        body = json.dumps({"data": {"value": JWT}, "user": {"passwordHash": BCRYPT}})
        data = har_doc(body)
        before = len(c.scan_har_bodies(data, "x.har")["hits"])
        c.redact_har(data, "x.har")
        after = len(c.scan_har_bodies(data, "x.har")["hits"])
        self.assertEqual(before, after)


class BrowserMetricsTests(unittest.TestCase):
    def summary(self, metrics, **extra):
        data = base_summary(track="performance")
        data["browser_metrics"] = metrics
        data.update(extra)
        return data

    def reject(self, summary, needle):
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_summary(summary, "summary.json")
        self.assertIn(needle, str(ctx.exception))

    def test_web_ui_without_browser_metrics_rejected(self):
        data = base_summary(track="performance")
        del data["browser_metrics"]
        self.reject(data, "browser_metrics")

    def test_fewer_than_five_samples_rejected(self):
        self.reject(self.summary(browser_samples(3)), "5")

    def test_order_must_be_interleaved(self):
        metrics = browser_samples()
        metrics["lcp"]["order"] = "sequential"
        self.reject(self.summary(metrics), "interleaved")

    def test_missing_metric_rejected(self):
        metrics = browser_samples()
        del metrics["cls"]
        self.reject(self.summary(metrics), "cls")

    def test_time_budget_skip_needs_exhausted_budget(self):
        metrics = browser_samples()
        metrics["inp-tbt"] = {"skipped": {"kind": "time_budget",
                                          "reason": "the 30 minute budget ran out after LCP and CLS"}}
        self.reject(self.summary(metrics), "time_minutes")
        self.reject(self.summary(metrics, budgets={"probes": {"used": 0, "limit": 20},
                                                   "time_minutes": {"used": 12, "limit": 30}}), "time_minutes")
        c.check_summary(self.summary(metrics, budgets={"probes": {"used": 0, "limit": 20},
                                                       "time_minutes": {"used": 30, "limit": 30}}), "summary.json")

    def test_skip_needs_concrete_reason(self):
        metrics = browser_samples()
        metrics["lcp"] = {"skipped": {"kind": "time_budget", "reason": "n/a"}}
        self.reject(self.summary(metrics, budgets={"probes": {"used": 0, "limit": 20},
                                                   "time_minutes": {"used": 30, "limit": 30}}), "reason")
        metrics["lcp"] = {"skipped": {"kind": "collector_unavailable", "reason": "no browser on this machine today"}}
        self.reject(self.summary(metrics), "collector")

    def test_not_required_outside_web_ui(self):
        data = base_summary(track="performance", performance_scope={"project_type": "api-only", "collectors": ["http"]})
        del data["browser_metrics"]
        c.check_summary(data, "summary.json")

    def test_finding_for_skipped_metric_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_dir = Path(tmp)
            metrics = browser_samples()
            metrics["lcp"] = {"skipped": {"kind": "time_budget", "reason": "the 30 minute budget ran out first"}}
            summary = base_summary(track="performance", browser_metrics=metrics,
                                   budgets={"probes": {"used": 0, "limit": 20},
                                            "time_minutes": {"used": 30, "limit": 30}})
            finding = perf_finding("lcp", base=100, head=150, base_har=None)
            finding["metric"].update({"class": "noisy", "aggregation": "median", "unit": "ms"})
            finding["metric"]["base"]["n"] = finding["metric"]["head"]["n"] = 5
            finding["evidence"] = {"har_path": None, "screenshot": "lcp.png"}
            (run_dir / "summary.json").write_text(json.dumps(summary), encoding="utf-8")
            (run_dir / "finding-1.json").write_text(json.dumps(finding), encoding="utf-8")
            (run_dir / "lcp.png").write_bytes(b"\x89PNG\r\n")
            with self.assertRaises(c.Inconsistent) as ctx:
                c.check_run_dir(run_dir)
            self.assertIn("browser_metrics", str(ctx.exception))


class SummaryTargetAndBudgetTests(unittest.TestCase):
    def reject(self, summary, needle):
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_summary(summary, "summary.json")
        self.assertIn(needle, str(ctx.exception))

    def test_target_needs_base_and_head_sha(self):
        self.reject(base_summary(target={"label": "PR #1"}), "base_sha")
        self.reject(base_summary(target={**TARGET, "head_sha": "main"}), "head_sha")

    def test_probe_budget_is_numeric(self):
        self.reject(base_summary(budgets={"probes": "20 probes"}), "budgets.probes")
        self.reject(base_summary(budgets={"probes": {"used": "3", "limit": 20}}), "budgets.probes")
        self.reject(base_summary(budgets={"probes": {"used": 21, "limit": 20}}), "budgets.probes")
        summary = base_summary()
        del summary["budgets"]
        self.reject(summary, "budgets.probes")
        c.check_summary(base_summary(budgets={"probes": {"used": 20, "limit": 20}}), "summary.json")


class IntroducedEvidenceTests(unittest.TestCase):
    def finding(self, requests, **extra):
        f = sec_finding(requests)
        f.pop("introduced_reason", None)
        f.update(extra)
        return f

    def test_introduced_claim_needs_base_request_or_reason(self):
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_finding(self.finding([sec_request(b"{}")]), "f.json")
        self.assertIn("introduced", str(ctx.exception))
        with self.assertRaises(c.Inconsistent):
            c.check_finding(self.finding([sec_request(b"{}")], introduced=False), "f.json")

    def test_base_request_or_reason_or_unknown_passes(self):
        c.check_finding(self.finding([sec_request(b"{}"), sec_request(b"", side="base")]), "f.json")
        c.check_finding(self.finding([sec_request(b"{}")], introduced_reason="route returns 404 on base"), "f.json")
        c.check_finding(self.finding([sec_request(b"{}")], introduced="unknown"), "f.json")

    def test_side_value_checked(self):
        with self.assertRaises(c.Inconsistent):
            c.check_finding(self.finding([sec_request(b"{}", side="before")]), "f.json")

    def test_introduced_contradicted_by_base_bypass(self):
        access = {"expected_access": "deny", "observed_access": "allow", "access_verdict": "bypassed"}
        f = self.finding([sec_request(b"{}", **access), sec_request(b"", side="base", **access)],
                         signal_id="object-id-access")
        with self.assertRaises(c.Inconsistent) as ctx:
            c.check_finding(f, "f.json")
        self.assertIn("base", str(ctx.exception))

    def test_base_and_head_requests_match_their_own_entries(self):
        head_body, base_body = b'{"id":1}', b""
        har = {"log": {"version": "1.2", "entries": [
            {"request": {"method": "GET", "url": "http://127.0.0.1:3001/api/me"},
             "response": {"status": 404, "content": {"size": 0, "mimeType": "application/json", "text": ""}}},
            {"request": {"method": "GET", "url": "http://127.0.0.1:3000/api/me"},
             "response": {"status": 200, "content": {"size": 8, "mimeType": "application/json",
                                                      "text": head_body.decode()}}},
        ]}}
        f = self.finding([sec_request(head_body, url="http://127.0.0.1:3000/api/me"),
                          sec_request(base_body, url="http://127.0.0.1:3001/api/me", side="base")])
        f["requests"][1]["status"] = 404
        c.cross_check_finding_har(f, "finding-1.har", har)


class DuplicateHarTests(unittest.TestCase):
    def test_identical_hars_rejected(self):
        har = har_with()
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(c.Inconsistent) as ctx:
                scan_run(Path(tmp), {"base.har": har, "head.har": json.loads(json.dumps(har, indent=2))})
            self.assertIn("identical", str(ctx.exception))


class LeakCliTests(unittest.TestCase):
    def test_leaks_and_redact_cli_on_text(self):
        import subprocess
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "probe.log"
            src.write_text("POST /login password=hunter2\nok\n", encoding="utf-8")
            script = [sys.executable, "-B", str(Path(c.__file__))]
            dirty = subprocess.run(script + ["leaks", tmp], capture_output=True, text=True)
            self.assertEqual(dirty.returncode, 2, dirty.stdout + dirty.stderr)
            self.assertIn("probe.log", dirty.stderr)
            out = Path(tmp) / "probe-redacted.log"
            run_cli(["redact", str(src), "--out", str(out)])
            src.unlink()
            self.assertIn("password=" + c.REDACTION_MARKER, out.read_text(encoding="utf-8"))
            run_cli(["leaks", tmp])


class HtmlProseTests(unittest.TestCase):
    """HTML pages: quoted script/attribute data is scanned; visible label text is not a secret."""

    def test_label_prose_not_flagged(self):
        page = "<label>Password: Enter your password</label><p>Token: required</p>"
        self.assertEqual(c.secret_leaks_in_text(page, "text/html"), [])

    def test_inline_script_config_flagged(self):
        page = '<script>window.cfg = {"apiToken": "abc123xyz"}</script>'
        new, found = c.redact_text(page, "text/html")
        self.assertTrue(found)
        self.assertIn('"apiToken": "' + c.REDACTION_MARKER + '"', new)

    def test_plain_text_log_pair_flagged(self):
        self.assertTrue(c.secret_leaks_in_text("password: hunter2", "text/plain"))


if __name__ == "__main__":
    unittest.main()
