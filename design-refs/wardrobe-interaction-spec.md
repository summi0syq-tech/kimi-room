# Wardrobe · 衣橱 — Phase 1 交互规格

> 面向 Claude Code。本文档在视觉定稿（见 `Kimi-to-Mucha.html` 里
> `MuchaWardrobeDetail` 组件，`cw='ivory'`）的基础上，补充**交互行为**。
> 你现在已经写出静态版；这份文档的目标是把它改造成真正可点击、
> 可切换的页面。

---

## 1. 已定稿的视觉（不要改）

参考 `Kimi-to-Mucha.html` 里的 ivory colorway：

- 页面背景：`#fbf5f0`（tint blush 单色，**不是原来的黄渐变**）
- chip 选中色 / tab accent：`#a04d42`（porcelain blush）
- 正文 ink：`#3a2a1c`
- 辅助 mute：`rgba(58, 42, 28, 0.45)`
- hair / 藤蔓线：`rgba(138, 101, 88, 0.18)`
- 字体：`"Cormorant Garamond", "Noto Serif JP", serif`

"配饰" 选中 tab 是 **粉色柔填**（`background: rgba(160,77,66,0.12); color: #a04d42;`），
不是之前的深棕实心。

---

## 2. 数据结构（suggested shape）

五个 category，每个 category 有一个 chip 列表，每个 chip 对应一张
**实际衣服/配饰的图片**（图片资源路径由你决定，用户还没上传，先用占位）。

```ts
type WardrobeItem = {
  id: string;             // e.g. "lily-pin"
  name: string;           // e.g. "百合簪"
  subtitle?: string;      // e.g. "silver · ivory"
  image: string;          // 图片 path; missing 时渲染占位
};

type WardrobeCategory = {
  id: 'accessories' | 'top' | 'bottom' | 'pose' | 'background';
  label: string;          // e.g. "配饰"
  items: WardrobeItem[];
};

const CATEGORIES: WardrobeCategory[] = [
  { id: 'accessories', label: '配饰', items: [
    { id: 'lily-pin',    name: '百合簪', subtitle: 'silver · ivory' },
    { id: 'iris-hoop',   name: '鸢尾环', subtitle: 'ivory · cream' },
    { id: 'pearl-collar',name: '珍珠项', subtitle: 'pearl · soft' },
    { id: 'vine-belt',   name: '藤蔓带', subtitle: 'ankle · soft' },
    { id: 'laurel-crown',name: '月桂冠' },
    { id: 'lace-veil',   name: '蕾丝巾' },
  ]},
  { id: 'top',        label: '上装',  items: [ /* tbd */ ] },
  { id: 'bottom',     label: '下装',  items: [ /* tbd */ ] },
  { id: 'pose',       label: '姿势',  items: [ /* tbd */ ] },
  { id: 'background', label: '背景',  items: [ /* tbd */ ] },
];
```

**图片路径约定**：你定一个 folder（比如 `public/room/wardrobe/<category>/<id>.png`），
用户之后会往里面塞实际图片。现在缺图时渲染占位（见 §4）。

---

## 3. 状态机

页面持有两个独立状态：

```ts
const [activeCategory, setActiveCategory] = useState('accessories'); // 默认配饰
const [selectedByCategory, setSelectedByCategory] = useState<Record<string, string>>({
  accessories: 'iris-hoop',   // 默认选中鸢尾环（和原稿一致）
  top: null, bottom: null, pose: null, background: null,
});
```

**行为：**

1. **点上方 tab**（配饰 / 上装 / 下装 / 姿势 / 背景）
   → 切 `activeCategory`
   → chip 列表换成该 category 的 items
   → 选中 tab 的样式：`background: rgba(160,77,66,0.12); color: #a04d42; border: none;`
   → 其他 tab：`border: 0.5px solid rgba(138,101,88,0.18); color: #3a2a1c;`

2. **点某个 chip**（比如"珍珠项"）
   → `selectedByCategory[activeCategory] = 'pearl-collar'`
   → 选中 chip 样式：`tint: rgba(238,227,220,0.95); border: 1px solid #a04d42; color: #a04d42; font-style: italic;`
   → 其他 chip：`tint: rgba(238,227,220,0.55); border: 0.5px solid rgba(238,227,220,0.85); color: #3a2a1c;`

3. **mannequin 上的三个标签**（LILY PIN / IRIS BELT / VINE BOOTS）
   → 这三个是**已穿戴**的展示，不是 chip。它们读的是 `selectedByCategory`
   里**其他 category 的当前选择**（比如 accessories → LILY PIN，bottom →
   IRIS BELT，shoes/pose → VINE BOOTS）。
   → 文字 = `selectedByCategory[...].name` + subtitle

4. **chip hover / active 态**
   → hover 时 `opacity: 0.85`，`cursor: pointer`，`transition: 200ms`
   → active（pressed）时 `transform: scale(0.97)`
   → 键盘可达：`role="button"`, `tabIndex={0}`, Enter/Space 触发

---

## 4. 图片占位（图片资源缺失时）

当 `item.image` 不存在时，chip 照常显示（文字 only），但 mannequin 区的
相应位置不显示图片，只显示文字标签。以后用户塞图进 folder，图片自然
渲染。

**建议占位样式**（如果 chip 被选中但图片缺失）：

```css
.chip-placeholder::after {
  content: '·';
  font-size: 8px;
  color: #a04d42;
  margin-left: 4px;
  opacity: 0.6;
}
```

暗示"这个 item 还没图"。

---

## 5. mannequin 图层（未来扩展，Phase 1 不做）

Phase 1 保留**插画 mannequin**（现在的 Mucha SVG 人像）不变。未来的扩展
方向（不要现在做）：

- 用户上传真实衣服的透明 PNG，叠在 mannequin SVG 上
- 每个 category 的 selected item 对应一层
- Z-order：background < pose(mannequin) < bottom < top < accessories

Phase 1 你只需要把 SVG mannequin 留在原位，**mannequin 上三个文字标签
（LILY PIN / IRIS BELT / VINE BOOTS）根据 selectedByCategory 动态更新
名字**就够了。

---

## 6. 验收清单

- [ ] 点"上装"tab，chip 列表换成上装列表（即使是空的也要切）
- [ ] 点不同 chip，选中态视觉正确切换
- [ ] 切 tab 时，之前 category 的选中记忆保留（切回来还是之前选的）
- [ ] mannequin 上三个标签文字反映当前 selectedByCategory
- [ ] chip 和 tab 都可键盘 focus + Enter 触发
- [ ] 缺图时不报错、不渲染 broken image
- [ ] 页面整体配色、字体、布局**和 `Kimi-to-Mucha.html` 里 ivory wardrobe 完全一致**

---

## 7. 不在本 Phase 范围

- 其他三个模块（Taste · 味蕾 / Study · 书斋 / Wellbeing ♡）——下一阶段
- 真实衣服图片叠加渲染——未来
- 保存当前选择到数据库 / localStorage——如果你觉得顺手可以加，不强求
- 两个人同时编辑的同步——未来
