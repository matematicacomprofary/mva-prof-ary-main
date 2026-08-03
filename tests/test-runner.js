/* =========================================================
   Minimal dependency-free test runner for the MVA landing page.
   Works in any modern browser, no Node/npm/build step required.
   ========================================================= */
(function (global) {
  "use strict";

  const state = { suites: [], current: null, results: [] };

  function describe(name, fn) {
    const suite = { name, tests: [] };
    state.suites.push(suite);
    state.current = suite;
    fn();
    state.current = null;
  }

  function it(name, fn) {
    if (!state.current) {
      state.suites.push({ name: "(root)", tests: [] });
      state.current = state.suites[state.suites.length - 1];
    }
    state.current.tests.push({ name, fn });
  }

  function assert(cond, message) {
    if (!cond) throw new Error(message || "Assertion failed");
  }

  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(
        (message ? message + " — " : "") + `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  }

  function assertClose(actual, expected, tolerance, message) {
    tolerance = tolerance === undefined ? 0.001 : tolerance;
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(
        (message ? message + " — " : "") + `expected ≈${expected}, got ${actual}`
      );
    }
  }

  async function run() {
    const results = [];
    for (const suite of state.suites) {
      for (const t of suite.tests) {
        const entry = { suite: suite.name, name: t.name, pass: false, error: null };
        try {
          await t.fn();
          entry.pass = true;
        } catch (err) {
          entry.error = err && err.message ? err.message : String(err);
        }
        results.push(entry);
      }
    }
    state.results = results;
    return results;
  }

  function renderResults(results, mountEl) {
    const total = results.length;
    const passed = results.filter((r) => r.pass).length;
    const failed = total - passed;

    const summary = document.createElement("div");
    summary.className = "trs-summary " + (failed === 0 ? "trs-ok" : "trs-fail");
    summary.textContent = `${passed}/${total} testes passaram` + (failed ? ` — ${failed} falharam` : "");
    mountEl.appendChild(summary);

    const bySuite = {};
    results.forEach((r) => {
      (bySuite[r.suite] = bySuite[r.suite] || []).push(r);
    });

    Object.keys(bySuite).forEach((suiteName) => {
      const box = document.createElement("div");
      box.className = "trs-suite";
      const h = document.createElement("h3");
      h.textContent = suiteName;
      box.appendChild(h);
      const ul = document.createElement("ul");
      bySuite[suiteName].forEach((r) => {
        const li = document.createElement("li");
        li.className = r.pass ? "trs-pass" : "trs-fail-item";
        li.textContent = (r.pass ? "✔ " : "✘ ") + r.name + (r.error ? ` — ${r.error}` : "");
        ul.appendChild(li);
      });
      box.appendChild(ul);
      mountEl.appendChild(box);
    });

    return { total, passed, failed };
  }

  global.TestKit = { describe, it, assert, assertEqual, assertClose, run, renderResults };
})(window);
