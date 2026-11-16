---
name: diagram-studio
description: 把中文项目描述转成 9 种工程图（功能模块图、流程图、用例图、系统架构图、时序图、UML 类图、ER 属性图、全局 ER 图、数据库三线表）。适用于课程设计/毕业设计出图：给出角色与功能，产出可直接渲染的纯文本格式，并可离线或在线渲染、导出 SVG/PNG。触发词：功能模块图、系统架构图、用例图、时序图、类图、ER 图、三线表、毕设画图、画系统图。
version: 1.0.0
license: MIT
entry: renderer/index.html
---

# 图构 DiagramCraft（Skill）

把「项目描述」变成「可直接出图的纯文本」，再渲染成矢量图。整个 Skill 不联网、不需要 API Key、不依赖三方库。

线上介绍页：https://bishe.shawu.chat/ ；编辑器：https://bishe.shawu.chat/editor.html

## 什么时候用

- 用户说「帮我画功能模块图 / 系统架构图 / 用例图 / 时序图 / 类图 / ER 图 / 三线表」
- 用户给了课程设计、毕业设计的题目和功能列表，需要出图
- 用户已有 MySQL 建表语句，想要 ER 图或数据库表结构三线表

## 三种使用方式

### 方式 1：只生成文本（任何大模型都能用）

把 [prompts/master-prompt.md](prompts/master-prompt.md) 整段作为系统提示词（或直接发给豆包 / DeepSeek / ChatGPT / Workbench），后面附上用户的项目情况。
模型应当**只输出纯文本**，格式严格按 [references/syntax.md](references/syntax.md)。

### 方式 2：在线渲染（最快）

把生成的文本做 URL 编码，拼到渲染器地址后面：

```
https://bishe.shawu.chat/editor.html?type=flow&text=<URL 编码后的文本>
```

`type` 取值：`module` `flow` `usecase` `architecture` `sequence` `uml` `er` `globalEr` `table`

（首页 `https://bishe.shawu.chat/?type=...` 会自动跳转到编辑器，老链接可直接沿用。）

也可以直接打开页面，把文本粘进左侧输入框，点「生成图表」，再导出 PNG / SVG。渲染器是单文件 HTML，可离线双击打开。

### 方式 3：命令行直接出图（给 Agent / CI 用）

`scripts/render.mjs` 调本机 Chrome 的无头模式渲染，输入文本直接产出 PNG / SVG，零 npm 依赖：

```bash
# 出 PNG（默认 2 倍图）
node scripts/render.mjs --type flow --file examples/flow.txt --out flow.png

# 出 SVG（矢量）
node scripts/render.mjs --type uml --file examples/uml.txt --out uml.svg

# 直接给文本
node scripts/render.mjs --type module --text "图书管理系统
  读者端
    图书查询" --out module.png
```

成功时输出 JSON：`{ ok, type, width, height, file, bytes, format }`。
Chrome 找不到时用 `CHROME_PATH=/path/to/chrome` 指定；PNG 分辨率用 `--scale 3` 调整。

完整链路就是：**用户说需求 → 模型按语法产出文本 → 运行上面的命令 → 得到图片文件**。

### 方式 4：本地 / 内嵌

`renderer/index.html` 是完整渲染器（单文件、无依赖），可直接双击打开，也可放进 iframe：

```html
<iframe src="renderer/index.html?type=uml&text=%E7%B1%BB%20%E5%AD%A6%E7%94%9F..."
        width="100%" height="640" style="border:0"></iframe>
```

## 支持图种与输入语法（速查）

| type | 图种 | 输入语法要点 |
| --- | --- | --- |
| `module` | 功能模块图 | 缩进层级，第 1 行系统名，最多 4 级 |
| `flow` | 流程图 | `序号-类型-文本`，类型：开始/结束/处理/判断/输入/输出/异常；判断下缩进 `是-序号` |
| `usecase` | 用例图 | `角色：名称` + 缩进用例；`<i>` 包含、`<e>` 扩展 |
| `architecture` | 系统架构图 | 顶格=层级，缩进=模块，再缩进=说明 |
| `sequence` | 时序图 | 先列参与者，`A -> B：消息`，`A --> B：返回` |
| `uml` | UML 类图 | `类 名称` + `属性:` / `方法:` + `关系:` |
| `er` | ER 属性图 | MySQL 建表语句或 DBML（Chen 记法：矩形/椭圆/菱形） |
| `globalEr` | 全局 ER 图 | 同上，实体框内列字段，外键标 1/N |
| `table` | 数据库三线表 | 同上，每张表排成一张三线表 |

完整规则与可运行示例见 [references/syntax.md](references/syntax.md) 和 `examples/`。

## 输出约定（给模型）

1. 只输出纯文本，不要 Markdown 代码块、不要解释。
2. 缩进只用空格，不用 Tab。
3. 名称简短（2~8 个汉字），与用户项目一致。
4. 若用户没指定图种，默认 `module`；给了建表语句则用 `er` 或 `table`。

## 渲染与导出

- 浏览器打开渲染器 → 「导出」→ PNG（2 倍高清）/ SVG（矢量）/ **Word（.doc，A4 版心，图片已嵌入）**。
- 写进论文：点画布右上角「复制图片」，到 Word / WPS 里 `Ctrl/Cmd + V` 直接粘贴；或用「导出 Word」得到带图题的 A4 文档，另存为 .docx 即可。
- draw.io 源文件仅功能模块图支持。
- 数据只存在浏览器 localStorage，不上传。

## Hugging Face Space

`hf-space/` 是可直接推送的 Static Space 模板：根目录放渲染器 `index.html` 与 `README.md`（含 `sdk: static` 元信息）。部署后同样支持 `?type=&text=` 深链，可在任何网页 iframe 中调用。

## 限制

- 三线表是 SVG 绘制，长说明不换行，列宽按内容估算。
- 类图/时序图为规则化自动布局，连线密集时可能有少量交叉。
- 不做 AI 生成，不调用任何在线接口；提示词只是给外部模型用。
