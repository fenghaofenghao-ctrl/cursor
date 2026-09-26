# 星尘遗迹 · Aether Ruins

浏览器端第一人称探索小品：在薄雾遗迹岛上收集 **9** 枚星尘碎片，完成铭文与仪式，**集齐后靠近中心传送门按 E 点亮归途**（不会自动通关）。

原创作品，不依附任何商业游戏 IP。四区可探：晨雾港湾 · 残碑庭院 · 星井高台 · 苔径回廊；交互点（沉钟、神龛、裂隙、提灯等）有可见地标。

## 打开方式

本游戏使用 **ES modules + import map**（Three.js `0.160.0`，自 unpkg 加载），**必须通过本地 HTTP 服务访问**。请勿用 `file://` 直接双击打开——浏览器会拦截跨域模块加载，画面会空白。

### 路径一览

| 用途 | 路径 |
|------|------|
| 源目录（开发） | `/workspace/aether-ruins` |
| 可玩拷贝 | `/workspace/aether-ruins-play` |
| 归档输出 | `/workspace/outputs/aether-ruins`（另有 `aether-ruins.tar.gz`） |

### 推荐启动（Python）

在终端进入项目目录后启动静态服务：

```bash
cd /workspace/aether-ruins   # 或 aether-ruins-play
python3 -m http.server 8765
```

然后在浏览器打开：

```
http://localhost:8765/
```

若 `8765` 已被占用，可改用其他端口（例如 `8766`），并在地址栏对应修改。

### 备选启动（Node）

```bash
cd /workspace/aether-ruins
npx --yes serve -p 8765
```

同样访问 `http://localhost:8765/`。需能访问外网以加载 unpkg 上的 Three.js（离线环境请自行镜像依赖）。

### 文件入口

- `index.html` — 完整游戏入口（渲染器、动画循环、系统接线、PostFX）
- `css/style.css` — 深青 / 金色 UI（叠层金边光晕、进度条、日志 backdrop、软暗角）
- `js/postfx.js` — 轻量 Bloom + 暗角（addons 不可用时回退到普通渲染）
- `js/audio.js` — WebAudio 氛围垫音与音效（无外部音频文件）
- `js/ui.js` — 开始/胜利叠层、HUD、日志、小地图、Toast、交互提示、准星模式、指针解锁恢复条
- `js/world.js` / `player.js` / `shards.js` / `systems.js` / `interact.js` / `lore.js` / `gate.js` / `landmarks.js` — 场景（含第四区「苔径回廊」）、玩家、碎片、任务存档、E 交互、铭文、雾廊、交互点地标

## 操作

| 按键 | 作用 |
|------|------|
| WASD / 方向键 | 移动 |
| 鼠标 | 视角（需指针锁定） |
| Esc | 释放指针（日志打开时关日志；开始/胜利屏不关闭叠层；游戏中出现「点击画面继续」提示） |
| 点击画面 | 重新锁定指针 / 隐藏恢复提示 |
| E | 靠近时交互（铭石 / 沉钟 / 神龛 / **点亮传送门**） |
| J | 开关探索日志（可点半透明背景关闭；打开时 body 带 `journal-open`，UI 不锁 WASD，玩法可日后读取） |
| M | 静音 / 取消静音 |
| Enter / Space | 开始/结束屏触发主按钮（有存档时优先「继续」） |

**通关条件**：集齐 9 枚星尘碎片后，靠近岛心传送门按 **E** 点亮。满 9 不会自动通关。

**体验要点**：开始屏卡片 stagger；有存档时「继续」更醒目；指针锁定后 HUD tip 约 8s 淡隐（输入再亮）；Esc 释放指针时居中半透明条「点击画面继续」（非整页遮罩，重新锁定后隐藏）；靠近可交互目标时准星变为金色小环（`setCrosshairMode('interact')`）；窄屏（<700px）HUD tip 缩短可折行、小地图略缩小、开始卡片 padding 收紧；日志项依次轻入（打开时 body.`journal-open`，UI 侧无法锁移动，玩法日后可据此暂停 WASD）；交互提示轻微 pulse；碎片进度条满格金色一拍；未收集碎片在小地图微闪；区域切换时小地图边框微闪、玩家标记更清晰；靠近门可闻轻脉冲；可选极轻脚步噪声；连续 Toast 短 crossfade 顶替；胜利屏少量金色 CSS 光点；Enter/Space 在开始/胜利屏触发主 CTA（Esc 不误关叠层）；静音切换有短暂反馈与 `aria-pressed`；拾取接近满 9 时钟音略升调。尊重 `prefers-reduced-motion`（关闭 shimmer / pulse / 光点等）。

## 存档

进度保存在 `localStorage` 键 `aether-ruins-save-v1`（含碎片、交互旗标、玩家位姿）。开始界面在有存档时显示「继续」；胜利界面的「再走一遍」会清除存档。

## 技术要点

- Three.js r160（ACES Filmic + 软阴影）
- PostFX：轻量 Bloom + 自定义暗角；传送门点亮时 `setPortalBloom` 随 `setPortalPower` 同步加强（不改动 world API）
- 纯 WebAudio：柔和 pad、拾取钟音（近满 9 略升调/泛音）、日志开关音、门脉冲、通关暖和弦、可选脚步噪声；静音平滑淡出
- 小地图 Canvas：高对比玩家标记 + 朝向箭头、碎片点（未收集微闪 / 已收集暗点）、区域色调、换区边框微闪、中心传送门菱形/圆环

## 许可说明

Three.js 按其自身 MIT 许可从 unpkg 加载。本仓库原创脚本与美术逻辑可自由用于学习与演示。
