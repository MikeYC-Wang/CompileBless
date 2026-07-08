#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CompileBless - 賽博點香積功德核心腳本.

負責：
1. 讀取 / 初始化 data/merit.json 中的累積功德數。
2. 將功德數 +1（並記錄本次是哪位信徒點的香）。
3. 讀取 assets/template.svg，將 {merit_count} 等預留位置替換成最新數值，
   輸出到專案根目錄的 compile_bless.svg。
4. 以原子寫入（atomic write）方式落地檔案，避免多人同時觸發造成半寫壞檔。

環境變數（皆為選填，由 GitHub Actions 帶入）：
    BLESS_ACTOR   觸發本次功德的 GitHub 使用者名稱。
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

# --- 專案路徑 -------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT_DIR / "data" / "merit.json"
TEMPLATE_FILE = ROOT_DIR / "assets" / "template.svg"
OUTPUT_FILE = ROOT_DIR / "compile_bless.svg"

DEFAULT_DATA = {
    "total_merit": 0,
    "last_blessed_by": None,
    "last_blessed_at": None,
}


def load_merit() -> dict:
    """讀取功德資料庫；若不存在或損毀則回傳初始結構。"""
    if not DATA_FILE.exists():
        print(f"[info] {DATA_FILE} 不存在，初始化為預設值。")
        return dict(DEFAULT_DATA)

    try:
        with DATA_FILE.open("r", encoding="utf-8") as fp:
            data = json.load(fp)
    except (json.JSONDecodeError, OSError) as exc:
        print(f"[warn] 讀取 {DATA_FILE} 失敗（{exc}），改用預設值。")
        return dict(DEFAULT_DATA)

    # 補齊缺漏欄位，維持向後相容。
    merged = dict(DEFAULT_DATA)
    if isinstance(data, dict):
        merged.update(data)

    # 型別防呆：total_merit 一定要是非負整數。
    try:
        merged["total_merit"] = max(0, int(merged.get("total_merit", 0)))
    except (TypeError, ValueError):
        merged["total_merit"] = 0

    return merged


def atomic_write(path: Path, content: str) -> None:
    """原子寫入：先寫暫存檔再 rename，避免半寫壞檔。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as fp:
            fp.write(content)
            fp.flush()
            os.fsync(fp.fileno())
        os.replace(tmp_name, path)  # os.replace 在同一檔案系統上為原子操作。
    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)


def render_svg(merit_count: int, blessed_by: str, blessed_at: str) -> str:
    """讀取模板並填入動態數值，回傳最終 SVG 字串。"""
    if not TEMPLATE_FILE.exists():
        raise FileNotFoundError(f"找不到 SVG 模板：{TEMPLATE_FILE}")

    template = TEMPLATE_FILE.read_text(encoding="utf-8")

    # 千分位讓大數字更好讀（例如 12,345）。
    pretty_count = f"{merit_count:,}"
    blessed_line = f"最新一炷香：{blessed_by}" if blessed_by else "願天下無 Bug"

    replacements = {
        "{merit_count}": pretty_count,
        "{blessed_by}": blessed_by or "anonymous",
        "{blessed_line}": blessed_line,
        "{blessed_at}": blessed_at,
    }
    for placeholder, value in replacements.items():
        template = template.replace(placeholder, value)

    return template


def main() -> int:
    actor = os.environ.get("BLESS_ACTOR", "").strip() or "anonymous"
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # 1) 讀取並累加功德。
    data = load_merit()
    data["total_merit"] += 1
    data["last_blessed_by"] = actor
    data["last_blessed_at"] = now_iso

    new_total = data["total_merit"]
    print(f"[info] {actor} 點香成功，功德累積至 {new_total}。")

    # 2) 產生 SVG。
    try:
        svg = render_svg(new_total, actor, now_iso)
    except FileNotFoundError as exc:
        print(f"[error] {exc}", file=sys.stderr)
        return 1

    # 3) 原子寫入 JSON 與 SVG。
    atomic_write(DATA_FILE, json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    atomic_write(OUTPUT_FILE, svg)

    print(f"[info] 已更新 {DATA_FILE.name} 與 {OUTPUT_FILE.name}。")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("[warn] 使用者中斷。", file=sys.stderr)
        raise SystemExit(130)
    except Exception as exc:  # noqa: BLE001 - 頂層防護，確保 CI 有明確退出碼。
        print(f"[error] 未預期的例外：{exc}", file=sys.stderr)
        raise SystemExit(1)
