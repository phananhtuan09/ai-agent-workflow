"""Unit tests for the runtime E2E impact map and screenshot comparison; run by test/run.js."""
import json
import struct
import sys
import tempfile
import unittest
import zlib
from pathlib import Path

# Keep the skill source free of __pycache__, which the installer would copy.
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "skills/runtime-e2e-test/scripts"))
import evidence  # noqa: E402
import impact  # noqa: E402

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


if __name__ == "__main__":
    unittest.main()
