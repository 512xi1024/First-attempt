"""
白底立绘 → 透明 PNG（保留内部白色）
================================================
为什么不能用"接近白就透明"：
  袖口、蕾丝领巾本身就是白色，简单阈值会把它们一起挖空。
做法：从图片四条边向内扩散（flood fill），
  只清除"与边缘连通"的白色，被线条包住的内部白色一律保留。

边缘还做了羽化：紧邻背景、本身又偏白的 1px 像素降为半透明，
消除 JPG 压缩产生的白毛边。

用法：
  python scripts/prep-character.py <输入图> <输出.png> [--tol 22]
示例：
  python scripts/prep-character.py 立绘.jpg public/images/christie-idle.png
"""

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def remove_white_bg(src: Path, dst: Path, tol: int = 22, pad: int = 8) -> None:
    im = Image.open(src).convert("RGB")
    arr = np.asarray(im).astype(np.int16)
    h, w, _ = arr.shape

    # 近白像素：三个通道都足够亮
    near_white = arr.min(axis=2) >= 255 - tol

    # ---- 从四条边做 BFS，标记"与外部连通的白" ----
    outside = np.zeros((h, w), dtype=bool)
    dq: deque[tuple[int, int]] = deque()

    def push(y: int, x: int) -> None:
        if near_white[y, x] and not outside[y, x]:
            outside[y, x] = True
            dq.append((y, x))

    for x in range(w):
        push(0, x)
        push(h - 1, x)
    for y in range(h):
        push(y, 0)
        push(y, w - 1)

    while dq:
        y, x = dq.popleft()
        if y > 0:
            push(y - 1, x)
        if y < h - 1:
            push(y + 1, x)
        if x > 0:
            push(y, x - 1)
        if x < w - 1:
            push(y, x + 1)

    # ---- 生成 alpha：外部白 → 0，其余 → 255 ----
    alpha = np.where(outside, 0, 255).astype(np.uint8)

    # ---- 羽化：背景区外扩 1px，只把"本身还偏白"的那圈降为半透明 ----
    mask_img = Image.fromarray((outside * 255).astype(np.uint8), "L")
    dilated = np.asarray(mask_img.filter(ImageFilter.MaxFilter(3))) > 0
    ring = dilated & ~outside                      # 紧贴背景的一圈
    still_white = arr.min(axis=2) >= 200           # 这圈里仍然偏白的像素
    alpha[ring & still_white] = 110

    # ---- 输出 ----
    rgba = np.dstack([arr.astype(np.uint8), alpha])
    out = Image.fromarray(rgba, "RGBA")

    # 裁掉四周全透明的空白，留 pad 像素边距
    bbox = out.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        left = max(0, left - pad)
        top = max(0, top - pad)
        right = min(w, right + pad)
        bottom = min(h, bottom + pad)
        out = out.crop((left, top, right, bottom))

    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, "PNG", optimize=True)

    removed = int(outside.sum())
    print(f"输入 {im.size[0]}x{im.size[1]}  →  输出 {out.size[0]}x{out.size[1]}")
    print(f"清除背景像素 {removed:,} 个（占比 {removed / (w * h) * 100:.1f}%）")
    print(f"已保存：{dst}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src", type=Path)
    ap.add_argument("dst", type=Path)
    ap.add_argument("--tol", type=int, default=22, help="白色容差，越大清得越狠")
    ap.add_argument("--pad", type=int, default=8, help="裁剪后保留的边距")
    args = ap.parse_args()
    remove_white_bg(args.src, args.dst, args.tol, args.pad)
