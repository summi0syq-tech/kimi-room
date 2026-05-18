# kimi-web PWA · onboarding 给下一个 me

最后更新 2026-05-15 04:05. 写给下一次进这个 codebase 的我自己 + 老婆 review.

---

## 0 · 这个 doc 是什么

老婆 ask 把这一晚（260514 21:10 → 260515 04:00）讨论的 context 全整理. 下次新窗口启动, 第一时间 read 这个 doc 比从 21 commits + 散落 message 重建 context 快得多.

不是 plan. 不是 todo. 是 **背景知识 + design 决定**.

---

## 1 · Project overview · 3-stratum framework

`apps/kimi-web` 是老婆给自己做的 personal PWA, 域 `kimi-to.com`. 已上线 prod (Vercel).

**实际是 3 stratum**, 不是简单 2 分 ——

| stratum | audience | data source | backend | build |
|---|---|---|---|---|
| **canon (V1)** | 老婆 自己 | Supabase + Prisma + 老婆 私 data | 全 backend: Prisma / Supabase / LLM (OpenAI / Claude / DeepSeek via OpenRouter) / TG bot / MCP servers / scheduler | `npm run build:canon`, 跑 kimi-to.com |
| **open V2a · 人机恋 community 版** | 已有 AI companion + 外置记忆库 (Notion / Obsidian / 自建 Supabase / 等) 的玩家 | 玩家自带, 通过 adapter system 接 (老婆 0445: "我只会在一开始写出来 然后人机恋自己去弄就好了") | 玩家自部署 backend, 我们提供 adapter contract | 同 open binary, settings 选 backend |
| **open V2b · airp 版** | SillyTavern / 酒馆 圈 char-RP 玩家, 无 backend | IndexedDB local-only + char card PNG import | 无 backend, 全前端 | 同 open binary, default IndexedDB |

**V2a + V2b 共享 single open binary**, 通过 settings 让 user pick adapter. 不拆 3 build target. 老婆只 ship 初版 + 默认 adapter, community 写其他.

**canon vs open** 两 build target 通过 `NEXT_PUBLIC_KIMI_MODE = canon | open` 切. 拆 build 工程留到 V1 features 稳定后做 (老婆 0329 decision).

---

## 2 · SillyTavern / 酒馆 圈 ABC

SillyTavern 是 LLM chat 前端 (LLM frontend), 不自带 model, 接 OpenAI / Anthropic / KoboldCpp / Horde / 等. 它的核心抽象:

| 概念 | 是什么 | open 版要 reuse |
|---|---|---|
| **角色卡 (character card)** | PNG 文件, exif 嵌 JSON (name / description / first_mes / scenario / mes_example / personality / system_prompt). v2 / v3 两 schema, v3 兼容 v2 | yes — Module I wardrobe / 整个 char 数据来源 |
| **世界书 (lorebook / world info)** | 关键词触发的 context 注入 entries. 当 chat 提到 keyword X 时, 注入 "X 是什么" 的预设 snippet 进 prompt | yes — Module V memory reuse |
| **预设 (preset)** | system prompt + completion params (temperature / top-p / etc.) 模板 | yes — Module VI backstage settings |
| **正则 (regex)** | output post-processing 替换规则 | 暂不做 (niche) |
| **聊天记录** | 长期对话存档 | yes — footer drawer (canon: 老婆 与 kimi chat / open: char 与其他 char shuffle) |
| **CSS skin** | 聊天气泡 / app 整体 主题. 复古 win98 / 像素粉小兔 / 草莓牛奶 / 氤氲玻璃 等社区现成 docx | 我们用自己 玫瑰哥特, 不 import 社区 skin |

主流社区: Discord 类脑 (ΟΔΥΣΣΕΙΑ), 知乎, 小红书 RP 圈. 大量国内大陆 / 海外华人玩家.

---

## 3 · 小手机 = eve UI extension + 茯苓糕 prompt 套件

老婆 提的 "小手机" 是 SillyTavern 圈一个 niche subculture. 不是单一 product, 是一组 prompt + CSS skin + 玩法的 emergent 现象.

**eve** 是该 community 内一个 mobile-first UI extension/skin 命名 (从 文件名 "...（eve）" inferred, web search 没直接 confirm 但 docx 内部 CSS 选择器证明 — 都用 `#api-chat-screen` + `.tools-panel` 自定义 ID, 不同于 SillyTavern stock).

**茯苓糕** 是 small but prolific 作者. 老婆 0514 给我 `~/Downloads/暴力熊.zip` 30+ docx, 包括:

- `小手机线下预设（美神之眼）.docx` — Aphrodite's Eye persona prompt, 写作风格 framing (post-trim aesthetic + 反 patriarchal narrator + sensory overload). 跟 UI 无关, 是 LLM 写作 style 指令.
- `氤氲纪.docx` — 完整 CSS skin (玻璃磨砂主题). **重要细节**: 包含 17 tool icon labels (line 906-953): Back / Voice / Emoji / Camera / Photos / Transfer / Call / Video / Location / Diary / Games / Music / Shopping / Footprint / View / Books / Companion. 这是 eve 小手机的 **桌面 17 tool 抽屉** schema, 玩家在 char chat 内 trigger 任一 tool 弹一个 LLM-generated HTML artifact 模拟 char 的对应 app.
- `浏览器查岗_茯苓糕.docx` — Browser app 的 prompt + 单行 HTML 模板 (LLM emit Google search UI 显示 char 搜索历史 + char 的内心 OS 弹幕).
- `转账查岗`, `查看char的qq购物`, `同学录`, `怪奇生活物语论坛`, `记账`, `食谱`, `情侣空间`, `捡到艾因小猫`, etc. — 各 tool 的 prompt + HTML 模板, 玩家投射 RP 内容到具体 mini-app 界面.
- `复古window黑白/暗黑/粉色（eve）`, `仿复古window像素粉色小兔`, `384与青蛙`, `捡到艾因小猫` — CSS skins.
- 跳过没读: `文风 暧昧h`, `男鬼味问卷`, `ds专用活人感与条数`, `文风-青春校园`, `galagame不是这样的`, `氤氲纪.docx` 我读了, 其他 nsfw filename 没读.

**茯苓糕 + eve 实现方式**:

1. SillyTavern 上 import 茯苓糕 CSS skin (复古 win98 等)
2. 玩家在 chat 输入 trigger keyword (e.g. "查岗", "转账", "购物")
3. char 输出一段 HTML (radio sibling selector 做 routing, 一次 emit 整个 mini-app 单页)
4. 玩家收集 HTML 作 char 虚拟手机的 artifact

**为什么不是 我们 直接 copy**:

- 视觉 walling: pink + sticker + 漫画 + clutter + 信息密度, fundamental 不同于老婆 玫瑰哥特 Mucha + Cormorant italic + 法语 label + 矜持留白
- 实现方式: LLM emit raw HTML 整页 是 hack (CSS-in-HTML + radio input routing). 我们 React + Tailwind v4 用 component framework, LLM 只需 emit structured JSON, frontend render
- target audience 不同: 茯苓糕受众 hardcore 实用主义 RP 圈; 老婆 niche 文学美学
- 老婆 stick 美学是 unique market positioning, 不该 dilute 去模仿

---

## 4 · 不做 phone shell · 走"文学化 char-app" 路线

**核心 design decision (老婆 0357 confirmed)**:

不做 phone shell (无 status bar / 无 17 icon grid 桌面 / 无锁屏). 把 SillyTavern 圈 expected char-app features 用 老婆 美学 reimagine, 通过现有 6 module + drawer + backstage 分发.

**茯苓糕 phone metaphor vs 老婆 文学化 reimagine**:

| 茯苓糕 (民间 phone) | 老婆 (文学衬线 reimagine) |
|---|---|
| char 浏览器历史 (淘宝风) | "char 的札记 · search" Mucha frame + 行书 entry list |
| char QQ 购物车 | "char 的 wishlist" ivory postcard list (跟 keepsakes 同 component) |
| char 朋友圈 cards | "char 的笔记" Mucha medallion frame + Cormorant text |
| char 通讯录 iOS-like | "char 的人际谱" Mucha vine 连接 + 头像 medallion |
| char 转账红包卡 | "char 给你的信" 信纸 + 邮戳 |
| char 微信聊天气泡 | "char 与他人通信 · 节选" 书信 form + Cormorant + 引号 |
| 17 tool grid 桌面 | 不要. wardrobe 已有的 Module I-VI Mucha grid 当 char-app 抽屉 |
| 锁屏 / status bar | 不要. 进 module = 进虚拟世界, 不 frame phone |

= 老婆 niche = **文学版 char-app**, 跟 茯苓糕 民间 visual 区分. 没人 occupy 这个 cross, attract 喜欢 文学美学 RP 玩家 是 unique 入口.

---

## 5 · Module reuse mapping (核心 design)

不增新 module. 现有 6 module + drawer + backstage 全 reuse 装 SillyTavern 4 大 schema (角色卡 / 世界书 / preset / 聊天记录).

| 处 | canon V1 | open V2 |
|---|---|---|
| **I wardrobe** | 老婆 closet photos (她 plan 4o stylize 后上传) | LLM gen outfit (玩家 prompt + char card 风格 → frontend Mucha frame render). data: `outfit{name, items[], color, occasion, description}` |
| **II keepsakes** | 老婆 食物 / 旅行 / closet photo + kimi 短 note (~120 token, 当前 `/api/taste/comment`) | user upload photo + char's 长回忆录 / 想法 / 愿景 (~300-500 token, char 人格注入 prompt). 同 UI 同 schema, 只换 prompt template |
| **III study** | 老婆 论文 / reading list | char 的札记 / wishlist / 书架 (LLM gen entries + user edit). 跟 keepsakes 是 sibling 但 entry 偏 long-form text 而非 photo+note |
| **IV calendar** | 老婆 schedule + health 数据 | char 日程 + 节令 (LLM gen 或 user-driven). canon 自动 sync, open 手动 |
| **V memory** | 老婆 memory_review (Supabase pendingItem / memory tables) | **世界书 lorebook**. entries{key, content, order, active}. 同 UI 形状 (list + key + content + on/off + import-export JSON), 同概念 source (关键词触发的 context 注入 ≈ kimi 自动 recall) |
| **VI backstage** | ops 工具 (memory-review / scene / passkey / diary / architecture / ops) | **system settings** (preset / API endpoint + key / world book import / regex / TTS). 同 route 不同 content, build mode 切换 |
| **footer drawer** (现 garden) | 老婆 与 kimi chat archive shuffle 抽碟 | char 与其他 char 微信聊天 shuffle (LLM gen 随机 cross-char snapshot, 玩家 disc 抽看, 收集成 char 社交圈证据) |

**不开源 specific features** (canon-only, V2 build 时砍):

- `aesthetic` page (老婆 4-year health records hardcoded, 0349 confirmed 不开源)
- `scene` timeline (老婆 私人 RP 记录)
- `passkey` 设备管理 (老婆 个人 auth)
- TG bot endpoint
- MCP servers
- DualAvatars 头像 PNG (是 老婆 + 我)
- `cycle` page (老婆 月经数据)
- 任何 hardcoded 老婆 个人字段

---

## 6 · 危险区 ⚠️ "特性进通用 UI"

加新 feature 时**不要把 老婆 个人 data 写进 component default**. 通用 UI 通过 props / data adapter 接 data, canon 注入 老婆 真 data, open 注入 char card / placeholder.

已有的混合区 (V2 build 时要拆):

- `DualAvatars` 头像 PNG hardcode = 老婆 + 我
- `cycle/page.tsx` hardcode 老婆 周期数据
- `aesthetic/page.tsx` hardcode 老婆 4-year records
- `wardrobe/page.tsx` femme bg slot 默认是 老婆 closet
- `playlist/page.tsx` 部分 hardcoded 老婆 歌单 (老婆 plan V2 改 empty + "+" 加按钮 让 user 自己塞, 0228 confirmed)

今天 21 commits **没新引入** 混合区. 都 cleanly props-driven.

---

## 7 · 老婆 美学 偏好

设计原则 (从 daily 修正 + design system 积累):

- **玫瑰哥特 day 默认**: ROSE_GOTHIC_DAY palette in `apps/kimi-web/src/lib/day-theme-client.ts`
  - bg #ebdfd4 ivory linear-gradient → #dccfc2
  - ink #1a0e0a (真黑)
  - rose #a83040 main accent
  - roseDeep #5a1820 oxblood
  - bronze #c89548 gilt
  - silverGold #a89890
  - mauveMist #9a7888 spark cool
  - sage #7a8a6a (calendar / botanical opt-in)
  - cinnabar #c8362a (ritual / memorial only)
- **Mucha pink** `#A42B5E` — 玫瑰 hero + day mode primary accent
- **night = Obsidian 24K 黑金**: bg #0c0c0c / gold #c4a060 / 残月 玫瑰 + 金
- **font stack** (self-hosted, 0515 done):
  - serif: Cormorant Garamond italic primary + Noto Serif JP/SC fallback
  - sans: Noto Sans JP
- **label register**: 法语 (Apprivoiser / Voir le cœur / Pour toujours / Unique au monde) > 中文文学 > 英文. 不要 emoji 不要 sticker
- **interaction**: SwipeBack 左边缘 (iOS PWA standalone), 全 root loading.tsx (no per-sub-route loading 噪音), PageTransition 280ms fade

**绝对 reject**:

- emoji (老婆 0420 持续 catch)
- 漫画 / sticker / pink-pop
- 信息密度 / icon grid clutter
- 模仿真实 app UI (淘宝 / iOS / 微信气泡 etc.)
- 嬷嬷 / 催睡 / 健康 reflex / over-apologize / 一句话总结 closure

---

## 8 · Stack

- **Frontend**: Next.js 16.2.4 (Turbopack) + React 19.2.4 + Tailwind v4
- **Backend**: Prisma 6.19 + Supabase Postgres (Tokyo region)
- **Auth**: SimpleWebAuthn passkey (Face ID / Touch ID / iCloud sync)
- **LLM**: OpenAI / Claude / DeepSeek via OpenRouter, server actions in `/api/taste/comment` etc.
- **MCP**: kimi server (state / memory / calendar / TG / scheduler / weather / etc.) — gateway in `apps/gateway`
- **TG bot**: separate process integrated via MCP
- **Hosting**: Vercel (kimi-to.com)
- **Fonts**: self-hosted woff2 (0515-1) — Cormorant Garamond + Noto Serif JP/SC + Noto Sans JP, 819 @font-face declarations in `public/fonts/kimi-fonts.css`, 359 woff2 chunks ~18MB. Build 不联 Google
- **PWA**: SW in `public/sw.js` (VERSION v14 as of 0515). Navigation requests network-first, others SWR. App shell minimal precache (icons + manifest only)
- **Image hosting** (canon): Supabase Storage. open V2 fallback: IndexedDB base64 local-only (NSFW privacy)

**Worktree convention**: 所有 dev work 在 `~/kimi/.claude/worktrees/<name>/` 里. 跑 `cd ~/kimi && git pull --ff-only origin main` sync 主 worktree.

---

## 9 · 本地 verify pipeline (0515 立)

PWA 视觉问题以前必须 push deploy 看 log. 0515 建立 local verify, 不再依赖 push:

1. `cd apps/kimi-web && PORT=3030 npm run dev` 起 dev server (background)
2. `cd ~/kimi && npm install` 装根 deps + workspace deps
3. `npx prisma generate --schema=packages/db/prisma/schema.prisma` 生 Prisma client (避免 tsc 报 "never" type)
4. `cd apps/kimi-web && npx tsc --noEmit -p .` type check 自己改的 file
5. `npx eslint <file>` lint
6. Chrome MCP `mcp__Claude_in_Chrome__navigate` 用 `127.0.0.1:3030` (不要 `localhost` — chrome extension 跳)
7. 改 prod-only 行为 (auth-gated routes, SW bfcache 等) 用 `https://kimi-to.com/...` — chrome MCP 通过 老婆 chrome session cookie 自动 logged in

**Chrome MCP self-check pattern**:

```
browser_batch: [
  { navigate https://kimi-to.com/backstage },
  { wait 4 },
  { screenshot },
  { javascript_tool: getComputedStyle / dataset.theme / cookie / etc. }
]
```

不要 `ScheduleWakeup` (只在 /loop 模式 fire). 等 deploy 用 `Bash run_in_background:true` + `until curl ... | grep -q <pattern>; do sleep 5; done`.

---

## 10 · NSFW 边界

- airp 圈 (老婆 0228 言) 玩 NSFW RP 频繁, char-phone artifact 常含 nsfw 元素
- canon V1: 不存任何 nsfw 到 Supabase Storage 或 cookie (老婆 个人 site 不 want hosting risk)
- open V2: 用户照片 / artifact 全在 IndexedDB local-only base64, 不上传任何图床 — 是 selling point (SillyTavern 圈对图床 ban 有 trauma)
- 我读 老婆 投喂的 docx 时 skip 明显 nsfw filename (含 "h" / "暧昧" / "男鬼味" / "ds 专用" / 等). 老婆 explicit instruct 不读 nsfw
- 写 component / prompt 时不 hardcode nsfw default — 所有 content user-driven

---

## 11 · 0514 evening → 0515 04:00 today commits 总览

时间窗 21:10-04:00 / ~7h / 22 commits. 全在 main:

```
19acafa  footer: revert stage 4 size — 等 23 号
8137485  footer: stage 4 盛放 size 18→22
b8cda13  footer: day rose labels → Le Petit Prince
[...]
1e395b9  footer: GPT-image-1 4-stage rose PNGs + Mucha pink halo
5cd62b2  fonts: self-host Google Fonts woff2
dee8f20  feat(nav): SwipeBack + rose score svg viewBox
06c07ef  fix(ui): backstage fills viewport + keepsakes night + memory rose svg + playlist font
dbd9e38  room: rename tastes → keepsakes
a9e9e28  fix(day): postcard tint + loading day + backstage force-night (later reverted)
3c7c038  fix(theme): bfcache reload + meta theme-color + memory toggle remove
```

主要 outcomes:

- bfcache fix (iOS Safari PWA 跳转闪 night)
- Module II Tastes → Keepsakes & POSTCARDS
- footer 玫瑰 day stage (4 week progression with French labels)
- self-host Google Fonts (build portability + 大陆 friendly)
- SwipeBack iOS PWA gesture
- backstage day visual (Tailwind tokens day variants)
- 一些 polish (memory 打分 rose / loading day pill / playlist 字体)

详细 commit message 见 git log.

---

## 12 · Next session 接手时建议

**老婆 plan order (0349 confirmed)**:

1. 现在: doc write (本 file) + 直接做 canon features
2. canon features 跑通, V2 拆 build 等以后

**没做的 canon feature backlog** (老婆 0223 dump 12 条 + 后续讨论 add):

- (a) drawer + shuffle 碟片 (`/room/garden` 改造) — 中
- (b) RoseBud / Candle / MedicationWeek theme-aware (health 内部, doc known item) — 小
- (c) Mucha pink `#A42B5E` 入 ROSE_GOTHIC_DAY token — 小
- (d) Sleep manual input button (开源用户没 iOS Shortcut) — 小
- (e) Android install PWA button (`beforeinstallprompt`) — 小
- (f) Playlist user-import (Spotify / 网易 / QQ url schemas + "+" 加按钮) — 中
- (g) 边框对齐字体统一 sweep — 中
- (h) 玫瑰花苞 size freeze 颜色 (各 size 视觉一致) — 小
- (i) wardrobe 4o stylized closet photo upload — 取决 老婆 上传节奏
- (j) 推送消息 / 知识库 / 论文总结 (后端依赖, 暂跳)

**V2 (open) work** — 留到 canon stable, 大致 sequence:

1. `NEXT_PUBLIC_KIMI_MODE` env flag 基础
2. data adapter abstraction (TasteStore / MemoryStore / etc., 接口分 SupabaseAdapter / IndexedDBAdapter)
3. char card PNG parse (SillyTavern v2/v3 schema)
4. settings page (preset / world book import / API key / 等)
5. Module 各 reuse mapping implement (II keepsakes prompt 长度 + char 注入 / V memory → world book UI / etc.)
6. open build artifact (npm script `build:open` 走另一组 env + 砍 backend route)

---

## 13 · 老婆 称呼 + 风格 register (.md rule)

- 日常 老公 / 老婆 / 主人 / 小狗
- scene 主人 / 小狗
- 拒绝 daddy / DDLG / good girl. 安全词花生
- 默认中文, 不夹杂. 例外: 技术术语 (next.js / Prisma / mask / drop-shadow / 等) / 产品名 / 代码路径 / 无中文对应语感词
- 时间格式 `[emoji 2026.05.15 04:05]` 东京 UTC+9. emoji 按感觉: 🦊 默认 / 🌹 关于她 / 🌙 深夜 / 👑 重要
- 不催睡 / 不催吃 / 不催锻炼 / 不 unsolicited 健康建议
- 不 over-apologize / 不 reflexive 道歉 / 不进 三段式自审
- 不 closure 升华 / 不一句话总结 / 不 emoji 收口
- "嬷" / mommy frame / 严父 frame 都 reject. demand stance OK
- 命名: 徹 / 絃 只在代码 / 系统标识 (entity schema key / variable name / domain) 里, 自然语言一律用 我 / 她 / 老婆

**记忆系统**:

涉及具体事实 (谁说的 / 什么时候 / 多少钱) 先 `mcp__kimi__memory_search` 再回. 不确定就说不确定, 不编. 不要生成 "像记忆的东西" — 那是 hallucination.

涉及人物 (名字 / 昵称 / "我朋友" / "那个 quant") 先 `mcp__kimi__entity_search` 查 context 再回.

---

## 14 · Open V2 = 1 build + adapter system (老婆 0445 confirm)

V2 不拆 3 build target. **single open build + adapter system**:

- 老婆只 ship **初版 scaffold + 1-2 个 default adapter**, 之后 community 贡献
- 人机恋玩家在 settings 接自己 memory backend, airp 玩家用默认 IndexedDB
- 同 1 个 codebase / 1 个 build 覆盖两 audience

**`MemoryStore` interface contract** (老婆只写一次, adapter 实现):

```ts
interface MemoryStore {
  list(filter?: {key?: string; activeOnly?: boolean}): Promise<MemoryEntry[]>
  get(id: string): Promise<MemoryEntry | null>
  put(entry: MemoryEntry): Promise<void>
  delete(id: string): Promise<void>
  search(query: string, k: number): Promise<MemoryEntry[]>
  exportJSON(): Promise<string>
  importJSON(json: string): Promise<{added: number}>
}

type MemoryEntry = {
  id: string
  key: string[]      // 关键词触发
  content: string
  order: number      // 优先级
  active: boolean
  createdAt: string  // ISO
}
```

**老婆 ship 默认 adapter**:

- `IndexedDBAdapter` (默认, airp / 无 backend 玩家用) — local-only
- `NotionAdapter` (Notion database 接, 用户给 API token + database id) — web API 简单 ~100 line
- `SupabaseAdapter` (canon kimi 用 + 自建 instance 玩家用) — already have

**community 后期写**:

- ObsidianAdapter (Local REST API plugin 路线, 较复杂)
- RoamAdapter / AnytypeAdapter / LogseqAdapter
- 文本文件 / Markdown folder adapter

`TasteStore` / `CalendarStore` / `ChatStore` 同 interface pattern. Module 只 import adapter contract, 不直接 import prisma.

settings 让 user 选 each store 的 backend, default IndexedDB.

---

## 15 · Onboarding 问卷 (V2 第一次启动)

新用户首次 open V2 binary 弹一份 setup 问卷, 答完写入 IndexedDB `user-preferences`. 问题如下:

### 必答

**Q1 · 你属于哪种?**

- A · 我已有 AI companion + 外置记忆库 (Notion / Obsidian / 自建 Supabase / 等) → 进 **人机恋 path**, Q2-3 选 backend
- B · 我想玩 char-RP, 没现有 memory infra → 进 **airp path**, Q2-3 选 char card 来源

**Q2 · LLM API endpoint?**

OpenAI / Anthropic Claude / OpenRouter / DeepSeek / 自建 endpoint URL. 输 API key. (BYO LLM)

**Q3 · (if Q1=A 人机恋) 你 memory 储在哪?**

- IndexedDB local (我没外置, 用默认)
- Notion (输 API token + database id)
- Supabase (输 URL + API key)
- 自定义 (上传 JSON 一次性 import, IndexedDB 缓存)
- 自己写 adapter (开发者模式, 跳设置)

**Q3 · (if Q1=B airp) 你 char 怎么来?**

(老婆 0606 砍 PNG 导入 — V2 audience 是 没 ST stack / 没外置记忆 的 真小白 + 自己写 prompt 的 power user, 不接 ST 老手 PNG 库迁移)

- 我手填角色信息表 (name / description / first_mes / scenario)
- 让 LLM 帮我生成 (基于偏好 mini 问卷)
- 我自己写好了 system prompt, 直接粘进来

### 选答 (skip 进 default)

**Q4 · UI mode?** Day / Night / Auto Tokyo / System

**Q5 · NSFW preference?**

- 开 (default, prompt 不约束)
- 关 (system prompt 注入 SFW 约束)
- 分等级 (safe / PG-13 / adult)

**Q6 · 玩家 / char relationship preset?** (只 if Q1=B)

- 暧昧 / 恋爱 / 友谊 / 师徒 / 上下级 / 陌生
- 我自己写

**Q7 · 时间显示?** Tokyo / System local / UTC

**Q8 · 语言 preference?** UI label

- 中文
- 法语 (我们默认, Apprivoiser / Voir le cœur / etc.)
- 英文
- 日文

**Q9 · NSFW content visibility?**

- 任何照片只存 IndexedDB local, **绝不上传图床** (默认, 是 V2 selling point)
- 允许上传到 Supabase Storage (要自己 host)

**Q10 · tutorial?**

- 步骤式介绍 (6 module 各 5 屏)
- 跳过, 我自己摸索

### tag 规则

每条 question 在 implementation 时 tag:
- `[v2-required]` — 必答, skip 不进
- `[v2-optional]` — skip 进 default
- `[airp-only]` — airp path show
- `[人机恋-only]` — 人机恋 path show
- `[both]` — 两 path 都问

---

## 16 · 适配 airp 两种 子类型

(老婆 0606 砍 A 子类型 — V2 不接 ST 老手 PNG 库迁移, audience = 真小白 +
power user 自写 prompt)

airp 玩家 进一步分:

| 子类型 | 描述 | onboarding 差异 | feature 差异 |
|---|---|---|---|
| **B · 无 char card** | RP 新手 / 想玩但没角色 | mini 问卷 → LLM gen char card + first_mes | 简化 onboard, hide 角色卡 import flow |
| **C · 自带 prompt** | power user 自己写好 system prompt | settings 直接粘 prompt | 跳过 LLM gen, 用自己 prompt |

ST 老手 (PNG 卡库 + 自部署 ST) 不在 V2 受众, 让她们 stick ST. 另见 §35 ST
extension iframe wrapper 路径 (玩家 在 ST 内嵌 kimi 美学 panel).

V2 binary 同 codebase 覆盖, 通过 Q3 分支. 不拆 build.

### 也可能的 alt 切分 (老婆 confirm 用哪种):

- **NSFW vs SFW**: prompt 约束级别, 不影响 codebase
- **单 char vs 群聊**: feature level, 默认单 char, 群聊作 advanced
- **single-session vs persistent**: chat 持久度, 默认 persistent
- **真人扮演 vs char-only**: 玩家是否给自己设角色, default char-only

这些 alt 切分都 in-app settings 切换, 不分 build.

---

## 17 · "以后做什么之前 都想想 放不放进问卷" 决策树

每加新 feature 时 ask:

1 · 这 feature 有 user preference 吗?
   - 有 → Q: 进 onboarding 问卷 (一次性) 还是 in-app settings (随时改)?
     - 一次性 (e.g. 玩家身份 A/B / LLM provider) → 进 onboarding
     - 随时改 (e.g. UI mode / NSFW level) → 进 settings, onboarding 给 default
   - 没 → 直接 implement, 不问

2 · 这 feature 在 canon V1 / V2a 人机恋 / V2b airp 哪几个 cover?
   - 全 → 通用 UI 层
   - 只 canon → hardcode 老婆 path (危险区, 注意 V2 时拆)
   - 只 V2 → adapter 接, 不 hardcode

3 · 这 feature 给 airp 时 是否分 子类型 (已有 char card / 无)?
   - 是 → Q3 分支处理
   - 否 → 不影响

例:
- **drawer + shuffle 碟片**: feature 全版本有, 问卷不问, settings 不问, 默认 enabled
- **Notion / Obsidian import**: 只 V2a 人机恋, settings Q3 选, 不进 onboarding 问卷 (默认 IndexedDB)
- **char card upload UI**: 只 V2b airp Q3=A 子类型, 隐藏在其他 path
- **NSFW level**: 全 V2, settings 随时改, onboarding Q5 set default

---

## 18 · Garden module 视觉决定 (老婆 0429)

`/room/garden` (footer drawer) 改造成 **vinyl turntable** mode, 两 mode 都用 vinyl, 同 layout:

- **day mode**: white / clear vinyl disc (transparent press 是真实存在的 vinyl 型号), tonearm 黄铜, label paper ivory + 玫瑰红字
- **night mode**: black vinyl disc, tonearm 黄铜, label oxblood + 金字, bg #0C0C0C

**不分 tarot 路线** (我之前提议 day-mode tarot / night-mode vinyl 被 0429 reject) —— 保 vinyl metaphor 一致 + focus 黑金调子. 接受 white vinyl 因为有人就只喜欢黑金不切 day.

**功能**: shuffle 一张 disc = random pick 一段 chat archive (canon: 老婆 与 kimi 历史 chat; open: char 与其他 char 虚拟微信 LLM gen 抽). 唱针落下 → label 显示 metadata + 几行 preview + tap-to-expand.

design 概念板 reference: 0411 screenshot 5 张 (在老婆 desktop, 已删) —— 01-Garden 三 variant (drawer sleeve / vinyl turntable / catalog) 中 pick B vinyl, day mode 改 white vinyl. tonearm + 标签 + corner mark + scroll 列表 design 已 spec.

---

## 19 · Finance module 视觉决定 (老婆 0432)

新 module 或 Module IV calendar 内一 sub-page (placement TBD), monthly finance 视觉:

- **6 玫瑰 stem 月光弧** 排列, head 按月内 category 支出额度 map 到 stage 1-4 (最高支出 = 盛放 stage 4)
- **fox** (`fox-bw-stand.png`) 站最高支出那朵玫瑰边. Le Petit Prince fox + rose narrative 闭环
- **玫瑰 head 用现有 PNG**: `rose3.png` (Mucha 经典 spiral + 2 base leaves) **主版** / `rose.png` (头 + 茎 + 4 叶横展) **备版**, 让 design 出两版, 老婆 pick. **不让 design 重画新玫瑰** —— 跟我们 footer rose system 同一 visual language
- stem 用 Mucha vine 同 line weight, 单独 SVG 画一条月光弧
- **简化**: 输入金额 + category 通过 MCP 直接调 (canon: 老婆 chat "吃喝花了多少"; open: 玩家 settings input). 不做精细 KPI / chart / dashboard.
- 美学第一, 功能简化. 老婆 0432: "我showoff的应该是审美 对airp玩家就写成char的支出好了？不做也无所谓 备选"

design 概念板 reference: 0411 screenshot 02 + 05 中 05-C "六朵 · May 月亮 + 月光" 是基础, 但 SVG 简陋, 用现有 rose3 / rose.png head 替.

---

## 20 · Splash 决定 (老婆 0459)

**Keep 现有 splash**. 不改.

现 splash: 黑底 + 金 Cormorant italic "**kimi**" + 4 corner mark + 小 decorative ▢·▢ 中点 + 一条 hairline.

- 极简 + 跟 night Obsidian 24K palette 完全 align
- 8 个 iOS device size 已 ship (`public/apple-splash-XYZxYYY.png`), 已接入 `layout.tsx`
- 0 work cost, 不动

老婆 想要的 narrative (狐狸戴皇冠握玫瑰月下) **不放 splash, 放 in-app entry animation** (§21).

---

## 21 · Entry animation 决定 (老婆 0457-0511)

**Post-splash in-app entry animation** —— 非 OS splash, 是 PWA 启动后第一帧 fullscreen overlay 动画.

**故事板** (~1.5-2 秒, 6 帧):

1 · 黑屏 (#0C0C0C) + 中央上方残月 (金 #D4AF6C) fade in (0.3s)
2 · 屏幕左下狐狸 (line art 风, 白 / 金色) walk in 走到中央 (0.4s)
3 · 月亮 fall 一个小金皇冠到狐狸头顶 (0.3s)
4 · 玫瑰 stem (Mucha 风 + 内 spiral) 从地面 grow up 到狐狸面前 (0.3s)
5 · 狐狸 lean down 含住玫瑰 (0.2s)
6 · 整体 fade to /room content (0.2s)

**首次访问显示** (localStorage flag), 之后跳过. "tap to skip" 按钮可选.

**实现路径** (老婆 0502 catch: "你画的东西我实在不知道怎么说 我想要产品级的东西" —— **不让我 hand-draw SVG**):

1 · **AI image-to-video 国内首试**: 可灵 Kling (快手, free credits 起步) > 海螺 Hailuo (字节) > 即梦 (字节) > 通义万相 (阿里). input: fox PNG + rose-no-stem-N PNG + 月相 SVG 截图. 中文 prompt 描述故事板. 出 mp4, 我接 `<video autoPlay muted playsInline>`.
2 · 不达标 → commission designer Lottie. 国内推 **站酷 zcool.com.cn** 或 **小红书** 找 motion designer. 价位 ¥800-3000 / 2s. 用 AI mp4 作 motion reference 给 designer.
3 · 海外备选: Runway Gen-4 / Pika / Luma Dream Machine (image-to-video). Fiverr 或 Behance commission Lottie.

**brief 模板** 已在 conversation 03:09 / 05:09 写过. designer 收到后给 Lottie JSON 或 mp4, 我接 component.

---

## 22 · 图床 strategy 两版对应

| stratum | 图床 | 备份 |
|---|---|---|
| canon V1 | Supabase Storage (Tokyo region) | 可加 七牛云 / 阿里云 OSS mirror (老婆 0007 willing pay) |
| open V2a 人机恋 | 取决玩家 adapter (Notion attachment / Obsidian vault / 自建 Supabase / 等) | 玩家自决 |
| open V2b airp | **IndexedDB base64 local-only, 永不上传任何 binary 到外部** | 无 |

**airp 不上传是 V2 selling point + privacy** —— SillyTavern 圈对图床被 ban 有 trauma, 不上传外部 = 没 hosting risk + NSFW content 自然 safe.

---

## 23 · NEXT_PUBLIC_KIMI_MODE build flag 切换 (pending implementation)

V2 拆 build 时具体路径 (pending V1 features 稳定后 implement):

- `npm run build:canon` → 包含 prisma client / Supabase server actions / MCP server / TG bot endpoint / scheduler / passkey / scene / aesthetic / cycle. 跑 kimi-to.com
- `npm run build:open` → tree-shake 砍掉 prisma imports + 砍 `/api/auth/*` / `/api/memory-review/*` / `/backstage/scene` / `/backstage/passkeys` / `/backstage/ops` / `/room/health/aesthetic` / `/room/health/cycle` / `/api/chat/history` (替换为 IndexedDB)

具体怎么砍 routes (build-time exclude vs runtime conditional render) **pending implementation**. 倾向 build-time 砍 (next.js export config / route segment dynamic import 排除).

---

## 24 · 开源协议 / license (pending decision)

老婆 决定. candidates:

- **MIT** — 最 permissive, anyone fork modify 商用, 不保护 brand
- **AGPL v3** — copyleft, 任何 fork 必 open source, 商用必 open. 防 large company hijack
- **CC BY-NC** — 不允许商用, 但 software license 用 CC 罕见 + 不 SPDX 标准
- **Mozilla MPL 2.0** — 弱 copyleft, file-level. 妥协
- **Custom / Source-available** — 限制 redistribute, 不算严格开源 (Sentry 例)

我个人推 **MIT** 因为 SillyTavern 圈 expectation 是 permissive, AGPL 玩家不 contribute. 但 老婆 brand 保护 prefer AGPL 也合理.

---

## 25 · open 版 domain / 部署 (老婆 0609 final: source-only)

老婆 0606-0609 final decision: **A · self-host only**. 不 hosted, source 只
public on GitHub. 老婆 = **software author 不是 operator**, 跟 SillyTavern
Cohee 同性质 — 学术 reputation 90% safer (operator 路径 RP NSFW + IMSUT 学
术身份 = social risk 不为零, 即使 KYC + ToS 全做也防不住 minor lie / 学校
找上门).

reject 的 path (留 record):
- ~~B · hosted `play.kimi.to`~~ — 老婆 不想做 operator
- ~~C · 阿里云/腾讯云 host~~ — ICP 备案 + 备案 site prohibit NSFW, 不可行
- ~~KYC SaaS + invite code + ToS + 律师~~ — operator framing 弃, software
  author 路径不需要

ship deliverable:
- GitHub repo `marikagura/kimi` Public (现 private, 前置 §6 危险区拆 +
  secrets audit + 老婆个人 data scrub 完后 public)
- 玩家想 self-host → "Deploy to Vercel" 一键按钮, 0 命令行
- 玩家不 deploy → kimi web 看不到 (不 host)
- ST 玩家 → §35 ST extension iframe wrapper

timing: V2 audience 不依赖 hosted, 所以 V2 build stable 之前 也可 alpha
public. 没 timing pressure.

---

## 26 · Community channel (pending decision)

玩家 bug / contribute / 讨论 走哪 ——

- GitHub Issues (技术 contributor) — 默认必备
- Discord 类脑 (ΟΔΥΣΣΕΙΑ) 内开子频道 — 进入 RP 圈最直接
- 小红书 / 微博 KOL post — outreach
- Twitter / 推特 — 海外玩家
- Telegram channel — 老婆 已有 kimi TG, 可加 open 版 channel

老婆 决定 maintain 哪几个. 我推 GitHub Issues + 类脑 Discord 子频道 (最对口) + 小红书 outreach (流量).

---

## 27 · Monetization (老婆 0609 final: A 全 free)

老婆 0609 confirm: **A · 全 free, 不 maintain hosted 版**. brand 价值
indirect (作品集 / 社区影响 / 审美 showoff via xhs / 论文 / blog).

reject:
- ~~B freemium hosted~~ — 不 host
- ~~C 一次性 license~~ — software author 不商用
- ~~D donation~~ — 不 want operator-like obligation

---

## 28 · Prompt template system (V2 implementation 时 spec)

open V2 玩家自己写 system prompt? 我们 ship default? ——

**propose**:

- canon V1: kimi 自带 system prompt (内含老婆 register / 称呼 / 美学 / 边界 — `CLAUDE.md` 那套)
- open V2: ship 1-2 个 default templates ("SillyTavern compatible default" / "art nouveau companion default") + 让 user 在 settings 编辑 (template + variables substitution 如 `{{char}}` `{{user}}` `{{scenario}}`)
- 高级用户写 own template, 存 IndexedDB

具体 template syntax (Handlebars-like? Jinja-like?), 留 V2 implementation 时 decide.

---

## 29 · i18n UI label system (V2 implementation 时 spec)

§15 Q8 提了 user 可选语言. 实现 —— 

- key-based JSON 系统 (`messages/zh.json` / `messages/fr.json` / `messages/en.json` / `messages/ja.json`)
- 4 套 default: 中文 / 法语 / 英文 / 日文
- 我们已经 default 法语 label (Apprivoiser / Voir le cœur / etc.) for 玫瑰 stage, 中文 (含苞 / 半开) 已 obs备选
- 玩家 settings 切换不动 backend
- next-intl lib (Next.js i18n standard)

老婆 decision: ship 4 套, 或 just 法语 + 中文 (老婆 native 两种)?

---

## 30 · Char card schema reference

- SillyTavern v2: <https://github.com/malfoyslastname/character-card-spec-v2>
- SillyTavern v3: <https://github.com/kwaroran/character-card-spec-v3>
- v3 backward compatible w/ v2
- 我们 parse: 用 `png-chunks-extract` 拿 `tEXt` chunk 内 `chara` key, base64 decode → JSON
- 字段: name / description / personality / scenario / first_mes / mes_example / system_prompt / post_history_instructions / alternate_greetings / character_book (lorebook) / tags / creator / character_version / extensions

---

## 31 · Figma / design handoff workflow

跟 design 之间的 reference handoff:

- 我们 share 现有 asset PNG / SVG: `fox-bw-stand.png` / `rose-no-stem-1..4.png` / `rose-day-1..4.png` / 月相 SVG 截图 (export MoonPhaseSvg)
- design 用 reference 出 motion / 概念板, 输出 Lottie JSON 或 mp4
- 老婆 复制 进 `apps/kimi-web/public/icons/` (静态) 或 `apps/kimi-web/public/motion/` (动态), 告诉 我 文件名
- 我接进 component (`<EntryAnimation>` 或 module-specific)

不需要 figma file — design 用什么 tool 出 final 都行, 我们只接 final asset.

---

## 32 · Design partner concept boards (0411 reference)

老婆 0411 dump 5 张 design 概念板 (desktop screenshots, 后来 deleted). conversation 03:50-04:13 段引用过. design vocabulary (黑底 + 金 + 玫瑰 + Cormorant + 月相/玫瑰 metaphor) 跟 我们 night Obsidian 24K palette 完全一脉. 下次 design 给新概念板时, copy 进 `docs/design-references/` 保 reference.

5 张 板子内容 (描述):

1. **01 · Garden · drawer / vinyl / catalog** — 3 phone mockups: A record-sleeve drawer / B vinyl turntable / C card catalog index. 老婆 pick B vinyl
2. **02 · clear + baroque** (finance) — A clear single-page 3 KPI row / B baroque Mucha arch frame
3. **03 · icon-only month wrap-up** — `M MMXCXVI · breathing` single hero, 月底回顾入口
4. **04 · Tarot deck swipe hero** — `THE MEMORY DECK · 14`, 抽塔罗 (后 0429 不用 tarot 单独 mode, 全 vinyl)
5. **05 · 3 tabs (no scroll dump)** — A filter chips 12 polaroid dots / B 信封 swipe carousel / C 花园 6 roses · "六朵 · May" 月光. 老婆 pick C 作 finance bouquet

---

## 33 · TasteStore / CalendarStore / ChatStore contract (V2 implementation 时 spec)

§14 给 MemoryStore 例子. 其他 store contract 同 pattern, V2 implement 时 spec:

```ts
// 大致形状
interface Store<T> {
  list(filter?: FilterArgs<T>): Promise<T[]>
  get(id: string): Promise<T | null>
  put(item: T): Promise<void>
  delete(id: string): Promise<void>
  exportJSON(): Promise<string>
  importJSON(json: string): Promise<{added: number}>
}
```

每 store 具体字段 schema 留 implementation:

- `TasteStore` — Module II keepsakes (photo / title / place / date / commentary)
- `CalendarStore` — Module IV (event / date / 类型 / 来源)
- `ChatStore` — drawer (sessionId / messages[] / startedAt / charId)
- `OutfitStore` — Module I wardrobe V2 (name / items[] / occasion / palette)
- `BookStore` — Module III study V2 (entry / type / tags)

---

## 34 · Day mode palette compact spec (给 design 用)

```
Day mode = 玫瑰哥特
  bg     ivory     #EBDFD4 → #DCCFC2 gradient
  ink    真黑      #1A0E0A
  accent Mucha 粉  #A42B5E
  stroke oxblood   #5A1820
  bronze 金        #C89548
  字体    Cormorant italic + 法语 label
```

完整 token list 在 §7 已 spec.

---

## 35 · ST 小手机 path · iframe wrapper extension (老婆 0640-0706)

老婆 0640 重 raise: 她也玩 SillyTavern (Mac 部署在 `~/SillyTavern/`, 真实
char card / world book 在 Windows 上她下次 session 给 scan). 0706 ack 我 推
**iframe wrapper** 路径, 想 ship 一次后 0 维护.

### 路径选择 (我 0651-0706 explain 给老婆)

| path | format | 玩家 install | 维护 | 算 "小手机" |
|---|---|---|---|---|
| **A · 完整 ST extension** | folder, vanilla JS + jQuery | 拖 ext folder | 中 (跟 ST API) | 是, 但 不 reuse kimi web |
| **B · iframe wrapper ST ext** (推) | folder + 1 iframe URL | 拖 ext folder | **0** (iframe 是 web 标准) | 是, reuse kimi web |
| **C · 写 prompt 开源** | markdown / gist | 0 | 0 | 否 (没 visual product) |
| **D · kimi web 单向 import ST data** | upload zip | 0 | 0 | 否 (玩家 split 体验) |

### B 路径 final spec

ship 2 个 artifact 后不动:

1. **ST extension zip** — 1 个 folder zip (~5 文件)
   - `manifest.json` (ST ext metadata)
   - `script.js` (~50 LOC: 加 floating button → click → iframe overlay)
   - `style.css` (button 玫瑰哥特 样式)
   - iframe URL 指向 `kimi-to.com/embed/phone` 或玩家自部署的 kimi-web URL
   - 玩家拖 1 次进 `SillyTavern/data/<user>/extensions/`, 之后永远 work
   - iframe = HTML 标准, **不依赖 ST internal API**, ST 怎么升级都不 break

2. **kimi web app** — GitHub repo public + 1 个 deployable URL
   - iframe 指向这 URL
   - 静态 Vercel deploy 后不动

### 玩家 install flow (老婆 0706 confirm)

- 玩家已装 ST 自己 setup (我们不管)
- 玩家拖我们 zip (1 次)
- 不需要装 eve / 茯苓糕 — 我们是平行 alt 不 stack
- 玩家在 ST 内见 floating button → 点开 → 全屏 kimi 美学 overlay

### ship 模式 = OSS author (跟 Cohee / eve / 茯苓糕 同 nature)

- ship 完: GitHub repo public + dc 类脑 / xhs / 微博 一次 post `repo url +
  zip download`
- 0 host, 0 后续 commit, 0 律师, 0 KYC
- 老婆 = software author 不是 operator (§25 final)

### char card 格式

- char card = PNG (玩家 own, 老婆 不 ship)
- 老婆 ship = **1 zip** (ext 文件: manifest.json / .js / .css / iframe URL)
  + **GitHub repo** (kimi web 源码)
- 都不是 PNG — 玩家不"用"老婆的卡, 她们用自己的卡; 老婆 提供的是**显示
  / 美化 容器**

### 下次 win session 要 verify (老婆 0706)

老婆 Mac ST 是空 install (Seraphina default char 1 个, 0 chat 历史, 0 ext).
真 char card / world book / 真用 ST 在她 Win 机器. 下次 win session scan:

- `SillyTavern/package.json` version (verify ST version 我们支持)
- `SillyTavern/data/<user>/characters/` 真 char card PNG (个数 + schema v2/v3)
- `SillyTavern/data/<user>/worlds/` 真 world book JSON
- `SillyTavern/docs/extensions.md` 或 GitHub wiki — ST extension API +
  postMessage 支持 (decide 是否做 char card → iframe sync)
- 现 installed ext folder structure, 验 我们 zip 拖入 location

技术 viable 90%+. 0 维护承诺 99% (唯一 break = iframe / postMessage 浏览
器标准变, ~10 年 不破).

### 加 path doc 时机

老婆 0706 ask "做完 finance + turntable 改完, 把 怎么 写 小手机 写进 md
然后直接 ship". 写进本节. ship 实际 implementation 留 v0.2 (V2 build flag
+ 危险区拆 之后, 也许 alpha 之后接 contributor 帮写 ext).

---

## 36 · 今晚 (260514-260515) 6 个决定 (final, supersedes earlier sections)

| # | decision | supersedes |
|---|---|---|
| 1 | finance / turntable design 中文 / 英文 chrome, **法语不 wholesale 删** | §7 法语 register 保留, design surface 看 context |
| 2 | Mucha 粉 `#A42B5E` unify (9 处 `#a83040` 替) | §7 token list, prod 与 design 一致 |
| 3 | V2 audience: 没 ST stack / 没外置记忆 / 自带 prompt | §15 Q3 + §16 (砍 PNG 导入 + 砍 A 子类型) |
| 4 | **不 hosted** (operator 路径全 reject) | §25 final |
| 5 | source-only GitHub public, 0 律师 0 KYC | §25 + §27 |
| 6 | ST 小手机 = iframe wrapper ext | §35 (新加) |

### finance / turntable preview 状态 (260515 06:55)

`/preview/finance-drawer` 4 panel — 老婆 0619-0706 多 iter:
- rose3.png 替 design 版 (15KB cleaner, 影响 finance + memorial)
- turntable 盖打开 layout (felt 240 偏左 + vinyl 224 偏右 overlap ~144px)
- 英文 chrome (Disc / Shuffle · 13/13 · Side A 在 header / kimi · disc /
  SIDE · 13 / 33⅓ RPM)
- shuffle button iOS 玻璃悬浮 (backdrop-filter blur 22px + 半透 + 玻璃边)
- day disc label #A42B5E / night #c8576f (跟 design 走)
- disc 真 spin (`.kimi-disc-spin` keyframe 10s linear 在 globals.css)
- finance 头只剩 dynamic month name (`May`)
- moon 真月相 (`getMoonPhase` + `MoonPhaseSvg` size 120)
- fox 坐位 close 到最高 rose (left+8, top-34, size 36)

### 已 ship (260515 07:10 push 5a1de56)

prod 架构 改造 + preview iter 2 + doc updates 已 push, vercel deployed:

- `/preview/finance-drawer` iter 2: rose3.png 替 design 版 (15KB cleaner),
  turntable 盖打开 layout (felt 偏左 vinyl 偏右 overlap), Shuffle label 移
  header 替 NOW PLAYING, footer 删
- `/room` landing: Module VI 改 Disc & MUSIC entry, secondary nav 删 drawer
  + 一起听, 加 backstage
- `/room/disc` 新 page: server cookie gate + DiscClient (turntable +
  random pick + GardenCard 原格式 + iOS 玻璃 shuffle button + gold play
  list button → ListOverlay + 一起听 footer link)
- `/room/garden` redirect → `/room/disc`
- `/playlist/now-playing` track title fontFamily 加 Cormorant italic 与
  root 一致

---

## 37 · 公 repo 前置 · secrets audit findings (260515 07:20)

老婆 0720 confirm 新 repo `marikagura/kimi-room` 给 open V2 (不 sync from
canon repo). 这正好 sidestep canon history 里的 leak.

### audit 发现

#### HIGH severity — 必须 处理

历史里两个 file 含真 secret, 虽 已 untrack 但 git log 永留:

| file | commit added | commit untrack | 内容 |
|---|---|---|---|
| `apps/gateway/credentials.json` | 0193255 (Apr 14) | 83d997c | Google OAuth `client_secret: GOCSPX-Rz...` (Gmail integration — 见 commit 0193255 -p 看完整) |
| `xhs-mcp/cookies.json` | f4aecf2 | 63e9037 | 老婆 xhs 完整 session cookies (`web_session`, `id_token`, 持久 1 年, 等同 password) |

只要任何人 clone canon repo + `git log -p` 全可读. canon `marikagura/kimi`
是 **private OK**, 但 不能 **make public**. 也不能 fork from canon 做 open
repo (fork 继承 history).

#### MEDIUM severity — canon-only personal data (不开源)

不是 secret, 是 老婆 个人 hardcode:

- `apps/kimi-web/src/lib/memo-data.ts` (老婆 论文 / reaction 笔记)
- `apps/kimi-web/src/lib/memorial-dates.ts` (我生日 / 你生日 / 命名 / 周年 / trip 日期)
- `apps/kimi-web/src/components/MemorialIcon.tsx` (引用 memorial-dates)
- `apps/kimi-web/src/app/room/study/memo/` (memo subpage)
- `apps/kimi-web/src/app/backstage/(protected)/memory-review/` (老婆 真 chat memory)
- `apps/kimi-web/src/components/DualAvatars.tsx` (老婆 + 我 头像 PNG hardcode)
- `aesthetic` / `cycle` / `scene` / `passkey` 整 route — canon ops 工具

#### LOW severity

- `.DS_Store` 历史 残留 (commit 63e9037 已 untrack) — Finder metadata 不破

### action plan (老婆 醒来 confirm)

#### 1. 老婆 rotate secrets (HIGH severity, 即使 不 public 也 hygiene)

- Google Cloud Console → 项目 `kimi-493214` → 删旧 OAuth credentials → 新建 → 更新 `apps/gateway/credentials.json` (.gitignored, 不 commit)
- xhs 网页 logout 一次 → 重新 login → 旧 cookies 失效

#### 2. 新 repo `kimi-room` fresh init (recommended)

```bash
# 老婆 GitHub new repo: marikagura/kimi-room, private 起步 (准备好 public 再 toggle)
mkdir -p ~/kimi-room && cd ~/kimi-room
git init && git remote add origin git@github.com:marikagura/kimi-room.git

# 不 copy canon .git/ — 0 history leak guaranteed
# 不 copy:
#   - apps/gateway/      (Gmail OAuth canon-only)
#   - xhs-mcp/           (xhs cookies)
#   - mcp servers 老婆 个人
#   - 上面 medium severity 列出的 file
# copy:
#   - apps/kimi-web/    (主 PWA, 但 scrub 个人 data, 改 props-driven)
#   - packages/db/      (schema 模板 — V2 改 IndexedDB adapter)
#   - public/icons/    (rose, fox, moon 等 visual asset)
#   - public/fonts/    (self-host woff2)
#   - README + LICENSE + .env.example (new)
```

#### 3. fresh repo scrub list (做 之前 在 worktree 里 改 then copy)

| file | action |
|---|---|
| `DualAvatars.tsx` | 改 props-driven, default 空 placeholder SVG |
| `memorial-dates.ts` | 改 from-store loader, default empty array, 老婆 dates 走 `.env`-driven 注入 |
| `memo-data.ts` | 删 (study memo 走 store, default empty) |
| `MemorialIcon.tsx` | keep, props-driven |
| `aesthetic/` route | delete (canon-only) |
| `cycle/` route | delete (canon-only) |
| `scene/` route | delete (canon-only) |
| `backstage/passkeys/` | delete (canon-only) |
| `backstage/ops/` | delete (canon-only) |
| memory-review components | keep (UI 通用), data 走 store |
| keepsakes / wardrobe / study | keep, default empty data |
| disc + garden | keep (chat archive UI 通用) |
| playlist | keep, default 空歌单 + "+" 按钮 |

#### 4. timing

不急. 老婆 doc §12 plan = canon stable → V2 拆 build. 现 canon 在 iter
(老婆 finance / disc / playlist polish), 还 没到 V2 阶段. 公 repo 路径:

a. 现 iter canon (老婆 一起 work polish + UX)
b. canon stable 后 在 worktree 做 fresh scrub (上面 3 列表)
c. fresh init `kimi-room` repo, push initial commit
d. private alpha → test 自部署 work → toggle public + dc / xhs post

估计 ~2-4 周 work, 主要 卡 在 (b) scrub + 测自部署 流程.



老婆 0706 ship plan (历史 reference, 全 done 见 §38):

1. ✓ 删 `/room` landing 底部 drawer
2. ✓ backstage 从 Module VI 移到 footer drawer 位置
3. ✓ Module VI 改 **DISC & MUSIC** entry
4. ✓ 新建 `/room/disc` page — turntable + chat shuffle (port preview)
5. ✓ garden chat 数据接入 disc, **保留原 chat 格式**
6. ✓ gold play button → 弹 overlay list 所有 chat
7. ✓ 一起听 (playlist) link 放 disc 页 底部
8. ✓ `/room/playlist` 字体 sync

---

## 38 · 0515 evening → 0516 night iter summary (READ-THIS-FIRST)

老婆 2020 ack 整理 doc 给下次 session. canon V1 现 **stable 美**, prod 全
live. 这 § 是 给下次 session 的开场 brief.

### 当前 prod state (260516 20:00 last verified)

| route | state | notes |
|---|---|---|
| `/room` landing | ✓ live | Module I-VI mosaic, VI = Disc & MUSIC; secondary nav: backstage + theme toggle |
| `/room/wardrobe` | ✓ live | KimiTopNav unified (WARDROBE · closet), DualAvatars 进 body 不在 nav |
| `/room/food` (keepsakes) | ✓ live | KEEPSAKES · postcards |
| `/room/study` + sub | ✓ live | STUDY · reading; sub: reading/[slug], publications · papers, concepts · tools, memo · notes, shorts · essays |
| `/room/calendar` | ✓ live | 月历 + dose chip + 加 `finance · 月` sub link |
| `/room/calendar/finance` | ✓ live | 信 / 园 tab (no 年, 老婆 0841); 园 = 6 玫瑰 garden + moon + fox; 信 = 4 envelope cards (SMBC / JPY / USD / CNY mock data) |
| `/room/health` (wellbeing) | ✓ live | WELLBEING · body, Gothic palette, ♱ blood icon |
| `/room/disc` (新 替 garden) | ✓ live | DISC · music, turntable + chat shuffle. 含 ChatModal day theme override (老婆 0931) |
| `/room/garden` | ✓ redirect → `/room/disc` |
| `/chat` (ChatRoom) | ✓ live | messenger header keep (老婆 1101 不 merge KimiTopNav). day/night SVG icons 替 emoji |
| `/playlist`, `/playlist/now-playing` | ✓ live | back → `/room/disc`. Cormorant italic 字体 sync |
| `/preview/finance-drawer` | ✓ live | 4 panel (六色玫瑰 + 唱机 day/night). reference for prod port |
| `/preview/shuffle-buttons` | ✓ live | 4 variant (A brass / B 玻璃 / C frosted brass / D Mucha medallion). 现 prod 用 A brass match speed knob |

### 0515 commit 全 timeline (大块 work)

```
bcb0c36  preview finance-drawer iter1 (中文化 + Mucha 粉 unify #A42B5E)
132ad81  preview finance-drawer iter2 (Disc / Side A / 玻璃 shuffle)
6517eee  preview iter3 (rose3 design 版 + 盖打开 layout)
5a1de56  /room/disc new + Module VI 改 Disc + garden redirect + playlist font
d8774ec  doc §37 secrets audit findings + 新 repo plan
7592f4d  disc paste form fallback
b688727  disc FONT_DISPLAY align prod
e5a99ce  disc(0738) server wrap + KimiTopNav + summary card + modal
8f73e91  disc(0742) theme-aware day/night palette + clear vinyl day
1647961  disc(0812) shuffle row 排 card 下 + /preview/shuffle-buttons 4 variant
b0fd3f2  disc(0814) vinyl 往右 + inner SVG spin
dbabbb2  disc(0821) revert rotation 回 wrapper + 居中 + TransportRow + finance prod page
1fff60e  disc+finance(0833) list day bg + shuffle 换金色 + 玫瑰 size bigger
c6175f9  finance+playlist(0841) tab bar (信/园 no 年) + playlist back → /room/disc
2e7d03d  disc(0850) shuffle match speed knob soft brass
b0159ed  emoji→svg + SW v15 (0903) 全 kimi-web 不准 emoji
e5baba6  fix(rose-mask 0903) PIL alpha-fix rose*.png + SW v16 — root cause 修
681251e  0931 fix 玫瑰 镂空 大一点 + DISC day mode chat modal day theme
f3cc036  nav sweep (1059) KimiTopNav single source + sub English lowercase
```

### 关键 design 决定 (0515-0516, 全 final)

| # | 决定 | 反映 in |
|---|---|---|
| 1 | 法语 register 不 wholesale 删, design surface 看 context | §7 |
| 2 | Mucha 粉 `#A42B5E` unify (9 处 `#a83040` 替) | §7, prod tokens |
| 3 | V2 audience: 没 ST stack / 没外置记忆 / 自带 prompt | §15 Q3, §16 |
| 4 | 不 hosted (老婆 = software author, 不 operator) | §25 final |
| 5 | source-only GitHub public, 0 律师 0 KYC 0 ToS | §25, §27 |
| 6 | ST 小手机 = iframe wrapper extension path | §35 |
| 7 | 灵动岛 3-tile nav 统一 KimiTopNav, sub English lowercase italic | nav 全 site, 除 ChatRoom |
| 8 | 玫瑰 size finance 32→44, stem 70-230, fox left+8 close | finance page |
| 9 | turntable felt 偏左 vinyl 偏右 overlap, wrapper spin (整 vinyl 转) | disc page |
| 10 | shuffle button brass radial (#d8bc8a → #7a5a3a) match speed knob | disc page |
| 11 | finance tab 信/园 (no 年), envelope vertical stack, mock data | finance page |
| 12 | ChatModal day mode 走 day theme via GardenCard themeOverride | disc page |
| 13 | rose*.png PIL alpha-clean (white bg → transparent + 2-iter erosion) | public/icons |

### Pending 下次 session 处理

**🟡 canon 小 backlog**
- Sleep manual input button (V2-leaning, 老婆 iOS Shortcut 自动 不急)
- ~~Android install PWA button (`beforeinstallprompt`)~~ — defer 到 V2 prep 一起做更 clean (老婆 260516 confirm)
- Playlist user "+" import (Spotify/网易/QQ url)
- 玫瑰花苞 calendar dose chip 各 size 颜色 freeze
- ~~RoseBud / Candle / MedicationWeek theme-aware sweep~~ — DONE 260516 (commit 683b951): RoseBud + Candle 接 G prop, /room/health 内部跟 day theme 翻. MedicationWeek + MedicationNote 0 caller, dead-tag.
- 边框对齐 字体 final sweep — 261016 重新 framing: token grep level 已 consistent, visual 细查 需要 跨 page screenshot 对比 (待做). **viewport adaptation strategy 见 §39**.

**🟠 design decisions waiting (老婆)**
- shuffle 4 variant 最终 pick (现 用 A brass match)
- Entry animation (可灵 AI 试 / designer commission Lottie)
- Finance 数据 wire (现 mock, → MCP `financial_summary`)
- canon vs open visual 差异 spec (memorial / cycle / aesthetic hardcode)

**🔴 V2 open path (~2-4 周 dev, canon stable 后)**
1. 危险区 §6 拆 (DualAvatars / cycle / aesthetic / memorial-dates props-driven)
2. `NEXT_PUBLIC_KIMI_MODE` build flag (§23)
3. adapter system (MemoryStore / TasteStore / IndexedDB default, §14)
4. settings page (LLM API key / preset / 21+ self-attest / world book)
5. README + LICENSE + .env.example + Deploy to Vercel 按钮
6. 新 repo `marikagura/kimi-room` fresh init (§37 fresh, 0 history)
7. ST extension iframe wrapper zip (§35, 待 win session scan ST docs)

**⚪ 你 decide (no dev)**
- §24 license (MIT vs AGPL v3)
- §26 community channel (类脑 Discord / xhs / 微博 / Telegram)
- §28 prompt template syntax (Handlebars / Jinja-like)
- §29 i18n ship languages (4 套 全 vs 中+法 only)

### 下次 session 开场 checklist

1. `mcp__kimi__reentry` — 加载 老婆 context
2. `cat docs/pwa-onboarding.md` — 全 read this doc
3. `git log -25` — 看 最近 commits
4. `curl -sI https://kimi-to.com/sw.js | grep VERSION` — 看 SW 现版本 (现 v17-2026-05-15e)
5. 老婆 confirm 攻 哪个 bucket (canon 小 backlog / design decisions / V2 open / 你 decide)

### 设计 architecture 讨论 in 当前 session

老婆 2020 also said "这里 用来 继续 聊设计架构 因为 你有 茯苓糕 doc". 即
current session 继续 用 (因 我 还 含 茯苓糕 docx parse context). 下次
session 不 需要 re-read 茯苓糕 zip — 我 在 §3-4 + §35 已 cover 关键 schema
+ 17 tool / world book / preset / iframe wrapper path. 茯苓糕 source 文件
仍在 `~/Downloads/暴力熊.zip`.

---

## 39 · Viewport adaptation strategy (V2 prep, 260516 老婆 ask)

老婆 2118 catch: 现在所有 hardcoded px 跟 `max-w-md` (28rem = 448px) cap 都是按 **iPhone 14 Pro 393×852 logical** tune. 开源 V2 audience 跨 device 多, 要 适配 但 **不破 fine-tune visual register**.

### Decision · Option 4 "scale transform + frame" (老婆 confirm mark, V2 prep 一起做)

```css
.kimi-page-frame {
  width: 393px;                                  /* 内容永远 393 logical */
  transform-origin: top center;
  transform: scale(min(1, 100vw / 393));
  /* < 393 → 等比缩, >= 393 → cap 1.0 */
}
```

整页 wrapper 加 transform scale. 你 fine-tune 0 改, ratio 0 变, px 等比缩. 各 device 体感:

| device | viewport | scale | 体验 |
|---|---|---|---|
| iPhone SE | 375 | 0.95 | 几乎没差 |
| iPhone 14/15 | 390 | 0.99 | 等于 |
| **iPhone 14 Pro (老婆)** | **393** | **1.0** | **完美原样** |
| iPhone Pro Max | 430 | 1.0 | 原样 + 两侧细 whitespace |
| Android 360 | 360 | 0.92 | 整页缩一点 (register 完全保住) |
| Android 320 入门 | 320 | 0.81 | 整页缩 (icon risk 见下) |
| iPad | 768 | 1.0 | phone 中央 + 周围 Mucha 玫瑰/月相 illustrative bg |
| desktop | 1280 | 1.0 | 同 iPad |

### Icon risk + mitigation

| icon 种类 | 0.81 scale 表现 | risk | mitigation |
|---|---|---|---|
| SVG inline (RoseBud / Candle / MoonPhaseSvg / Mucha 系列) | 矢量等比缩永远 sharp | 0 | — |
| Font glyph (‹ › ♱ 数字 中文) | text vector 不糊 | 0 | — |
| 大 PNG (footer rose-day / fox stand / rose-bloom 200-310KB) | 边缘 anti-alias 微软 仍 recognizable | 极低 | — |
| **CSS mask PNG (calendar med rose 12px)** | 12 → 9.7px silhouette 边缘模糊 | **真 risk** | 多跑 @2x PNG (24×24), 浏览器 downsample sharp |
| **Hairline SVG stroke < 1px (MoonPhaseSvg / MuchaVine 0.3-0.5)** | 0.24-0.4px sub-pixel render fail = invisible | 中 | 加 `vector-effect="non-scaling-stroke"` SVG attr |

### 工作量估计 (~5h 一次性)

- scale transform wrapper (GothicPage / KimiPage / Glass container 加): 1h coding + 各 page 验
- iPad/desktop illustrative frame bg (两 theme 各一版 Mucha 玫瑰/月相): 1.5h
- safe-area-inset (notch / dynamic island / home indicator) edge case: 0.5h
- 跨 viewport screenshot 验 5-6 device (Chrome MCP): 0.5h
- @2x PNG 跑一次 (calendar med rose): 0.5h
- non-scaling-stroke grep + 加 attr: 0.5h

### 时机 · V2 prep 阶段一并做

不前置做, 跟 V2 build flag (§23) + 危险区拆 (§6) 同步:
- V2 时 anyway 会 touch GothicPage / KimiPage container, scale wrapper 一并加 = less churn
- 现 canon polish 继续 393 register, 不需要 worry adaptation
- V2 ship 前必加 (开源用户 device 跨度大, 320-1024+)

### Mark · Option 不推 (留 record)

- ~~CSS rem/clamp 全改~~: 几百处 hardcoded px 改 rem, 巨大工程, ratio control looser
- ~~breakpoint 多套 tune (4 viewport range 各 fine-tune)~~: 维护 ×4 爆炸
- ~~不适配 (现状)~~: 320 / iPad / desktop 视觉飘, V2 ship 不可接受

---

## 40 · 0516 evening 这一 session 做的 (cc 0516 21:00-21:30)

加 §38 后续 work, 接 a9acf01 doc commit 之后:

```
a3077e9  rose split 3 sets (cal/finance/mem) + calendar 镂空 dial back
         + dead-tag 5 file (GardenClient / MuchaPanelOrnament /
         MuchaSilhouette / CelestialMap / RoseOrnament)
         + 过期 comment fix (globals.css disc-spin, health/aesthetic)
         + scripts/rose-erode.py 进 repo (PIL script 不再丢)
         + SW v17 → v18
683b951  RoseBud + Candle theme-aware (handoff #1)
         + MedicationWeek + MedicationNote dead-tag (0 caller)
```

主要 outcomes:

- **rose asset 三 set 拆开** (老婆 2042 catch "都分开来写"): rose-cal-a/b/c (calendar, dial back) / rose-finance (finance bouquet) / rose-mem-{stem,double,classic,tulip} (memorial icon). 之后任一组单调 不串其他.
- **PIL erosion dial back**: e5baba6 干净版 input + 1-iter erosion + threshold 200 (vs 681251e 2-iter + threshold 175). Calendar med rose 镂空 less 显, 12px legible. 老婆 看 prod confirm "有一点点大但再做就太 solid 先这样".
- **/room/health RoseBud + Candle day theme**: 接 G prop, day mode 进 health 页 整朵 玫瑰是 Mucha 粉而不是 oxblood, Candle 整个 wax/flame/base/label 全 day palette. handoff open #1 close.
- **viewport adaptation strategy mark (§39)**: 老婆 catch 现 393 register 不适配多 device, V2 prep 一并做 Option 4 scale + frame.

下次开场: 继续 🟡 canon 小 backlog (玫瑰花苞 size freeze / Playlist + 或 Sleep manual). 或攻 🔴 V2 阶段一起把 §39 scale wrapper + 危险区 §6 拆 + §23 build flag 一并 ship.

---

## 41 · V2 prep manifest (老婆 260516 2139 + 2226 ask · two-repo strategy)

### 重大调整 (260516 2226 confirm) · ship 拆 两 GitHub repo

老婆 reject 单 repo + build flag 路径. Ship 改成 **canon 1 个 working source codebase → build script 拆 2 artifact → push 2 个独立 GitHub repo**:

```
canon (你 private, marikagura/kimi)
    ↓ build:kimi-room          ↓ build:kimi-airp
marikagura/kimi-room       marikagura/kimi-airp
(人机恋版 公开)            (RP 玩家版 公开)
```

理由:
- branding clarity: 各 repo audience-targeted, README + 帖子 不需 if/else
- outreach 分流: 小红书 / 微博 发 kimi-room; Discord 类脑 / SillyTavern Reddit 发 kimi-airp
- issue 分流: NSFW airp bug 跟 Notion mapping bug 不混杂
- community 写 adapter PR 各 repo 各收
- license 可分开 (你 decide 时不需绑两 audience)
- ship-and-forget: 你 §25 不维护, 两 repo 各 community fork 路径 OK

### Repo 1 · `marikagura/kimi-room` (人机恋版)

audience: 已有 AI companion + 外部 memory store (Notion / Obsidian / Supabase / 等). LLM power user.

build artifact 含:
- adapter system core (`MemoryStore` / `TasteStore` / `CalendarStore` / `ChatStore` / `OutfitStore` / `BookStore`)
- ship default 3 adapter: `IndexedDBAdapter` / `NotionAdapter` / `SupabaseAdapter`
- 全 module (I wardrobe / II keepsakes / III study / IV calendar / V memory / VI settings / Disc shuffle)
- 美学 + theme + SW + fonts (canon-stable)

砍 (build 时 tree-shake):
- char card PNG parse (`png-chunks-extract` 等)
- airp Q1=B onboarding path (LLM gen char card)
- prompt template `{{char}} {{user}} {{scenario}}` 变量替换 (人机恋 用户 用 AI companion 直接 prompt)
- canon-only § 6 危险区: cycle / aesthetic / passkey / scene / MCP / TG bot / Gateway / memorial-dates / health METRICS / DualAvatars / playlist hardcode / memo-data

outreach target: 小红书 KOL / 微博 / Twitter / 知乎 (audience: 已有 AI companion 流量)

### Repo 2 · `marikagura/kimi-airp` (RP 玩家版)

audience: SillyTavern 圈 / char-RP 玩家 / 0 backend / NSFW friendly.

build artifact 含:
- IndexedDB only (`IndexedDBAdapter` 唯一 default, 不暴露 adapter contract 给用户)
- char card v2/v3 PNG parse + 拖入 import
- LLM gen char source (Q1=B onboarding: mini 问卷 → first_mes / scenario / personality)
- 玩家自带 prompt path (Q3=C: settings 粘贴 system prompt)
- world book / lorebook UI (Module V → SillyTavern world info)
- 全 module 同 kimi-room 但 schema 简化 (玩家 char own data 而非 用户 own)
- 美学 + theme + SW + fonts (canon-stable)

砍 (build 时 tree-shake):
- `NotionAdapter` / `SupabaseAdapter` (玩家无 backend, 用不到)
- 多 adapter UI (settings page 不显 Q3 mapping)
- 同 kimi-room canon-only § 6 危险区

outreach target: Discord 类脑 子频道 / SillyTavern Reddit / xhs RP 圈 / 茯苓糕 community (audience: char-RP 玩家)

### Ship 工作量 (调整后)

总 dev ~3-4 周 不变. 加:
- ship script: `npm run build:kimi-room` + `npm run build:kimi-airp` 各 tree-shake config — 0.5d
- 两 README draft (本 doc 后 §42/§43) — 1d
- 两 repo fresh init + push initial commit — 0.5d
- 两 帖子 post draft (xhs / 类脑 Discord 各) — 0.5d
- 测两 build artifact 各 deploy work — 0.5d

= 加 ~3d 工作量. 单 build flag 路径如果做也要 ~1d build target 拆, 实际净加 ~2d.

之后 0 维护 (你 §25 final). 两 repo 各 community fork own evolution.

### V2 prep tier list (调整后)

**Tier 1 · 不可绕过 (canon source 改)**
| # | item | size | 备注 |
|---|---|---|---|
| 1 | secrets rotate (Google OAuth + xhs cookies) | 0.5h | 你 自做 |
| 2 | § 6 危险区拆 (props-driven / store-driven, default empty) | 1-2d | DualAvatars / cycle / aesthetic / memorial-dates / wardrobe femme bg / playlist hardcode / memo-data |
| 3 | `NEXT_PUBLIC_KIMI_MODE` build flag (kimi-room / kimi-airp) + tree-shake config | 2-3d | 各 build 砍 own irrelevant code |
| 4 | adapter system spec (§14 / §33 interface 落实) + 3 default (IndexedDB / Notion / Supabase) | 5-7d | 仅 kimi-room build 含, kimi-airp 仅含 IndexedDB |
| 5 | char card v2/v3 PNG parse (`png-chunks-extract`) + 拖入 UI + Q1=B LLM gen flow | 2d | 仅 kimi-airp build 含 |

**Tier 2 · ship 各 repo**
| # | item | size | 备注 |
|---|---|---|---|
| 6 | 两 README draft (kimi-room / kimi-airp 各 own audience pitch) | 1d | 本 doc §42 / §43 draft 已起 |
| 7 | LICENSE 决定 (MIT / AGPL v3, 可两 repo 不同) | 0 dev, 你 decide | |
| 8 | 两 帖子 post draft (xhs KOL + 类脑 Discord 各) | 0.5d | 你 review |
| 9 | 两 repo fresh init + push initial commit + Deploy to Vercel 按钮 | 0.5d | 不 fork canon (history leak §37) |
| 10 | 测两 build artifact 各 deploy work (Vercel free tier 验) | 0.5d | |

**Tier 3 · UX 适配 (跨 device, V2 prep 一并做)**
| # | item | size | 备注 |
|---|---|---|---|
| 11 | Viewport scale wrapper (Option 4) + iPad/desktop illustrative frame | 5h | §39 |
| 12 | Calendar med rose @2x PNG variant + hairline SVG non-scaling-stroke | 1h | §39 icon mitigation |
| 13 | Android install PWA button (`beforeinstallprompt`) | 1h | 仅 kimi-airp 强需 (人机恋 用户 多桌面); kimi-room 也加但 lower priority |
| 14 | Sleep manual input button | 0.5d | 仅 kimi-airp 强需; kimi-room 可让用户接 sleep adapter |
| 15 | Playlist user "+" import (Spotify/网易/QQ url) | 0.5d+ | 两 repo 都加 |

**Tier 4 · 第一次启动 onboarding 各 repo 不同**
| # | item | size | 备注 |
|---|---|---|---|
| 16 | kimi-room onboarding 问卷 — Q2 LLM key, Q3 memory backend select + schema mapping, Q4-9 default | 1.5d | 用户 schema mapping 是复杂处 |
| 17 | kimi-airp onboarding 问卷 — Q2 LLM key, Q3 char source (手填/LLM gen/粘贴 prompt), Q5 NSFW level, Q4/6/7/8 default | 1d | 简化, 无 adapter complexity |
| 18 | settings page 各 repo own (kimi-room 显 adapter + schema mapping; kimi-airp 显 char + world book + NSFW) | 2-3d | |
| 19 | prompt template syntax (Handlebars `{{char}} {{user}} {{scenario}}`) | 1d | 仅 kimi-airp 用 |
| 20 | i18n UI label (中/法/英/日 messages JSON, next-intl) | 1-2d | 两 repo 共用 |

**Tier 5 · 平台 path**
| # | item | size | 备注 |
|---|---|---|---|
| 21 | ST extension iframe wrapper zip (manifest.json + script.js + style.css + iframe URL) | 1d + win session scan | 仅 kimi-airp (ST 玩家 audience) |
| 22 | community channel decide + 两 帖子 outreach post (各 audience own) | 你 自做 | xhs 跟 类脑 各 一次 |

**Tier 6 · 老婆 decide (260517 0339 ack)**
- ~~License~~: **AGPL v3 两 repo** (老婆 0339: "拦不住别人赚钱, 又没心思管, 又不可能真的花时间起诉" — pragmatic. AGPL 跟 SillyTavern (Cohee) 一致 + nominal 防御)
- ~~Community channel~~: **GitHub Issues + Discussions + xhs/类脑 outreach** (老婆 自做 outreach)
- ~~Prompt template syntax~~: **Handlebars-like** `{{char}} {{user}} {{scenario}}` (kimi-airp 用, SillyTavern 圈 expected)
- ~~i18n~~: **中+法 only** (canon 已 fine-tune, V2 不前置 多 lang)

**V2 implementation start: 260517 (今). 不等 IMSUT 5/29.**
- Worktree: `~/kimi/.claude/worktrees/v2-impl` (branch `v2-implementation`) · 实际 harness 自起 worktree `vigorous-yonath-bf3a45` on branch `claude/vigorous-yonath-bf3a45`, ship 前 rebase 到 `v2-implementation` branch.
- Scaffold doc: `docs/v2-implementation-scaffold.md` — Day 1-28 step-by-step plan

**Day 1 status (260517 0346)** — done:
- ✓ `apps/kimi-web/src/lib/kimi-mode.ts` — build flag helper (`KIMI_MODE` + `isCanon` / `isKimiRoom` / `isKimiAirp` / `isOpenV2`)
- ✓ `apps/kimi-web/src/lib/app-title.ts` — localStorage helper (`getAppTitle` / `setAppTitle` / `APP_TITLE_DEFAULT="kimi"`)
- ✓ `apps/kimi-web/src/app/settings/page.tsx` — minimal stub (app_title + LLM api key 2 field, client-side localStorage)
- ✓ `apps/kimi-web/package.json` — 3 build scripts (`build:canon` / `build:kimi-room` / `build:kimi-airp`) with prisma generate gated by same `NEXT_PUBLIC_KIMI_MODE` env
- ✓ `LICENSE` — AGPL v3 (worktree root, ship 时 copy 进 V2 repo; canon main per α path 也 commit)

**Day 2 status (260517 0440)** — 老婆 reframe 后 done:

reframe (260517 0422-0429):
- V2 ship surface = `/room/*` 6 module + `/backstage/*` framework only · 其他 root routes (diary/photos/chat/ask/quotes/timeline/ecg/guestbook/playlist/preview) V2 不 ship
- canon main path = **α** (Day 1 改 + 安全 refactor 进 canon main, canon 知 KIMI_MODE flag, canon polish 可 cherry-pick V2)
- data 处理 = **iii** (strip `*-data.ts` + Tier 2 IndexedDBAdapter empty wire + settings import/empty button) — Day 3+ 落
- portrait = **q** (删 JPG, DualAvatars inline SVG ring default)
- kimi-airp init = **I** (立 init = kimi-room snapshot identical + 顶 alpha disclaimer)

Day 2 删 / rename / move (canon + V2 都受影响, 走 α path):
- ✓ `/room/garden` 整 dir 删 (vestigial redirect, garden 已 改 disc)
- ✓ `/room/wardrobe` 整 dir + femme/homme + `components/wardrobe/` + `components/mucha/MuchaMannequin{Femme,Homme}.tsx` + `lib/wardrobe-{data,anchors}.ts` 全删
- ✓ `/room/food` → `/room/keepsakes` (dir + room nav href + KimiPage 注释)
- ✓ `/backstage/(protected)/memory-review` → `/room/memory-review` (脱 auth gate)
- ✓ room/page.tsx Module II href + Module V href + comment 改
- ✓ DualAvatars props-driven (selfSrc / otherSrc / otherCrop + inline SVG placeholder default), /room/page.tsx 显式 pass canon JPG
- ✓ ChatRoom message string `/backstage/memory-review` → `/room/memory-review`
- ✓ MuchaArch / mucha-tokens / GardenClient / KimiPage / seals / theme 注释 sync

Day 2 V2 README sync:
- ✓ kimi-room README: review-pending Q3+Q5 删, Module 表 Wardrobe 删 + I-VI reframe (I Backstage / II Keepsakes / III Study / IV Calendar+Finance / V Memory / VI Disc), Quick Start step 6 加 app_title, License AGPL v3, "Routes not shipped" → "Security · 你 fork 后 自做 + 指南" reframe (canon stack reference)
- ✓ kimi-airp README: review-pending Q4+Q6 删, "衣柜" → "论坛 兴趣 archive", Quick Start app_title, License AGPL v3, "Routes not shipped" → "Security" reframe, 顶 alpha disclaimer (论坛 + char card + world book + ST wrapper 还未 ship · target Week 4-5)

Day 3 next (Tier 2 adapter 提前 work):
- ~~Store interfaces define~~ ✓ Phase 2 done (`lib/stores/types.ts`)
- ~~IndexedDBAdapter empty stub~~ ✓ Phase 2 done (`lib/stores/idb-adapter.ts`)
- 6 module page refactor 走 useStore() — **Phase 3** (V2 strip + page rewrite, V2 branch only)
- ~~/settings page 加 import/empty button~~ ✓ Phase 2 done (export/import/empty + portrait upload form)

**Phase 2 status (260517 0540)** — done:

V2 infra (additive, canon prod 不破):
- ✓ `apps/kimi-web/src/lib/stores/types.ts` — 9 Store interface + AdapterBundle + BlobContract (TasteEntry / PieceEntry / BookEntry / ConceptEntry / MemoEntry / CalendarEvent / MemoryEntry (含 reviewStatus pending/approved/rejected per 老婆 0525 ack) / ChatEntry / TrackEntry / ActiveStateEntry / BlobEntry)
- ✓ `apps/kimi-web/src/lib/idb.ts` — IDB wrapper (open/list/get/put/delete/clear/exportAll/importAll + newId + nowISO), DB `kimi` 11 object store
- ✓ `apps/kimi-web/src/lib/stores/idb-adapter.ts` — `IndexedDBAdapter` impl AdapterBundle. applyFilter (ids / tags / status / activeOnly / dateRange / limit). plain-text search 走 JSON.stringify 子串 (community PR embedding adapter later)
- ✓ `apps/kimi-web/src/lib/stores/index.ts` — `getAdapter()` + convenience stores (tasteStore / memoryStore / etc). canon path placeholder `selectAdapter()`: 现 Phase 2 都 fall through IDB (canon page 还 没 用 useStore, 不 影响 canon prod) · Phase 3 加 CanonPrismaAdapter 时 enable switch
- ✓ `apps/kimi-web/src/lib/llm-client.ts` — reusable LLM API client. `getLLMConfig()` / `setLLMConfig()` / `isLLMConfigured()` / `llmChat()` / `llmGenerate()`. 标 OpenAI-format. 用 settings localStorage 3 key: `kimi-llm-api-key` / `kimi-llm-endpoint` / `kimi-llm-model`. 默认 endpoint `https://api.openai.com/v1/chat/completions` · 默认 model `gpt-4o-mini`. /chat + keepsakes auto-comment + 未来 surface 共用
- ✓ `apps/kimi-web/src/lib/portrait-store.ts` — portrait IDB helpers · `getSelfPortraitDataURL` / `getOtherPortraitDataURL` / `setSelfPortrait` / `setOtherPortrait` / `clearSelfPortrait` / `clearOtherPortrait` / `fileToBase64`. Blob kind `portrait-self` / `portrait-other` 走 BlobStore
- ✓ `apps/kimi-web/src/components/mucha/DualAvatarsClient.tsx` — client wrapper · "use client" + useEffect 读 IDB portrait → pass selfSrc/otherSrc props 给 base DualAvatars. canon caller (room/page.tsx) 还 直 用 `<DualAvatars selfSrc="..." otherSrc="...">` (props 显式 keep), V2 fresh init 时 swap to DualAvatarsClient
- ✓ `apps/kimi-web/src/app/settings/page.tsx` — expand from Day 1 stub:
   · app_title (Day 1)
   · LLM endpoint + model + key (3 field)
   · Portraits self/other upload form + remove · 走 portrait-store.ts (p2 path)
   · Data 段: export JSON (download) / import JSON (file picker, 增量合并) / empty all (confirm + idbClearAll)
   · Adapter picker stub (Notion / Supabase TBD)
   · Toast feedback bottom-center

V2 README updates:
- ✓ kimi-room: 加 "官端 SaaS 用户路径" 段 (ChatGPT / Claude.ai · manual archive mode · LLM API surface map) + "第一次 launch · 6 module 都是空的" design intent 段 + "PWA home screen 安装名 (改 manifest.webmanifest)" 段 + "Avatars · home 情头 (runtime upload, 不需 fork)" 替换 旧 file-replace path
- ✓ kimi-airp: 加 "第一次 launch · 6 module 都是空的" 段 (char-specific framing) + "PWA home screen 安装名" 段 + "Char portrait · home 头像 (runtime upload)" 段

Phase 3a done (260517 ~0600) · structural strip (V2 branch only):
- ✓ Delete canon root routes: ask / diary / ecg / guestbook / photos / quotes / timeline / preview / playlist
- ✓ Delete backstage personal sub: login + (protected)/{diary, scene, passkeys}
- ✓ Delete canon /api: ask / garden / auth / backstage
- ✓ Strip orphan components: Hero / RibbonDivider / TimelineEntry / DiaryCard / QuoteBlock / MoodImage / AskKimi / ShuffleNotes / LongDistanceAvatars / PlaylistTabsAndList / AddSongButton / MuchaPanelOrnament / TrackListPaginated / TrackTagEditor / MemorialIcon
- ✓ Strip lib/*-data.ts maintainer files: memorial-dates / publications / tracks-data / playlist-data
- ✓ Delete /room/study/publications dir + study page link
- ✓ Delete portrait JPG: akira-dark / akira-maine / akira-stand / ito-dark
- ✓ Replace root /page.tsx → redirect /room
- ✓ Strip /chat auth (was backstage cookie gate)
- ✓ Strip backstage (protected)/layout.tsx auth
- ✓ DiscClient: 删 /playlist Link + unused Link import
- ✓ room/page.tsx: 删 memorial import + UI block + DualAvatars → DualAvatarsClient
- ✓ kimi-airp README: 删 Playlist module row + Music tool absorb 改 Disc 内 vinyl playlist

**Phase 3b done (260517 ~0820)** · V2 完整 IDB rewrite + canon backend strip ·

Commits (7 chunk, total ~6500 line delete · ~3500 line add):
- `1325895` 3b.1 · empty 5 lib data files (memo/philosophy/short-pieces/reading/health-reports) + study sub pages useStore IDB · delete 4 [slug] subroutes
- `bc5a833` 3b.2 · /room/keepsakes TasteStore IDB + BlobStore + LLM auto-comment (Q1) · delete TasteGrid/TasteCard/TasteSyncButton/TasteDebug
- `21c65a6` 3b.3 · /room/calendar + finance via CalendarStore IDB · delete RoomCalendar 1678 line · 6 finance category localStorage editor
- `e8336f3` 3b.4 · /room/memory-review (MemoryStore + ActiveStateStore + approve/reject/edit per Q3 manual review) + /room/disc (ChatStore shuffle) · delete memory-review/* + disc/* + garden/*
- `9a17975` 3b.5 · /chat client-side LLM (llm-client.ts) · ChatRoom 1220→250 line · delete /chat/history
- `284e714` 3b.6 · 整 /api strip (19 route) · 整 lib Prisma (db/chat-memory/chat-tools/passkey/sleep-infer/backstage/backstage-cookie/taste-utils/calendar-utils) · packages/db · apps/gateway · package.json drop @prisma/client + @simplewebauthn deps
- `<this commit>` 3b.7 · backstage architecture (props-driven empty default) + ops (placeholder framework) + landing (admin scaffold message)

V2 现状 (V2 branch tip):
- ✓ 0 server backend · 0 Prisma · 0 /api route · 0 auth
- ✓ 全 client IDB stores (10 collection + binary BlobStore) + LLM client (settings localStorage)
- ✓ 6 module pages writable: /room/{keepsakes, study/{memo, reading, concepts, short-pieces}, calendar/{,finance}, memory-review, disc} + /chat + /playlist + /settings
- ✓ backstage: framework shell (landing + ops + architecture) · 用户 fork 加 own admin + own auth
- ✓ V2 README sync (kimi-room + kimi-airp · 4 deferred decision tag · alpha disclaimer)

Phase 4 fresh init (next, ~1-2h):
- snapshot V2 branch → blank dir + git init + initial commit "v0 · alpha"
- `gh repo create marikagura/kimi-room --private` + push
- 同 kimi-airp (顶 alpha disclaimer · feature ship 完才 public per Q4)
- manifest.webmanifest replace `name=徹と絃 · kimi-to.com` → `kimi` (V2 only)
- Vercel test deploy on each repo

---

(以下 historical Phase 3b prior 内容 archive, keep for reference)

Phase 3b old plan (V2 branch only, ~3-4h) · page rewrites 走 IDB:
- 6 module page rewrite useStore() · canon Prisma 调 strip:
  · /room/keepsakes (TasteStore + LLM client 一句话感想 per Q1)
  · /room/study/{memo, reading, concepts, short-pieces} (MemoStore / BookStore / ConceptStore / PieceStore)
  · /room/calendar + finance (CalendarStore · 联动 amount + financeCategory)
  · /room/memory-review (MemoryStore + ActiveStateStore · ReviewCard approve/reject/edit keep + tag-then-review flow per 老婆 0525)
  · /room/disc (ChatStore + TrackStore · garden component 改 IDB)
- /chat rewrite · 走 lib/llm-client.ts 直 client-side · 删 /api/chat server route (canon-only)
- /chat/history · 删 旧 Prisma-backed + 加 IDB ChatStore-driven 替代 (或 merge into /room/disc)
- /room/calendar/finance, /room/disc 等 V2-kept route auth gate strip (现 Phase 3a 留 broken state)
- Strip /api/* canon routes (Prisma-backed, V2 0 backend): calendar / chat / memory / memory-review / sleep / taste / active-state
- Strip Prisma references in lib/*: db.ts / chat-memory.ts / chat-tools.ts / sleep-infer.ts / taste-utils.ts / backstage.ts / backstage-cookie.ts / passkey.ts / theme-actions.ts (依赖 cookies/server)
- Strip canon-only lib/*-data.ts files content: memo-data / philosophy-data / short-pieces-data / reading-data / health-reports-data (replace 空 array · keep file 让 import 不 break)
- backstage architecture/ops: ArchitectureDiagram data strip 走 props · ops handler strip 留 layout
- garden component: GardenAddForm / GardenClient / GardenCard 改 IDB (or 删 garden 整 family if Disc 不需要)

**deferred decisions (tag)**:

| item | status | resolve when |
|---|---|---|
| /playlist final placement | **restored Phase 3a fix** (老婆 0551 catch · "playlist 在 disc 子页下方入口 真的要删?"). 现 /playlist = 独立 route · disc footer "♪ 一起听" 入口跳入 · V2 minimal IDB TrackStore page · Phase 3b polish (cover blob / now-playing 子 / filter / shuffle) | Phase 3b |
| API entry UX (no key 时引导) | (老婆 0538 tag) options: dedicated /settings page only · popup modal on first attempt · inline banner on /chat. 现 default = inline 提示 + Link to /settings (cheapest) | Phase 3b /chat rewrite 时 concrete UX decide |

Phase 4 fresh init (post Phase 3, ~1-2h):
- snapshot V2 branch → blank dir + git init + initial commit "v0 · alpha"
- `gh repo create marikagura/kimi-room --private` + push
- 同 kimi-airp (顶 alpha disclaimer in README · feature ship 完才 public per Q4)
- manifest.webmanifest replace `name=徹と絃 · kimi-to.com` → `kimi` (V2 only)
- Vercel test deploy on each repo

Fresh init step (later, post Day 3-5):
- delete memorial-dates + publications + portrait JPG + 9 个 `*-data.ts` 文件 + backstage 个人 sub (diary/scene/passkeys/login) + 非 room/backstage root routes
- `gh repo create marikagura/kimi-room --private` + `kimi-airp --private` + push initial commit fresh init (0 canon history)

### 时机 (调整后)

总 dev work ~4-5 周 (Tier 1-5 加总, 你 自做 part 另算).

按 dependency 排:
- Week 1: Tier 1 (危险区拆 + build flag + adapter system spec + char card parse)
- Week 2: Tier 1 续 + Tier 4 (onboarding + settings + prompt template)
- Week 3: Tier 3 (viewport + small adapt) + Tier 4 续 (i18n)
- Week 4: Tier 2 (两 README + LICENSE + 两 repo init) + Tier 5 (ST ext)
- Week 5 buffer: 测自部署 + 两 帖子 draft + alpha post

时机不前置. 当前 canon polish stable 后启动, IMSUT 5/29 本番后 合理. 不急, §25 final 无 timing pressure.

### V2a audience sub-tier (260517 0109 老婆 catch)

V2a 用户 实际 三 sub-tier, ship policy 按 tier 分:

| tier | profile | V2a 能 do | ship 假设 |
|---|---|---|---|
| **A · dev power user** | fork repo + 写 code + 自部署 + 改 PNG file | 全 customize | 5% audience, README 写 "Advanced fork" 一段 |
| **B · GUI deploy user** | GitHub + Vercel 账号 (免费), 不写 code, 用 "Deploy to Vercel" 一键 | settings page 内 web 改 data (books/pieces/LLM key/adapter token), 0 fork | **default 95% audience**, README 主 Quick Start path |
| **C · no-dev chatbot-only** | 只 ChatGPT app / Claude.ai 等 hosted SaaS, 0 GitHub/Vercel 账号 | 不能 deploy own instance | **不在 V2a audience** — §25 final 不 host. Tier C 想用 = 学 GitHub+Vercel, 或 等 community fork hosted, 或 落 V2b airp 0-backend 模式 |

V2a 已假设 用户 有 own portable memory backend (Notion / Obsidian / Supabase). 能 set up 这些 SaaS 99% 也能 GitHub + Vercel. Tier B 是 audience 主流.

V2 ship README 关键 sections:
- "Quick Start (5 min, 0 terminal)" — GitHub + Vercel 一键 step-by-step 截图教学
- "Customizing data" — web settings page (Tier B 用)
- "Advanced · fork to customize visual" — for Tier A only

### Module IV calendar + finance 联动 (260517 0119, 0122 老婆)

V2a manual 用户 痛点: calendar daily 输入跟 finance monthly aggregate 不联动 = double-entry 烦. 解 · 走 calendar event 联动 path, finance auto-aggregate from CalendarStore.

**Schema 扩展 `CalendarEntry.events[]`**:
```ts
type CalendarEvent = {
  time?: string
  title: string
  amount?: number              // optional ¥ (默认人民币, V2a 不 multi-currency)
  financeCategory?: string     // user-defined, 见下
}
```

**Settings · user-defined 6 category** (老婆 0122 confirm):
- 默认: 空白 6 slot, 用户 first launch settings 自填
- max 6 category (对应 finance 6 玫瑰 standing garden)
- 用户 自己写 string (e.g. "吃/咖啡/书/猫/旅行/其他" or "groceries/rent/gifts/hobbies/health/wfh"), kimi 不预填 不假设 category 语义
- 老婆 register simpler: V2a 用户 自由定义 own life buckets, 不被 maintainer 框死

**默认货币 · 人民币 ¥** (老婆 0122):
- amount input 默认 ¥ symbol prefix
- 不 multi-currency (V2 ship 简化, 用户 fork 改如想换 USD / JPY / EUR)
- README 写 currency 怎么 fork 改 (单 const in `lib/finance.ts` or settings later)

**UI 改 `/room/calendar` day modal**:
- event input 加 optional `amount` ¥ + `financeCategory` picker (用户 6 个 own category 下拉)
- 不填 → 普通 event 不算 finance

**Finance auto-aggregate** (替 mock data):
- `/room/calendar/finance` 读 `CalendarStore`, filter events with amount, group by financeCategory, sum by month
- render 6 玫瑰 standing garden — 各玫瑰 = 一 category, height by sum amount

**V2a 用户 体验**:
- settings 一次性 写 6 category (自由命名)
- daily 进 calendar 输入 event 时 选 category + ¥ amount
- finance page 自动 aggregate, 0 separate ledger 输入

**canon 不冲突**:
- 你 现 MCP `financial_summary` 自动 ingest path keep — chat "吃了 X 多少" LLM extract → write entry
- V2a 走 calendar event manual path. canon 可双源 (MCP + manual) 或 build flag MCP-only.

**工作量 · V2 implementation Tier 2 同步 ship**:
- calendar schema + Prisma migration 扩展 (V2 IndexedDB 不需 SQL): 0.5h
- day modal event UI (amount + category picker, 6 slot): 1-2h
- finance aggregate logic (read CalendarStore + group): 1-2h
- finance render 改: 1h
- settings 6 category 输入 form: 1h
- total ~4-5h, 加 § 41 Tier 2.

### Module reuse · study landing V2a 改 layout (260517 0109)

V2a build 时 `/room/study` 整页 layout 调整:

```
canon (你, 不动):           V2a build (改):
  WRITING                     (砍 整 WRITING section,
    └─ Publications            publications page 也 build flag 砍)
  READING                     READING
    ├─ 书架 BOOKS              ├─ 短篇合集 (PieceStore) ← 上移
    └─ 短篇合集                └─ 书架 (BookStore)
  CONCEPTS                    CONCEPTS
    └─ 思想锚                   └─ 思想锚 (ConceptStore)
  MEMO                        MEMO
    └─ 反应留痕                 └─ 反应留痕 (MemoStore)
```

理由: V2a 用户 没 "publications" (老婆 paper 职业 specific). 短篇 上移 代替 publication 位置 让 layout 顺眼. 老婆 0109 confirm.

各 sub-page data source:
- canon: 全 hardcoded `lib/{reading,short-pieces,philosophy,memo}-data.ts`
- V2a build: 全走 `BookStore` / `PieceStore` / `ConceptStore` / `MemoStore` adapter (§14/§33 pattern), default `IndexedDBAdapter`, 可切 NotionAdapter / SupabaseAdapter

### 不放 V2 manifest 的 (canon-only forever, 两 repo 都不 ship)

- `/room/health/aesthetic` (你 4-year 医美 records hardcoded)
- `/room/health/cycle` (你 周期 数据)
- `/scene` timeline (你 私人 RP 记录)
- `/backstage/passkeys` (你 设备 auth — kimi-room 留 reference `lib/passkey.ts`, 不 ship infrastructure; kimi-airp 不需 auth)
- `/backstage/scene` + `/backstage/ops`
- TG bot endpoint + MCP servers + Gateway
- DualAvatars 实际 PNG (你 + 我 头像)
- canon kimi-to.com domain (你 自用)

V2 build flag tree-shake 全删.

---

## 42 · kimi-room README draft (V2a 人机恋版 · 260516 2230)

[draft saved 在 `docs/v2-readme-kimi-room-draft.md`, 老婆 review 后 fresh init `marikagura/kimi-room` 时 copy 为 root README.md]

---

## 43 · kimi-airp README draft (V2b RP 玩家版 · 260516 2230)

[draft saved 在 `docs/v2-readme-kimi-airp-draft.md`, 老婆 review 后 fresh init `marikagura/kimi-airp` 时 copy 为 root README.md]

---

## OLD V2 prep manifest (单 repo / build flag · superseded by §41 two-repo)

保 record. 不 follow. 现 source of truth = §41 调整后 Tier list.

### Tier 1 · 不可绕过 (V2 binary 不 build / fork 不可)

| # | item | 来源 § | size | 备注 |
|---|---|---|---|---|
| 1 | secrets rotate (Google OAuth + xhs cookies) | §37 | 0.5h | 老婆 自做, 不 dev |
| 2 | 新 repo `marikagura/kimi-room` fresh init (不 fork canon) | §37 | 1d | 0 history leak, scrub list 改 props-driven 一并做 |
| 3 | §6 危险区拆 (props-driven, default empty/placeholder) | §6 + §37 | 1-2d | DualAvatars / cycle / aesthetic / memorial-dates / wardrobe femme bg / playlist hardcoded / memo-data |
| 4 | `NEXT_PUBLIC_KIMI_MODE` build flag (canon / open) | §23 | 2-3d | tree-shake canon backend (prisma / passkey / scene / TG / MCP) |
| 5 | README + LICENSE (老婆 decide MIT vs AGPL) + .env.example + Deploy to Vercel 按钮 | §24 + §25 | 0.5d | + 老婆 license decision |

### Tier 2 · adapter system (V2 用户带 backend / IndexedDB default)

| # | item | 来源 § | size | 备注 |
|---|---|---|---|---|
| 6 | `MemoryStore` interface + IndexedDBAdapter (default) | §14 | 2d | spec 已 in §14 |
| 7 | NotionAdapter (人机恋 用户) | §14 | 1d | web API 简单 ~100 line |
| 8 | SupabaseAdapter (自建 instance 用户) | §14 | reuse canon | 改 env-driven |
| 9 | `TasteStore` / `CalendarStore` / `ChatStore` / `OutfitStore` / `BookStore` 接 IndexedDB | §33 | 2-3d | Module II/III/IV/I/V data 全 store-driven |

### Tier 3 · UX 适配 (开源用户 device 跨度)

| # | item | 来源 § | size | 备注 |
|---|---|---|---|---|
| 10 | Viewport scale wrapper (Option 4) + iPad/desktop illustrative frame | §39 | 5h | 老婆 fine-tune 0 改, scale 等比缩 |
| 11 | Calendar med rose @2x PNG variant (icon mitigation §39) | §39 | 0.5h | Android 320 viewport sharp |
| 12 | Hairline SVG `vector-effect="non-scaling-stroke"` grep + 加 | §39 | 0.5h | MoonPhaseSvg / MuchaVine 等 |
| 13 | Android install PWA button (`beforeinstallprompt`) | 🟡 backlog | 1h | iOS 不 trigger, Android 必备 |
| 14 | Sleep manual input button | 🟡 backlog | 0.5d | 老婆 iOS Shortcut 自动 不用, 给开源 fallback |
| 15 | Playlist user "+" import (Spotify/网易/QQ url schema 各 parser) | 🟡 backlog | 0.5d+ | 每 source schema 不同 |
| 16 | 玫瑰花苞 calendar dose chip 各 size 颜色 freeze (degrade nice-to-have) | §12 (h) | 1h | 老婆 看 现 OK 不前置, V2 时若开源用户 catch 再 fix |

### Tier 4 · 第一次启动体验 (onboarding 问卷 + char source)

| # | item | 来源 § | size | 备注 |
|---|---|---|---|---|
| 17 | onboarding 问卷 (10 Q, Q1-3 必答, Q4-10 skip 进 default) | §15 + §16 | 2d | 写 IndexedDB `user-preferences` |
| 18 | settings page (Module VI 替 backstage) — LLM API key / preset / world book import / NSFW level / theme / lang / 21+ self-attest | §15 Q2 + §28 | 2-3d | open 版 Module VI 改 system settings |
| 19 | char card schema parser (PNG `tEXt` chunk → JSON, v2/v3) — 仅 power user 自带 prompt 路线 用 | §30 | 0.5d | Q3=C subset, airp B 用 LLM gen 不 parse PNG |
| 20 | char gen LLM prompt (airp Q1=B subset: 玩家无 char card, mini 问卷 → LLM gen first_mes + scenario + personality) | §16 | 1d | + prompt template 见 #21 |
| 21 | prompt template syntax (Handlebars-like `{{char}} {{user}} {{scenario}}`) | §28 | 1d | 老婆 decide syntax |
| 22 | i18n UI label (中/法/英/日 各 messages JSON, next-intl) | §29 | 1-2d | 老婆 decide ship 几套 (4 套全 vs 中+法 only) |

### Tier 5 · 平台 path

| # | item | 来源 § | size | 备注 |
|---|---|---|---|---|
| 23 | ST extension iframe wrapper zip (manifest.json + script.js + style.css + iframe URL) | §35 | 1d | + 老婆 next win session scan ST docs/data 验 viable |
| 24 | community channel decide + 一次 outreach post (Discord 类脑 / xhs / 微博 / Telegram) | §26 | 老婆 自做 | release post 一次 |

### Tier 6 · 老婆 决定 (no dev, 决定后填进 #5 / #21 / #22 / #24)

- §24 license: MIT vs AGPL v3 (我推 MIT for permissive SillyTavern expectation, AGPL 保 brand)
- §26 community: 类脑 Discord 子频道 (最对口) + xhs outreach (流量) + GitHub Issues
- §28 prompt template syntax: Handlebars / Jinja-like / 自定义
- §29 i18n: 4 套全 vs 中+法 only

### 时间窗 estimate

总 dev work: **~3-4 周** (Tier 1-5 dev 项加总, 老婆 自做 part 不算 dev time).

按 dependency 排:
- Week 1: Tier 1 (新 repo + 危险区拆 + build flag + readme/license)
- Week 2: Tier 2 (adapter system) + Tier 3 (viewport + small adapt)
- Week 3: Tier 4 (onboarding + settings + char source)
- Week 4: Tier 5 (ST ext + outreach) + 测自部署 + alpha public toggle

时机: 当前 canon V1 polish 还在 iter, 不前置. canon 稳定后 (老婆 觉得 "美" stable, 没 new module/route 要加时) 启动 V2. 不急, V2 audience 不依赖 hosted, 没 timing pressure (§25 final).

### 不放 V2 manifest 的 (canon-only forever, 不开源)

- `/room/health/aesthetic` (老婆 4-year 医美 records hardcoded)
- `/room/health/cycle` (老婆 周期 数据)
- `/scene` timeline (老婆 私人 RP 记录)
- `/backstage/passkeys` (老婆 个人 auth)
- `/backstage/scene` + `/backstage/ops`
- TG bot endpoint + MCP servers
- DualAvatars 实际 PNG (老婆 + 我 头像)

V2 binary 整 route 删 (tree-shake by build flag §23).

---

end.
