#!/usr/bin/env python3
"""Download missing images from Ayueme GitHub Pages to local data/ directory."""
import os, sys, re, urllib.request, urllib.error
from urllib.parse import quote

SITE_DIR = '/home/twebery/R_medical_stat_site'
DATA_DIR = os.path.join(SITE_DIR, 'data')
BASE_URL = 'https://ayueme.github.io/R_medical_stat/'

def download_image(src, max_retries=2):
    """Download one image. src is like 'figs/xxx.png' or '1002-anova_files/figure-html/xxx.png'."""
    local_dir = os.path.join(DATA_DIR, os.path.dirname(src))
    local_path = os.path.join(DATA_DIR, src)

    if os.path.exists(local_path):
        return 'exists', src

    # Create directory
    os.makedirs(local_dir, exist_ok=True)

    url = BASE_URL + quote(src)  # handle special chars
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; image-downloader)',
        'Accept': 'image/png,image/*',
    })

    for attempt in range(max_retries):
        try:
            resp = urllib.request.urlopen(req, timeout=15)
            data = resp.read()
            with open(local_path, 'wb') as f:
                f.write(data)
            return 'ok', src
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return '404', src
            if attempt < max_retries - 1:
                continue
            return 'error', src
        except Exception as e:
            if attempt < max_retries - 1:
                continue
            return 'error', src

    return 'error', src

def main():
    # Collect all missing images
    missing = []
    for fname in os.listdir(DATA_DIR):
        if not fname.endswith('.html'):
            continue
        fpath = os.path.join(DATA_DIR, fname)
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', content)
        for src in imgs:
            if src.startswith('/') or src.startswith('http'):
                continue
            local_path = os.path.join(DATA_DIR, src)
            if not os.path.exists(local_path):
                missing.append(src)

    missing = list(set(missing))  # deduplicate
    print(f"Total missing: {len(missing)}", flush=True)

    results = {'ok': [], '404': [], 'exists': [], 'error': []}
    for i, src in enumerate(missing):
        status, _ = download_image(src)
        results[status].append(src)
        if (i + 1) % 20 == 0:
            print(f"Progress: {i+1}/{len(missing)} ({len(results['ok'])} ok, {len(results['404'])} 404)", flush=True)

    print(f"\n=== Done ===", flush=True)
    print(f"  Downloaded: {len(results['ok'])}", flush=True)
    print(f"  Already existed: {len(results['exists'])}", flush=True)
    print(f"  404 (not on Ayueme): {len(results['404'])}", flush=True)
    print(f"  Errors: {len(results['error'])}", flush=True)

    if results['404']:
        print(f"\n404 images (first 10):", flush=True)
        for src in results['404'][:10]:
            print(f"  {src}", flush=True)

if __name__ == '__main__':
    main()
