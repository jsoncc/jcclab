✦ JsonCC Lab

# PDF 转图片*·*工具诞生记

从 idea 到落地：在「工具集合」中新增一个文件格式转换工具，完整记录设计与实现过程。

🕒 2026.05 ⊘ Vue 3 + pdf.js ◆ 5 次迭代

Overview

## 为「工具集合」注入格式转换能力

项目已有 JSON 校验、UUID 生成、Base64 编解码等工具，但缺少文件格式转换能力。新增 PDF 转图片工具，让用户可以在浏览器端直接将 PDF 渲染为 PNG / JPEG，无需上传任何服务器。

🎯

### 双模式输出

逐页输出或竖向拼接为长图

🧩

### 灵活选页

支持自定义页码范围，如 1,3,5-8

📦

### ZIP 打包

多页一键打包下载

⚡

### 纯前端

pdf.js 渲染，文件不上传

Process

## 开发历程

1

STEP 01

#### 需求确认

确定技术方案：浏览器端使用 pdfjs-dist 渲染 PDF 每页到 Canvas，导出为 PNG/JPEG。批量下载使用 JSZip 打包。

2

STEP 02

#### 组件注册

创建 PdfToImage.vue，遵循既有组件风格（状态管理、状态提示、复制/下载工具函数模式）。在 App.vue 中完成 6 处集成：类型声明、导入、菜单项、条件渲染、标题映射、搜索条目。

// 类型声明加一项
type ActiveToolKey = 'formatCheck' | 'uuid' | 'pdfToImage'

3

STEP 03

#### Bug 修复：响应式陷阱

pdfDoc 是非响应式普通变量，computed 检测不到变化，导致按钮始终 disabled。新增响应式 pdfReady 标记解决。

const pdfReady = ref(false)
// computed 改用 pdfReady.value 判断

4

STEP 04

#### 交互打磨

根据反馈持续优化：分辨率改为「常规的 / 高清（4倍）」简化选择；输出格式、分辨率、页码增加说明文字；新增「输出模式」支持长图拼接。

5

STEP 05

#### 知识积淀

将完整的开发历程与设计决策整理成文，沉淀为团队知识资产。

Architecture

## 技术架构

├─ src/
│ ├─ components/
│ │ └─ PdfToImage.vue ← 核心组件
│ └─ App.vue ← 6 处集成点
├─ package.json
│ ├─ pdfjs-dist@4.9.155 ← PDF 渲染引擎
│ └─ jszip@3.10.1 ← ZIP 打包

核心流程：File → ArrayBuffer → pdf.js getDocument → 逐页 getPage → render to Canvas → toBlob → 预览 / 下载。全过程在浏览器内完成，零服务端依赖。

Features

## 功能一览

最终交付的工具包含以下能力：

-   → 拖拽 / 点击选取 PDF，自动识别文件
-   → PNG / JPEG 可选，JPEG 支持质量调节
-   → 常规 / 高清两种清晰度
-   → 全部或自定义页码范围
-   → 逐页输出（网格预览 + 单页下载 + ZIP）
-   → 长图模式（竖向拼接为一张长图片）
-   → 实时进度条、状态提示

JsonCC Lab · 2026
