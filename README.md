# 图构 DiagramCraft Skill

> 面向毕业设计的文本驱动图表生成 Skill：**输入需求 → 生成图片**。
> 在线体验：https://bishe.shawu.chat/

把中文项目描述转成 9 种可直接使用的工程图，并输出 PNG / SVG：

功能模块图、流程图、用例图、系统架构图、时序图、UML 类图、ER 属性图、全局 ER 图、数据库三线表。

## 30 秒上手

```bash
git clone https://github.com/boshi-xixixi/diagramcraft.git
cd diagramcraft

node scripts/render.mjs --type module --file examples/module.txt --out module.png
# → { "ok": true, "width": 1286, "height": 687, "file": ".../module.png", "format": "png" }
```

只要本机有 Chrome / Chromium 即可，**零 npm 依赖**；用 `CHROME_PATH` 可指定浏览器路径。

## 给 Agent 用（标准 Skill 结构）

仓库根目录就是 Skill 本体：

- `SKILL.md`：触发条件、语法规范、调用方式
- `references/syntax.md`：9 种图的完整文法与示例
- `prompts/master-prompt.md`：可直接投喂给豆包 / DeepSeek / ChatGPT 的提示词
- `scripts/render.mjs`：命令行渲染（Chrome headless → PNG / SVG）
- `renderer/index.html`：单文件渲染器，可离线双击打开
- `examples/`：可运行样例

把整个目录放进你的 skills 目录即可被 Agent 调用；也可以只把 `SKILL.md` 当提示词用。

## 渲染管线

```
需求文本 ──(模型按语法整理)──> 纯文本 ──(render.mjs)──> PNG / SVG
                                    └── renderer/index.html?type=&text=&bare=1
```

`renderer/index.html` 支持 `?bare=1` 无界面模式：只输出图形本身，无按钮、无背景网格，方便截图与嵌入。

## 9 种图的语法

| type | 图种 | 输入要点 |
| --- | --- | --- |
| `module` | 功能模块图 | 缩进层级，最多 4 级 |
| `flow` | 流程图 | `序号-类型-文本`，判断下缩进 `是-序号` |
| `usecase` | 用例图 | `角色：名称` + 缩进用例，`<i>` / `<e>` |
| `architecture` | 系统架构图 | 顶格=层，缩进=模块，再缩进=说明 |
| `sequence` | 时序图 | `A -> B：消息`，`A --> B：返回` |
| `uml` | UML 类图 | `类 名称` + `属性:` / `方法:` + `关系:` |
| `er` | ER 属性图 | MySQL 建表语句 / DBML |
| `globalEr` | 全局 ER 图 | 同上，实体框内列字段 |
| `table` | 数据库三线表 | 同上，每表一张三线表 |

详细规则见 [references/syntax.md](references/syntax.md)。

## 限制

- 需要本机 Chrome / Chromium（无头渲染用）；纯文本生成不需要任何浏览器。
- 三线表为 SVG 绘制，长说明不换行；类图 / 时序图为规则化布局，连线密集时可能有交叉。
- 不包含任何在线 AI 调用，不采集数据。

## License

MIT
