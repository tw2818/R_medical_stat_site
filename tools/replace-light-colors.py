#!/usr/bin/env python3
"""
R 语言实战医学统计 v2 主题切换支持 - js/viz 硬编码颜色替换工具

策略: 把 js/viz/*.js 文件中硬编码的 light 模式颜色 (Tailwind palette 风格)
替换为 v2.css 定义的 CSS var token,让 dark mode 自动适配.

v2.css 实际存在的 token (37 个):
  --v2-accent / --v2-accent-fg / --v2-accent-subtle
  --v2-bg / --v2-bg-elevated / --v2-bg-muted / --v2-bg-subtle
  --v2-border / --v2-border-strong
  --v2-fg / --v2-fg-muted / --v2-fg-secondary / --v2-fg-subtle
  --v2-primary / --v2-primary-fg / --v2-primary-subtle
  --v2-secondary / --v2-secondary-subtle
  --v2-info / --v2-warning / --v2-success (品牌色, 不替换)
"""
import re
import sys
import os
import json
import shutil

# === 颜色映射 (大小写都覆盖) ===
# 关键原则:
#  - 浅色背景 → v2-bg-elevated (light: #FFFFFF → dark: #18181B)
#  - 浅色次背景 → v2-bg-subtle (light: #F4F4F5 → dark: #1C1C1F)
#  - 浅色边框 → v2-border (light: #E4E4E7 → dark: #3F3F46)
#  - 深色文字 → v2-fg (light: #0A0A0A → dark: #FAFAFA)
#  - 次深文字 → v2-fg-secondary (light: #3F3F46 → dark: #D4D4D8)
#  - 弱化文字 → v2-fg-muted (light: #71717A → dark: #A1A1AA)
#  - 极弱文字 → v2-fg-subtle (light: #A1A1AA → dark: #71717A)
#  - 强调副色背景 → v2-secondary-subtle (indigo-50 → indigo deep)
#  - 警示副色背景 → v2-accent-subtle (red-50 → red deep)
#  - 品牌色 (红/蓝/绿/橙/紫/青) 保留

COLOR_MAP = {
    # ===== 背景色 → v2-bg-elevated (主背景) =====
    '#fff': 'var(--v2-bg-elevated)',
    '#FFF': 'var(--v2-bg-elevated)',
    '#ffffff': 'var(--v2-bg-elevated)',
    '#FFFFFF': 'var(--v2-bg-elevated)',
    '#f8fafc': 'var(--v2-bg-elevated)',  # slate-50
    '#F8FAFC': 'var(--v2-bg-elevated)',
    '#f8f9fa': 'var(--v2-bg-elevated)',  # slate-50 alt
    '#F8F9FA': 'var(--v2-bg-elevated)',
    '#f6f7fb': 'var(--v2-bg-elevated)',  # indigo-tinted gray
    '#F6F7FB': 'var(--v2-bg-elevated)',
    '#fafafa': 'var(--v2-bg)',           # zinc-50
    '#FAFAFA': 'var(--v2-bg)',

    # ===== 背景色 → v2-bg-subtle (次背景) =====
    '#f1f5f9': 'var(--v2-bg-subtle)',    # slate-100
    '#F1F5F9': 'var(--v2-bg-subtle)',
    '#f4f4f5': 'var(--v2-bg-subtle)',    # zinc-100
    '#F4F4F5': 'var(--v2-bg-subtle)',

    # ===== 强调副色背景 → v2-secondary-subtle =====
    '#eef2ff': 'var(--v2-secondary-subtle)',  # indigo-50
    '#EEF2FF': 'var(--v2-secondary-subtle)',
    '#e0e7ff': 'var(--v2-secondary-subtle)',  # indigo-100
    '#E0E7FF': 'var(--v2-secondary-subtle)',
    '#ede9fe': 'var(--v2-secondary-subtle)',  # violet-100
    '#EDE9FE': 'var(--v2-secondary-subtle)',
    '#f3e8ff': 'var(--v2-secondary-subtle)',  # purple-100
    '#F3E8FF': 'var(--v2-secondary-subtle)',

    # ===== 警示副色背景 → v2-accent-subtle =====
    '#fef2f2': 'var(--v2-accent-subtle)',  # red-50
    '#FEF2F2': 'var(--v2-accent-subtle)',
    '#fee2e2': 'var(--v2-accent-subtle)',  # red-100
    '#FEE2E2': 'var(--v2-accent-subtle)',
    '#fff7ed': 'var(--v2-warning-subtle)' if False else 'var(--v2-accent-subtle)',  # orange-50 — fallback to accent-subtle since warning-subtle doesn't exist
    '#FFF7ED': 'var(--v2-accent-subtle)',

    # ===== 信息副色背景 (青色/绿) → v2-accent-subtle (fallback) =====
    '#ecfeff': 'var(--v2-accent-subtle)',  # cyan-50
    '#ECFEFF': 'var(--v2-accent-subtle)',
    '#cffafe': 'var(--v2-accent-subtle)',  # cyan-100
    '#CFFAFE': 'var(--v2-accent-subtle)',
    '#ecfdf5': 'var(--v2-accent-subtle)',  # emerald-50
    '#ECFDF5': 'var(--v2-accent-subtle)',
    '#ccfbf1': 'var(--v2-accent-subtle)',  # teal-100
    '#CCFBF1': 'var(--v2-accent-subtle)',

    # ===== 灰底 (Tailwind gray-200 之类) → v2-border =====
    '#e2e8f0': 'var(--v2-border)',  # slate-200
    '#E2E8F0': 'var(--v2-border)',
    '#cbd5e1': 'var(--v2-border)',  # slate-300
    '#CBD5E1': 'var(--v2-border)',
    '#d4d4d8': 'var(--v2-border-strong)',  # zinc-300
    '#D4D4D8': 'var(--v2-border-strong)',
    '#95a5a6': 'var(--v2-border-strong)',  # flat-ui gray
    '#95A5A6': 'var(--v2-border-strong)',

    # ===== 文字色 → v2-fg (主文字) =====
    '#0f172a': 'var(--v2-fg)',  # slate-900
    '#0F172A': 'var(--v2-fg)',
    '#1e293b': 'var(--v2-fg)',  # slate-800
    '#1E293B': 'var(--v2-fg)',

    # ===== 文字色 → v2-fg-secondary =====
    '#334155': 'var(--v2-fg-secondary)',  # slate-700
    '#475569': 'var(--v2-fg-secondary)',  # slate-600

    # ===== 文字色 → v2-fg-muted (弱化) =====
    '#64748b': 'var(--v2-fg-muted)',  # slate-500
    '#64748B': 'var(--v2-fg-muted)',
    '#555': 'var(--v2-fg-muted)',
    '#555555': 'var(--v2-fg-muted)',
    '#666': 'var(--v2-fg-muted)',
    '#666666': 'var(--v2-fg-muted)',

    # ===== 文字色 → v2-fg-subtle (最弱) =====
    '#999': 'var(--v2-fg-subtle)',
    '#999999': 'var(--v2-fg-subtle)',
    '#aaa': 'var(--v2-fg-subtle)',
    '#aaaaaa': 'var(--v2-fg-subtle)',

    # ===== 文字色 → v2-fg / v2-fg-secondary (深色简写) =====
    '#333': 'var(--v2-fg-secondary)',
    '#333333': 'var(--v2-fg-secondary)',
    '#222': 'var(--v2-fg)',
    '#222222': 'var(--v2-fg)',

    # ===== 边框色 → v2-border =====
    '#e2e8f0': 'var(--v2-border)',  # slate-200
    '#E2E8F0': 'var(--v2-border)',
    '#cbd5e1': 'var(--v2-border)',  # slate-300
    '#CBD5E1': 'var(--v2-border)',

    # ===== 边框色 → v2-border-strong =====
    '#d4d4d8': 'var(--v2-border-strong)',  # zinc-300
    '#D4D4D8': 'var(--v2-border-strong)',
}

# 品牌色列表 (不替换)
BRAND_COLORS = {
    '#e74c3c', '#3498db', '#2980b9', '#27ae60', '#c0392b', '#2c3e50',
    '#3730a3', '#4f46e5', '#7c3aed', '#0891b2', '#94a3b8', '#f9826c',
    '#d9e0ea', '#f6f7fb', '#eee', '#fff5f5', '#f0f9ff', '#f0f4f8',
    '#10b981', '#dc2626', '#2563eb', '#f59e0b', '#ef4444', '#3b82f6',
    '#22c55e', '#eab308', '#f43f5e', '#06b6d4', '#a855f7', '#1d4ed8',
    '#0369a1', '#0c4a6e', '#155e75', '#a16207', '#92400e', '#9a3412',
    '#15803d', '#166534', '#14532d', '#3f6212', '#4d7c0f', '#65a30d',
    '#854d0e', '#713f12', '#7c2d12', '#7f1d1d', '#581c87', '#6b21a8',
    '#701a75', '#831843', '#500724', '#be123c', '#be185d', '#9f1239',
    '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7', '#fde047', '#facc15',
    '#1e40af', '#1e3a8a', '#312e81', '#4338ca', '#3730a3', '#4338ca',
    '#d97706', '#b45309', '#92400e', '#78350f', '#1f2937', '#111827',
    '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db',
    '#e5e7eb', '#f3f4f6', '#f9fafb', '#ffffff', '#fff', '#000',
    '#1e3a8a', '#312e81', '#1e1b4b', '#0c0a09', '#0a0a0a',
    # 还有一些 6 位 hex 品牌色
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#ff9ff3', '#54a0ff',
    '#5f27cd', '#00d2d3', '#ff9f43', '#ee5a6f', '#0abde3', '#10ac84',
    '#ee5253', '#0abde3', '#2e86de', '#54a0ff', '#48dbfb', '#0ddb9c',
}

def process_file(fpath, dry_run=False):
    """处理单个文件,返回 (changed, replacements)"""
    with open(fpath) as f:
        content = f.read()
    original = content

    # 替换
    replacements = {}
    for k, v in COLOR_MAP.items():
        pattern = re.compile(re.escape(k) + r'\b')
        matches = pattern.findall(content)
        if matches:
            replacements[k] = len(matches)
            content = pattern.sub(v, content)

    changed = content != original
    if changed and not dry_run:
        with open(fpath, 'w') as f:
            f.write(content)
    return changed, replacements

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('paths', nargs='+', help='files or dirs to process')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--backup', action='store_true', help='backup to /tmp/viz_js_baseline/')
    args = parser.parse_args()

    files = []
    for p in args.paths:
        if os.path.isdir(p):
            for f in sorted(os.listdir(p)):
                if f.endswith('.js'):
                    files.append(os.path.join(p, f))
        else:
            files.append(p)

    if args.backup and not args.dry_run:
        os.makedirs('/tmp/viz_js_baseline', exist_ok=True)
        for fp in files:
            shutil.copy(fp, '/tmp/viz_js_baseline/' + os.path.basename(fp))
        print(f"✓ 备份 {len(files)} 文件到 /tmp/viz_js_baseline/")

    total_files_changed = 0
    total_replacements = 0
    for fp in files:
        changed, reps = process_file(fp, dry_run=args.dry_run)
        if changed:
            total_files_changed += 1
            total_replacements += sum(reps.values())
            if args.dry_run or len(reps) > 0:
                # 打印替换最多的文件
                detail = ', '.join(f"{k}×{n}" for k, n in sorted(reps.items(), key=lambda x: -x[1])[:3])
                print(f"  {os.path.basename(fp):<40} {sum(reps.values()):>3} 处 ({detail})")

    print(f"\n=== 总结 ===")
    print(f"文件: {len(files)} 处理, {total_files_changed} 改动")
    print(f"总替换: {total_replacements} 处")
    if args.dry_run:
        print(f"\n(dry-run, 没改文件)")
