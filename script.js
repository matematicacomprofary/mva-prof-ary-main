/* =========================================================
   MVA · Prof. Ary — Landing Page interactivity
   Vanilla JS, no build step, no external runtime dependency
   besides the vendored KaTeX bundle.
   ========================================================= */
(function () {
  "use strict";

  /** Renders a LaTeX string into an element using the vendored KaTeX. */
  function renderMath(el, tex, displayMode) {
    if (!el || typeof window.katex === "undefined") return;
    try {
      window.katex.render(tex, el, {
        throwOnError: false,
        displayMode: !!displayMode,
        strict: "ignore",
      });
    } catch (err) {
      el.textContent = tex;
    }
  }

  function renderStaticFormulas(root) {
    (root || document).querySelectorAll("[data-katex]").forEach((el) => {
      renderMath(el, el.getAttribute("data-katex"), el.hasAttribute("data-katex-display"));
    });
  }

  /* ---------------- Math helpers ---------------- */
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      [a, b] = [b, a % b];
    }
    return a || 1;
  }

  function toNum(el, fallback) {
    const v = parseFloat(el.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function fmt(n) {
    if (!Number.isFinite(n)) return "—";
    const rounded = Math.round(n * 10000) / 10000;
    return rounded.toString().replace(".", ",");
  }

  /* ---------------- Fractions calculator ---------------- */
  function initFractions() {
    const n1 = document.getElementById("fr-n1");
    const d1 = document.getElementById("fr-d1");
    const op = document.getElementById("fr-op");
    const n2 = document.getElementById("fr-n2");
    const d2 = document.getElementById("fr-d2");
    const formulaEl = document.getElementById("fr-formula");
    const resultText = document.getElementById("fr-result-text");
    if (!n1 || !d1 || !op || !n2 || !d2 || !formulaEl || !resultText) return;

    const opSymbols = { add: "+", sub: "-", mul: "\\times", div: "\\div" };

    function update() {
      const a = toNum(n1, 0);
      const b = toNum(d1, 1) || 1;
      const c = toNum(n2, 0);
      const d = toNum(d2, 1) || 1;
      const operation = op.value;

      let rn, rd;
      switch (operation) {
        case "add":
          rn = a * d + c * b;
          rd = b * d;
          break;
        case "sub":
          rn = a * d - c * b;
          rd = b * d;
          break;
        case "mul":
          rn = a * c;
          rd = b * d;
          break;
        case "div":
        default:
          rn = a * d;
          rd = b * c;
          break;
      }

      let tex;
      let text;
      if (!Number.isFinite(rd) || rd === 0) {
        tex = `\\frac{${a}}{${b}} ${opSymbols[operation]} \\frac{${c}}{${d}} = \\text{indefinido}`;
        text = "Divisão por zero: ajuste os valores.";
      } else {
        const g = gcd(rn, rd) || 1;
        let simplifiedNum = rn / g;
        let simplifiedDen = rd / g;
        if (simplifiedDen < 0) {
          simplifiedDen *= -1;
          simplifiedNum *= -1;
        }
        const simplified = `\\frac{${simplifiedNum}}{${simplifiedDen}}`;
        const decimal = fmt(rn / rd);
        tex = `\\frac{${a}}{${b}} ${opSymbols[operation]} \\frac{${c}}{${d}} = \\frac{${rn}}{${rd}} = ${simplified}`;
        text = `Resultado simplificado: ${simplifiedNum}/${simplifiedDen} (≈ ${decimal})`;
      }
      renderMath(formulaEl, tex, true);
      resultText.textContent = text;
    }

    [n1, d1, op, n2, d2].forEach((el) => el.addEventListener("input", update));
    update();
  }

  /* ---------------- Percentage calculator ---------------- */
  function initPercent() {
    const percentEl = document.getElementById("pc-percent");
    const valueEl = document.getElementById("pc-valor");
    const formulaEl = document.getElementById("pc-formula");
    const resultText = document.getElementById("pc-result-text");
    if (!percentEl || !valueEl || !formulaEl || !resultText) return;

    function update() {
      const p = toNum(percentEl, 0);
      const v = toNum(valueEl, 0);
      const result = (p / 100) * v;
      const g = gcd(Math.round(p * 100), 10000) || 1;
      const fracNum = Math.round(p * 100) / g;
      const fracDen = 10000 / g;
      const tex = `${fmt(p)}\\% \\text{ de } ${fmt(v)} = \\frac{${fmt(p)}}{100} \\times ${fmt(v)} = ${fmt(result)}`;
      renderMath(formulaEl, tex, true);
      resultText.textContent = `${fmt(p)}% equivale à fração ${fracNum}/${fracDen} — e de ${fmt(v)} o resultado é ${fmt(result)}.`;
    }

    [percentEl, valueEl].forEach((el) => el.addEventListener("input", update));
    update();
  }

  /* ---------------- Rule of three (direct) ---------------- */
  function initRuleOfThree() {
    const aEl = document.getElementById("r3-a");
    const bEl = document.getElementById("r3-b");
    const cEl = document.getElementById("r3-c");
    const formulaEl = document.getElementById("r3-formula");
    const resultText = document.getElementById("r3-result-text");
    if (!aEl || !bEl || !cEl || !formulaEl || !resultText) return;

    function update() {
      const a = toNum(aEl, 0);
      const b = toNum(bEl, 0);
      const c = toNum(cEl, 0);
      const tex = `\\frac{${fmt(a)}}{${fmt(b)}} = \\frac{${fmt(c)}}{x}`;
      renderMath(formulaEl, tex, true);
      if (a === 0) {
        resultText.textContent = "Defina um valor diferente de zero para 'a'.";
        return;
      }
      const x = (b * c) / a;
      resultText.textContent = `x = (b × c) / a = (${fmt(b)} × ${fmt(c)}) / ${fmt(a)} = ${fmt(x)}`;
    }

    [aEl, bEl, cEl].forEach((el) => el.addEventListener("input", update));
    update();
  }

  /* ---------------- First-degree equation ---------------- */
  function initEquation() {
    const aEl = document.getElementById("eq-a");
    const bEl = document.getElementById("eq-b");
    const cEl = document.getElementById("eq-c");
    const formulaEl = document.getElementById("eq-formula");
    const resultText = document.getElementById("eq-result-text");
    if (!aEl || !bEl || !cEl || !formulaEl || !resultText) return;

    function update() {
      const a = toNum(aEl, 0);
      const b = toNum(bEl, 0);
      const c = toNum(cEl, 0);
      const bSign = b >= 0 ? "+" : "-";
      const bAbs = Math.abs(b);
      const tex = `${fmt(a)}x ${bSign} ${fmt(bAbs)} = ${fmt(c)}`;
      renderMath(formulaEl, tex, true);
      if (a === 0) {
        resultText.textContent = "Defina um valor diferente de zero para 'a'.";
        return;
      }
      const x = (c - b) / a;
      resultText.textContent = `x = (c − b) / a = (${fmt(c)} − ${fmt(b)}) / ${fmt(a)} = ${fmt(x)}`;
    }

    [aEl, bEl, cEl].forEach((el) => el.addEventListener("input", update));
    update();
  }

  /* ---------------- Accessible tabs ---------------- */
  function initTabs() {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    function selectTab(tab) {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      tab.focus();
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectTab(tab));
      tab.addEventListener("keydown", (e) => {
        let newIndex = null;
        if (e.key === "ArrowRight") newIndex = (index + 1) % tabs.length;
        if (e.key === "ArrowLeft") newIndex = (index - 1 + tabs.length) % tabs.length;
        if (newIndex !== null) {
          e.preventDefault();
          selectTab(tabs[newIndex]);
        }
      });
    });
  }

  /* ---------------- FAQ accordion ---------------- */
  function initFaq() {
    document.querySelectorAll(".faq-item button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        const answer = document.getElementById(btn.getAttribute("aria-controls"));
        btn.setAttribute("aria-expanded", String(!expanded));
        if (answer) answer.hidden = expanded;
      });
    });
  }

  /* ---------------- Mobile nav ---------------- */
  function initNav() {
    const toggle = document.getElementById("navToggle");
    const header = document.getElementById("site-header");
    const nav = document.getElementById("mainNav");
    if (!toggle || !header || !nav) return;

    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- Video Play Overlay ---------------- */
  function initVideoOverlays() {
    document.querySelectorAll(".phone-frame").forEach((frame) => {
      const video = frame.querySelector("video");
      const btn = frame.querySelector(".phone-play-btn");
      if (!video || !btn) return;

      btn.addEventListener("click", () => {
        video.muted = false;
        const p = video.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => {
            video.muted = true;
            video.play();
          });
        }
      });

      video.addEventListener("play", () => btn.classList.add("is-hidden"));
      video.addEventListener("pause", () => btn.classList.remove("is-hidden"));
      video.addEventListener("ended", () => btn.classList.remove("is-hidden"));
    });
  }

  function initFooterYear() {
    const el = document.getElementById("ano-atual");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderStaticFormulas(document);
    initTabs();
    initFractions();
    initPercent();
    initRuleOfThree();
    initEquation();
    initFaq();
    initNav();
    initFooterYear();
    initVideoOverlays();
  });

  // Expose for the visual test suite (loaded inside iframes pointing at this file).
  window.MVA = {
    renderMath,
    renderStaticFormulas,
    gcd,
    fmt,
  };
})();
