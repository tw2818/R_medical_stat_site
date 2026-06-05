#!/usr/bin/env python3
"""
Inject the critical CSS block (tools/critical.css) into index.html as a
<style> block immediately before the <link rel="stylesheet" href="css/v2.css?v=N">
tag, and bump that href to ?v=N+1.

Idempotent: re-running on an already-patched file will:
  - detect the existing inline block (by marker comment) and overwrite it
  - skip the version bump (since v=N+1 is already in place, it'll be bumped again;
    the script intentionally only does N -> N+1 once — guarded by checking
    whether the inline block marker is already present, and if so leaves the
    href alone, only refreshing the inline body)

To force re-bump, run with --force-bump.
"""
import argparse
import re
import sys

INDEX = "/home/twebery/R_medical_stat_site/index.html"
CRIT  = "/home/twebery/R_medical_stat_site/tools/critical.css"

START_MARK = "/* === inline critical CSS === */"
END_MARK   = "/* === end critical CSS === */"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force-bump", action="store_true",
                    help="Re-bump the v2.css version even if already patched")
    args = ap.parse_args()

    with open(INDEX, "r", encoding="utf-8") as f:
        html = f.read()
    with open(CRIT, "r", encoding="utf-8") as f:
        crit = f.read()

    # 1) Locate the v2.css <link> tag
    link_re = re.compile(
        r'(\s*)<link rel="stylesheet" href="css/v2\.css\?v=(\d+)"\s*>'
    )
    m = link_re.search(html)
    if not m:
        sys.exit("v2.css <link> not found in index.html")

    cur_version = int(m.group(2))
    leading_ws  = m.group(1)
    print(f"current v2.css version: v={cur_version}")

    # 2) Already patched?
    already = START_MARK in html

    # 3) Build the new <style> block
    style_block = (
        f"{leading_ws}<style>\n"
        f"{crit}"
        f"</style>\n"
    )

    if already and not args.force_bump:
        # Replace existing inline block; do NOT re-bump the version
        # (avoids compound version drift on re-runs)
        block_re = re.compile(
            r'\s*<style>\s*' + re.escape(START_MARK) + r'.*?' + re.escape(END_MARK) + r'.*?</style>\n',
            re.DOTALL,
        )
        new_html, n = block_re.subn(style_block, html, count=1)
        if n != 1:
            sys.exit("found marker but could not match the surrounding <style> block")
        new_version = cur_version
        print(f"inline block refreshed in place; v2.css version unchanged (v={cur_version})")
    else:
        # First-time inject: insert block BEFORE the v2.css <link>, and bump version
        new_version = cur_version + 1
        new_html = html[:m.start()] + style_block + html[m.start():]
        # Bump the href
        new_html = new_html.replace(
            f'href="css/v2.css?v={cur_version}"',
            f'href="css/v2.css?v={new_version}"',
            1,
        )
        print(f"injected inline block; v2.css version bumped to v={new_version}")

    with open(INDEX, "w", encoding="utf-8") as f:
        f.write(new_html)

    # Quick stats
    print(f"index.html size: {len(new_html.encode('utf-8'))} bytes")
    print(f"inline block size: {len(crit.encode('utf-8'))} bytes raw")
    import gzip
    gz = gzip.compress(crit.encode("utf-8"), compresslevel=9)
    print(f"inline block gzipped: {len(gz)} bytes")

if __name__ == "__main__":
    main()
