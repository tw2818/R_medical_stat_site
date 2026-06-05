#!/usr/bin/env python3
"""
Build inline critical CSS block from v2.css.

Strategy: take contiguous line ranges that correspond to above-the-fold
layout + theme tokens + transitions + media queries. Strip section banner
comments (/* ===== Foo ===== */) to save bytes. Keep the original
formatting of the rules themselves (so the line ranges stay 1:1 with
v2.css for easy review).

Sections included (line ranges from v2.css, 1-indexed):
  16-66    :root + [data-theme=light] tokens
  69-100   [data-theme=dark] tokens
  103-111  body.v2-active base
  113-115  body.v2-active *  (global border-color reset)
  118-123  #app grid
  126-136  #sidebar
  138-159  .sidebar-header + h1 + subtitle
  161-182  .search-box (input + base + focus)
  195-201  .search-result
  204-237  #chapter-nav + .nav-group + .v2-nav-label + .nav-group-header
  247-254  .chapter-count
  261-263  .nav-group-content
  265-287  .nav-item + hover + active
  294-329  a.chapter-link + variants
  332-358  .nav-group-header !important + ::after caret
  361-369  .sidebar-footer
  371-389  .progress-ring-text + .progress-info + #progress-text
  391-396  .progress-bar
  398-405  .last-chapter
  407-426  .btn-continue + hover
  428-447  .btn-reset-progress
  450-471  #main-content + #topbar + [data-theme=dark] #topbar
  473-499  #topbar-title + #theme-toggle + hover
  501-520  #home-btn + hover
  523-623  .welcome-hero (h1, lead, lead-sub, keyword-pill, cta, buttons)
  626-675  .v2-stats-strip + .v2-stat-card
  1127-1165 #chapter-content base + h1/h2/h3 + p
  1440-1468 scrollbar + selection + :focus-visible
  1470-1488 .skip-link
  1490-1529 @media (max-width: 900px)  (mobile)
  1531-1545 @media (prefers-reduced-motion: reduce) (a11y)
"""
import gzip
import re
import sys

V2_PATH = "/home/twebery/R_medical_stat_site/css/v2.css"
OUT_PATH = "/home/twebery/R_medical_stat_site/tools/critical.css"

# (start, end) inclusive line ranges in v2.css
RANGES = [
    (16, 66),     # tokens light
    (69, 100),    # tokens dark
    (103, 111),   # body.v2-active base
    (113, 115),   # body.v2-active * reset
    (118, 123),   # #app
    (126, 136),   # #sidebar
    (138, 159),   # .sidebar-header
    (161, 182),   # .search-box input + focus + base
    (195, 201),   # .search-result
    (204, 237),   # #chapter-nav + .nav-group + .v2-nav-label + .nav-group-header
    (247, 254),   # .chapter-count
    (261, 263),   # .nav-group-content
    (265, 287),   # .nav-item
    (294, 329),   # a.chapter-link
    (332, 358),   # .nav-group-header !important + ::after
    (361, 369),   # .sidebar-footer
    (371, 389),   # progress-*
    (391, 396),   # .progress-bar
    (398, 405),   # .last-chapter
    (407, 426),   # .btn-continue
    (428, 447),   # .btn-reset-progress
    (450, 471),   # #main-content + #topbar + dark topbar
    (473, 499),   # #topbar-title + #theme-toggle
    (501, 520),   # #home-btn
    (523, 623),   # .welcome-hero
    (626, 675),   # .v2-stats-strip + .v2-stat-card
    (1127, 1165), # #chapter-content base
    (1440, 1468), # scrollbar + selection + :focus-visible
    (1470, 1488), # .skip-link
    (1490, 1529), # @media (max-width: 900px)
    (1531, 1545), # @media (prefers-reduced-motion: reduce)
]

def main():
    with open(V2_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Sanity: every range in bounds
    n = len(lines)
    for s, e in RANGES:
        if s < 1 or e > n:
            sys.exit(f"range {s}-{e} out of bounds (file has {n} lines)")

    # Build critical block
    parts = []
    for s, e in RANGES:
        # Lines are 1-indexed in the plan; convert to 0-indexed
        chunk = lines[s - 1: e]
        parts.append("".join(chunk))

    # Join with single blank line between chunks for readability
    body = "\n".join(p.rstrip() + "\n" for p in parts)

    # Wrap with header/trailer markers
    out = "/* === inline critical CSS === */\n" + body + "/* === end critical CSS === */\n"

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(out)

    raw_bytes = out.encode("utf-8")
    gz_bytes = gzip.compress(raw_bytes, compresslevel=9)
    print(f"lines in v2.css:           {n}")
    print(f"critical CSS raw bytes:    {len(raw_bytes)}")
    print(f"critical CSS gzip bytes:   {len(gz_bytes)}")
    print(f"written to:                {OUT_PATH}")

if __name__ == "__main__":
    main()
