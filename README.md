# Title Undecided — Home Design Lab

Independent Home prototypes. No production application code, music, personal data, browser storage, service workers, or installation metadata are included. Navigation and Search open prototype notices. Theme and opening-view selections are temporary and reset on reload.

## Previews

- [Comparison](https://utahbug.github.io/MusicTranspose-DesignLab/)
- [A — Professional navigation buttons](https://utahbug.github.io/MusicTranspose-DesignLab/a.html)
- [B — Compact music dashboard](https://utahbug.github.io/MusicTranspose-DesignLab/b.html)
- [C — Traditional music library](https://utahbug.github.io/MusicTranspose-DesignLab/c.html)

## Comparison

| Criterion | A | B | C |
|---|---|---|---|
| Professional appearance | Familiar, conservative | Modern, restrained | Orderly, document-oriented |
| Navigation and button affordance | Strong bordered rows | Strong cards and arrows | Clear rows; more subtle affordance |
| Hierarchy | Simple vertical sections | Clear Music / Personal grouping | Separate organization column |
| iPhone | Easy scanning; longest scroll | Single-column, substantial targets | Compact rows; organization stacks |
| iPad | Familiar but narrow | Best use of two columns | Efficient side-by-side sections |
| Desktop efficiency | Lowest | High | High |
| Existing-app consistency | Closest | Same identity, new grouping | Same identity, library emphasis |
| Estimated integration effort | Low | Moderate responsive-layout work | Moderate column-layout work |

**Recommendation: B.** It makes collection navigation prominent and uses tablet/desktop width effectively while retaining clear phone buttons. This recommendation does not authorize or implement production integration.

## Local preview

Run `python -m http.server 8788 --bind 127.0.0.1` in this directory, then open `http://127.0.0.1:8788/`. No build step is required.

## Validation and screenshots

`tests/previews.mjs` exercises Chromium (Edge) and WebKit with disposable browser contexts at 320, 390, 820, 1194, and 1440 CSS pixels. It checks both themes, text contrast, target geometry, overflow, footer clearance, keyboard focus, prototype dialogs, Search, temporary choices, and prohibited storage access. The script uses the installed Codex Playwright runtime; adjust its import location for another development environment.

Responsive Chromium captures are in [screenshots](screenshots), named `a-light-320.png` through `c-dark-1440.png`. WebKit captures and machine-readable results are local diagnostics in ignored `test-results/`.

Physical iPhone/iPad testing remains outstanding. Navigation and music functionality are intentionally not implemented. Future integration would require separate production behavior, accessibility, and regression testing.

## Round 2 — Hybrid

[Open Hybrid](https://utahbug.github.io/MusicTranspose-DesignLab/hybrid.html). A, B, and C remain unchanged.

Hybrid uses defined single-column buttons at 700px and below, and compact two-column collection cards above 700px. The temporary Score/Lyrics preference occupies its own upper-right row above the heading. Slate/Blue, Sage/Forest, and Ivory/Navy each have deliberately coordinated Light and Dark colors, with selective emphasis on All Music and the active footer action. Palette changes do not rebuild navigation or persist browser state.

`tests/hybrid.mjs` covers both browser engines at 320, 390, 600, 744, 820, 1024, 1194, and 1440px. Screenshots use `hybrid-{palette}-{theme}-{width}.png`. Automated checks cover layout columns, preference position, 44px targets, contrast, overflow, footer clearance, keyboard focus, dialogs, Search, temporary choices, and prohibited storage access. Physical-device and assistive-technology testing remain outstanding.
