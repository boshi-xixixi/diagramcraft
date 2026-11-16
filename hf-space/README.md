---
title: DiagramCraft 图构
emoji: 📐
colorFrom: blue
colorTo: indigo
sdk: static
pinned: false
license: mit
short_description: 中文文本一键生成 9 种毕业设计图
---

# 图构 DiagramCraft

面向毕业设计的文本驱动图表生成系统：把中文项目描述转成 9 种工程图 —— 功能模块图、流程图、用例图、系统架构图、时序图、UML 类图、ER 属性图、全局 ER 图、数据库三线表。

单文件、纯前端、离线可用，不需要 API Key，不收集数据。

## 两个页面

- `index.html`：介绍页（功能、图种、流程、FAQ）
- `editor.html`：编辑器，实际作图与导出

## 在线用

打开首页 → 「打开编辑器」→ 左侧粘贴文本 → 点「生成图表」→ 画布右上「复制图片」贴进 Word，或「导出」PNG / SVG / Word。

## 深链调用（可 iframe）

```
https://<你的空间地址>/editor.html?type=flow&text=<URL 编码后的文本>
```

`type` 取值：`module` `flow` `usecase` `architecture` `sequence` `uml` `er` `globalEr` `table`

首页也兼容 `/?type=...`，会自动跳转到编辑器。

## 让 AI 生成文本

见 `prompts/master-prompt.md`：整段复制给任意大模型，附上你的项目情况，把返回的纯文本粘回编辑器即可。

## 说明

- 本 Space 使用 `sdk: static`，只有两个 HTML 文件，无构建步骤。
- 若要在自己服务器部署，把这两个文件丢到任意静态目录即可。
