"""Unit tests for the runtime E2E impact map and screenshot comparison; run by test/run.js."""
import json
import struct
import sys
import tempfile
import unittest
import zipfile
import zlib
from pathlib import Path

# Keep the skill source free of __pycache__, which the installer would copy.
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "skills/runtime-e2e-test/scripts"))
import evidence  # noqa: E402
import impact  # noqa: E402

import report  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "skills/runtime-e2e-test"))
import validate_test_plan  # noqa: E402

ROUTES = [
    {"route": "/invoices", "file": "src/pages/Invoices.tsx"},
    {"route": "/invoices/:id", "file": "src/pages/Invoice.tsx"},
    {"route": "/invoices/new", "file": "src/pages/Form.tsx"},
    {"route": "/invoices/:id/edit", "file": "src/pages/Form.tsx"},
    {"route": "/reports", "file": "src/pages/Reports.tsx"},
    {"route": "/settings", "file": "src/pages/Settings.tsx"},
]

# A small project: every page uses Button; two pages format money; Reports reaches the money helper only through a widget.
SOURCES = {
    "src/main.tsx": "import './styles/global.css';\nimport { App } from './App';",
    "src/App.tsx": "import Invoices from './pages/Invoices';\nimport Invoice from './pages/Invoice';\nconst Form = () => import('./pages/Form');",
    "src/styles/global.css": "@import './tokens.css';\nbody { margin: 0; }",
    "src/styles/tokens.css": ":root { --gap: 4px; }",
    "src/components/Button.tsx": "export function Button() {}",
    "src/components/index.ts": "export { Button } from './Button';",
    "src/lib/money.ts": "export const formatMoney = () => '';",
    "src/widgets/Chart.tsx": "import { formatMoney } from '@/lib/money';",
    "src/pages/Invoices.tsx": "import { Button } from '../components';\nimport { formatMoney } from '../lib/money';\nimport React from 'react';",
    "src/pages/Invoice.tsx": "import { Button } from '../components/Button';\nconst { formatMoney } = require('../lib/money');",
    "src/pages/Form.tsx": "import { Button } from '../components';",
    "src/pages/Reports.tsx": "import { Button } from '../components';\nimport Chart from '../widgets/Chart';",
    "src/pages/Settings.tsx": "import { Button } from '../components';",
}


def config(**overrides):
    return impact.config_of({"sources": ["src"], "aliases": {"@/": "src/"}, "routes": ROUTES,
                             "shared": ["src/styles/*"], "fanIn": 3, "budget": 2, **overrides})


def edges():
    return impact.graph(SOURCES, {"@/": "src/"})


class ImportGraph(unittest.TestCase):
    def test_specifiers_cover_each_import_form(self):
        text = "import a from './a';\nimport './side.css';\nexport { b } from \"./b\";\nimport('./c');\nrequire('./d');\n@import url('./e.css');"
        self.assertEqual(impact.specifiers(text), ["./a", "./side.css", "./b", "./c", "./d", "./e.css"])

    def test_resolution_handles_extensions_index_files_aliases_and_packages(self):
        files = set(SOURCES)
        self.assertEqual(impact.resolve("../components", "src/pages/Invoices.tsx", files, {}), "src/components/index.ts")
        self.assertEqual(impact.resolve("../lib/money", "src/pages/Invoices.tsx", files, {}), "src/lib/money.ts")
        self.assertEqual(impact.resolve("@/lib/money", "src/widgets/Chart.tsx", files, {"@/": "src/"}), "src/lib/money.ts")
        self.assertIsNone(impact.resolve("react", "src/pages/Invoices.tsx", files, {}))
        self.assertIsNone(impact.resolve("./missing", "src/pages/Invoices.tsx", files, {}))

    def test_graph_links_dynamic_imports_requires_and_css(self):
        graph = edges()
        self.assertIn("src/pages/Form.tsx", graph["src/App.tsx"])
        self.assertIn("src/lib/money.ts", graph["src/pages/Invoice.tsx"])
        self.assertEqual(graph["src/styles/global.css"], ["src/styles/tokens.css"])


class Tiers(unittest.TestCase):
    def test_low_fan_in_change_selects_every_consumer_route_with_its_chain(self):
        found = impact.impact(edges(), ["src/lib/money.ts"], config())
        self.assertEqual([r["route"] for r in found["selected"]], ["/invoices", "/invoices/:id", "/reports"])
        self.assertEqual({r["tier"] for r in found["selected"]}, {"direct"})
        reports = next(r for r in found["selected"] if r["route"] == "/reports")
        self.assertIn("src/widgets/Chart.tsx", reports["reason"])
        self.assertEqual(found["notTested"], [])

    def test_high_fan_in_change_is_budgeted_and_the_rest_is_listed_not_dropped(self):
        found = impact.impact(edges(), ["src/components/Button.tsx"], config())
        self.assertEqual(found["changed"][0]["fanIn"], 6)  # routes reached; Form serves two
        self.assertEqual(len(found["selected"]), 2)
        self.assertEqual({r["tier"] for r in found["selected"]}, {"shared"})
        selected = {r["route"] for r in found["selected"]}
        listed = {r["route"] for r in found["notTested"]}
        self.assertEqual(selected | listed, {"/invoices", "/invoices/:id", "/invoices/new", "/invoices/:id/edit", "/reports", "/settings"})
        self.assertFalse(selected & listed)

    def test_a_direct_reason_outranks_a_shared_one(self):
        found = impact.impact(edges(), ["src/components/Button.tsx", "src/lib/money.ts"], config())
        tiers = {r["route"]: r["tier"] for r in found["selected"]}
        self.assertEqual(tiers["/invoices"], "direct")
        self.assertEqual(tiers["/invoices/:id"], "direct")
        self.assertEqual(sum(t == "shared" for t in tiers.values()), 2)

    def test_one_page_serving_two_routes_reaches_both(self):
        found = impact.impact(edges(), ["src/pages/Form.tsx"], config())
        self.assertEqual([r["route"] for r in found["selected"]], ["/invoices/:id/edit", "/invoices/new"])

    def test_global_css_is_a_shared_surface_the_graph_cannot_place(self):
        found = impact.impact(edges(), ["src/styles/tokens.css"], config())
        self.assertEqual(found["shared"], ["src/styles/tokens.css"])
        self.assertEqual(found["untraced"], ["src/styles/tokens.css"])
        self.assertEqual(found["selected"], [])
        self.assertTrue(found["warnings"])

    def test_direct_tier_over_budget_is_kept_with_a_warning(self):
        found = impact.impact(edges(), ["src/lib/money.ts"], config(budget=1))
        self.assertEqual(len(found["selected"]), 3)
        self.assertEqual(len(found["warnings"]), 1)

    def test_result_does_not_depend_on_input_order(self):
        changed = ["src/lib/money.ts", "src/components/Button.tsx"]
        reordered = dict(reversed(list(SOURCES.items())))
        self.assertEqual(impact.impact(edges(), changed, config()),
                         impact.impact(impact.graph(reordered, {"@/": "src/"}), list(reversed(changed)), config()))

    def test_config_rejects_unknown_keys_and_missing_budget(self):
        with self.assertRaises(ValueError):
            impact.config_of({"sources": ["src"], "routes": ROUTES, "fanIn": 3, "budget": 2, "depth": 4})
        with self.assertRaises(ValueError):
            impact.config_of({"sources": ["src"], "routes": ROUTES, "fanIn": 3})


def png(width, height, pixels, filters):
    """Encode RGBA rows with the given PNG filter type per row, as a real encoder may."""
    raw, previous = b"", bytes(width * 4)
    for y in range(height):
        line = bytes(c for x in range(width) for c in pixels(x, y))
        kind = filters[y % len(filters)]
        out = bytearray(line)
        for i in range(len(line)):
            left = line[i - 4] if i >= 4 else 0
            up, corner = previous[i], previous[i - 4] if i >= 4 else 0
            if kind == 1:
                out[i] = (line[i] - left) & 255
            elif kind == 2:
                out[i] = (line[i] - up) & 255
            elif kind == 3:
                out[i] = (line[i] - (left + up) // 2) & 255
            elif kind == 4:
                guess = left + up - corner
                pa, pb, pc = abs(guess - left), abs(guess - up), abs(guess - corner)
                out[i] = (line[i] - (left if pa <= pb and pa <= pc else up if pb <= pc else corner)) & 255
        raw += bytes([kind]) + bytes(out)
        previous = line
    chunk = lambda kind, body: struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body))
    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")


class Screenshots(unittest.TestCase):
    def test_changed_pixels_counts_differences_across_all_filter_types(self):
        gradient = lambda x, y: (x * 20 % 256, y * 30 % 256, (x + y) * 7 % 256, 255)
        marked = lambda x, y: (255, 0, 0, 255) if (x, y) in {(2, 1), (5, 4)} else gradient(x, y)
        with tempfile.TemporaryDirectory() as folder:
            base, head, other = Path(folder, "base.png"), Path(folder, "head.png"), Path(folder, "other.png")
            base.write_bytes(png(8, 6, gradient, [0, 1, 2, 3, 4]))
            head.write_bytes(png(8, 6, marked, [4, 3, 2, 1, 0]))
            other.write_bytes(png(8, 6, gradient, [2]))
            self.assertEqual(evidence.changed_pixels(base, other), 0)
            self.assertEqual(evidence.changed_pixels(base, head), 2)
            # A one-unit channel shift is rendering jitter, not a change.
            jitter = lambda x, y: tuple(min(c + 1, 255) for c in gradient(x, y)) if (x, y) == (3, 3) else gradient(x, y)
            shifted = Path(folder, "shifted.png")
            shifted.write_bytes(png(8, 6, jitter, [1]))
            self.assertEqual(evidence.changed_pixels(base, shifted), 0)
            resized = Path(folder, "resized.png")
            resized.write_bytes(png(8, 7, gradient, [0]))
            self.assertIsNone(evidence.changed_pixels(base, resized))


def trace_zip(path):
    """A Playwright-shaped trace: test steps, the library calls behind them, screencast frames and an input box."""
    test = [
        {"type": "before", "callId": "hook@1", "method": "hook", "title": "Before Hooks", "startTime": 1},
        {"type": "before", "callId": "pw:api@2", "parentId": "hook@1", "method": "pw:api", "title": "Create page", "startTime": 2},
        {"type": "after", "callId": "pw:api@2", "endTime": 3},
        {"type": "after", "callId": "hook@1", "endTime": 4},
        {"type": "before", "callId": "pw:api@5", "method": "pw:api", "title": "Navigate", "subtitle": "/label", "startTime": 10},
        {"type": "after", "callId": "pw:api@5", "endTime": 20},
        {"type": "before", "callId": "pw:api@8", "method": "pw:api", "title": "Fill \"s3cret\"", "subtitle": "getByLabel('Password')", "startTime": 20},
        {"type": "after", "callId": "pw:api@8", "endTime": 20},
        {"type": "before", "callId": "pw:api@6", "method": "pw:api", "title": "Click", "subtitle": "getByRole('button')", "startTime": 21},
        {"type": "after", "callId": "pw:api@6", "endTime": 30},
        {"type": "before", "callId": "expect@7", "method": "expect", "title": "Expect \"toHaveText\"", "subtitle": "getByRole('heading')", "startTime": 31},
        {"type": "after", "callId": "expect@7", "endTime": 32, "error": {"message": "expected new, got old"}},
    ]
    library = [
        {"type": "before", "callId": "call@1", "stepId": "pw:api@6", "method": "click"},
        {"type": "input", "callId": "call@1", "box": {"x": 10, "y": 20, "width": 30, "height": 40}},
        {"type": "screencast-frame", "file": "screencast/a.jpeg", "timestamp": 15, "width": 100, "height": 50},
        {"type": "screencast-frame", "file": "screencast/b.jpeg", "timestamp": 25, "width": 100, "height": 50},
    ]
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("test.trace", "\n".join(json.dumps(e) for e in test))
        archive.writestr("1-trace.trace", "\n".join(json.dumps(e) for e in library))
        archive.writestr("screencast/a.jpeg", b"frame-a")
        archive.writestr("screencast/b.jpeg", b"frame-b")


class Report(unittest.TestCase):
    def test_trace_steps_come_from_the_trace_with_frames_and_target_boxes(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder, "trace.zip")
            trace_zip(path)
            steps = report.trace_steps(path)
        # Hooks and fixtures are setup, not the case's steps.
        # Typed values never reach the report.
        self.assertEqual([s["title"] for s in steps], ["Navigate", "Fill (value hidden)", "Click", 'Expect "toHaveText"'])
        self.assertEqual(steps[2]["box"], (10, 20, 30, 40))
        self.assertEqual(steps[0]["image"][0], b"frame-a")
        self.assertEqual(steps[2]["image"][0], b"frame-b")
        # The assertion ended on the same frame as the click, so it is not embedded twice.
        self.assertIsNone(steps[3]["image"])
        self.assertEqual(steps[3]["error"], "expected new, got old")

    def test_a_broken_trace_yields_no_steps(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder, "trace.zip")
            path.write_bytes(b"not a zip")
            self.assertEqual(report.trace_steps(path), [])

    def test_changed_box_bounds_every_changed_pixel(self):
        flat = lambda x, y: (255, 255, 255, 255)
        marked = lambda x, y: (0, 0, 0, 255) if (x, y) in {(2, 1), (5, 4)} else flat(x, y)
        with tempfile.TemporaryDirectory() as folder:
            base, head = Path(folder, "base.png"), Path(folder, "head.png")
            base.write_bytes(png(8, 6, flat, [0]))
            head.write_bytes(png(8, 6, marked, [0]))
            self.assertEqual(report.changed_box(base, head), ((2, 1, 4, 4), (8, 6)))
            self.assertEqual(report.changed_box(base, base), (None, (8, 6)))


class Completion(unittest.TestCase):
    def test_uncovered_routes_block_and_sweep_differences_need_review(self):
        with tempfile.TemporaryDirectory() as folder:
            results = Path(folder, "results.json")
            results.write_text(json.dumps({
                "regression": {"missing": ["/report"]},
                "sweep": {"routes": [{"route": "/label", "differs": ["text"]}, {"route": "/help", "differs": []}], "notCompared": ["SWEEP-2"]},
            }))
            self.assertEqual(validate_test_plan.regression_open(Path(folder)), (["/report"], ["/label", "SWEEP-2"]))
            results.write_text(json.dumps({"regression": {"error": "base revision did not resolve", "missing": []}}))
            self.assertEqual(validate_test_plan.regression_open(Path(folder))[0], ["impact map not available"])
            results.write_text(json.dumps({"cases": []}))
            self.assertEqual(validate_test_plan.regression_open(Path(folder)), ([], []))

    def test_blind_spot_questions_need_review(self):
        with tempfile.TemporaryDirectory() as folder:
            Path(folder, "results.json").write_text(json.dumps({"blindSpots": {"applied": [], "skipped": [], "questions": [{"item": "viewport-mobile", "question": "Truncate or wrap?", "cases": []}]}}))
            self.assertEqual(validate_test_plan.regression_open(Path(folder)), ([], ["viewport-mobile"]))


class BlindSpots(unittest.TestCase):
    ITEMS = ["input-empty", "state-error", "viewport-mobile"]

    def check(self, entries, ids=("E2E-01", "E2E-02")):
        evidence.blind_spots_contract(entries, list(ids), self.ITEMS)

    def test_the_installed_catalog_lists_items_by_id(self):
        items = evidence.catalog()
        self.assertIn("interrupt-double-submit", items)
        self.assertIn("viewport-mobile", items)
        self.assertEqual(len(items), len(set(items)))
        with tempfile.TemporaryDirectory() as folder:
            self.assertIsNone(evidence.catalog(Path(folder, "blind-spots.md")))
            edited = Path(folder, "blind-spots.md")
            edited.write_text("| ID | Generator | What |\n| --- | --- | --- |\n| `own-item` | state | Project rule |\n")
            self.assertEqual(evidence.catalog(edited), ["own-item"])

    def test_every_item_is_applied_skipped_or_asked(self):
        self.check([{"item": "input-empty", "cases": ["E2E-01"]}, {"item": "state-error", "skipped": "No request changed"},
                    {"item": "viewport-mobile", "question": "Truncate or wrap long names?", "cases": ["E2E-02"]}])
        for entries, message in [
            ([{"item": "input-empty", "cases": ["E2E-01"]}, {"item": "state-error", "skipped": "x"}], "missing: viewport-mobile"),
            ([{"item": i, "skipped": "x"} for i in self.ITEMS] + [{"item": "made-up", "skipped": "x"}], "made-up"),
            ([{"item": "input-empty", "cases": ["E2E-09"]}, {"item": "state-error", "skipped": "x"}, {"item": "viewport-mobile", "skipped": "x"}], "must name suite cases"),
            ([{"item": "input-empty", "cases": ["E2E-01"], "skipped": "x"}, {"item": "state-error", "skipped": "x"}, {"item": "viewport-mobile", "skipped": "x"}], "one of"),
            ([{"item": "input-empty", "skipped": " "}, {"item": "state-error", "skipped": "x"}, {"item": "viewport-mobile", "skipped": "x"}], "needs text"),
            (None, "Declare blindSpots"),
        ]:
            with self.assertRaises(ValueError) as raised:
                self.check(entries)
            self.assertIn(message, str(raised.exception))

    def test_no_catalog_means_no_declaration(self):
        evidence.blind_spots_contract(None, ["E2E-01"], None)
        with self.assertRaises(ValueError):
            evidence.blind_spots_contract([], ["E2E-01"], None)


class Environment(unittest.TestCase):
    def signals(self, env=None, spec=""):
        with tempfile.TemporaryDirectory() as folder:
            Path(folder, "case.spec.ts").write_text(spec)
            data = {"files": ["case.spec.ts"], "determinism": {"env": env or {}}}
            return evidence.environment_check(Path(folder), data)

    def test_local_targets_raise_nothing(self):
        found = self.signals({"BASE_URL": "http://localhost:5173", "API": "http://127.0.0.1:3001/api", "IPV6": "http://[::1]:5173"},
                             "baseURL: `http://localhost:${webPort}`,\nawait page.goto('http://app.test/orders'); // see https://example.com/docs")
        self.assertEqual(found, {"strong": [], "weak": []})

    def test_production_hosts_and_real_credentials_are_strong(self):
        found = self.signals({"BASE_URL": "https://shop.example.com"}, "const key = 'AKIAABCDEFGHIJKLMNOP';\nawait page.goto(`https://admin.example.com/login`);")
        self.assertEqual(len(found["strong"]), 3, found)
        self.assertTrue(any("production-like host shop.example.com" in x for x in found["strong"]))

    def test_shared_stages_private_networks_and_named_secrets_are_weak(self):
        found = self.signals({"BASE_URL": "https://staging.example.com", "API": "http://10.0.0.5:8080", "API_TOKEN": "fixture-token"})
        self.assertEqual(found["strong"], [])
        self.assertEqual(len(found["weak"]), 3, found)
        self.assertEqual(len(self.signals(spec="const url = `https://${host}/api`;")["weak"]), 1)


class Measurements(unittest.TestCase):
    def test_a_missing_actual_is_unmeasured_but_a_recorded_null_is_not(self):
        observed = {"checks": [{"id": "lines", "expected": 1}, {"id": "title", "expected": "Jan 5, 2026", "actual": None}]}
        self.assertEqual(evidence.unmeasured_checks(observed), ["lines"])
        self.assertEqual(evidence.unmeasured_checks({"checks": "broken"}), [])


if __name__ == "__main__":
    unittest.main()
