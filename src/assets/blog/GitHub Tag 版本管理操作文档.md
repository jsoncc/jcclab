# GitHub Tag 版本管理操作文档
适用于：项目版本标记、发布记录、版本迭代管理

---

## 一、概念说明
- **Tag（标签）**：给代码提交打一个“版本标记”，方便回溯、发布、管理迭代。
- **Release**：带介绍说明的正式版本（GitHub 展示用）。
- **常用版本号规范**：
  - `v1.0.0`：正式初版
  - `v1.0.1`：小修复、图片/文案优化
  - `v1.1.0`：新增功能、结构优化
  - `v2.0.0`：大版本重构

---

## 二、操作流程总览（最清晰）
```
本地代码提交 → 打 Tag → 推送到 GitHub → 创建 Release 写介绍
```

---

# 三、第一次创建 Tag（v1.0.0 初始化）
## 1. 确保代码已提交
```bash
git add .
git commit -m "项目初始化完成"
git push origin main
```

## 2. 创建第一个版本 Tag
```bash
# 创建 v1.0.0（轻量级标签）
git tag v1.0.0

# 或 创建带备注的标签（推荐正式版使用）
git tag -a v1.0.0 -m "正式发布 v1.0.0 初版"
```

## 3. 将 Tag 推送到 GitHub
```bash
git push origin v1.0.0
```

## 4. 查看本地所有标签
```bash
git tag
```

---

# 四、升级版本 → 新增 Tag（从 v1.0.0 → v1.1.0）
## 1. 同步最新代码
```bash
git checkout main
git pull origin main
```

## 2. 提交本次升级的代码
```bash
git add .
git commit -m "v1.1.0 图片结构优化+文档完善"
git push origin main
```

## 3. 创建新版本 Tag
```bash
git tag v1.1.0

# 带备注（推荐）
git tag -a v1.1.0 -m "v1.1.0 优化图片目录、修复路径问题、新增OSS方案"

git tag -a v1.0.0 -m "v1.0.0 正式发布
✅ 新增功能
✅ 修复问题
✅ 优化配置"
```

## 4. 推送到 GitHub
```bash
git push origin v1.1.0
```

---

# 五、GitHub 上给 Tag 添加版本介绍（Release）
## 操作步骤
1. 进入仓库 → 点击 **Releases**
2. 点击 **Tags** → 找到对应版本（如 v1.1.0）
3. 点击 **Create release from tag**
4. 填写信息：

### 表单填写示例
```
## v1.1.0 更新日志

### ✨ 核心优化
- 优化界面UI
- 重构博客图片目录结构，统一管理文章图片，提升项目可维护性
- 修复 GitHub Pages 部署后图片路径 404 问题，确保图片正常加载

### 📝 文档完善
- 优化 README.md 项目文档，补充技术栈、部署流程、环境配置说明
- 新增 Git 操作、SSH 密钥配置、百度翻译部署等技术文档

### 🐛 问题修复
- 修复中文/空格路径导致的图片加载异常
- 优化项目打包配置，提升部署稳定性
```

5. 点击 **Publish release** 完成
   
![GitHub增加tag](./images/blog/git-version-management-operation-document/image.png)

---

# 六、常用 Tag 命令速查表
| 功能 | 命令 |
|------|------|
| 查看所有标签 | `git tag` |
| 创建标签 | `git tag v1.0.0` |
| 创建带备注标签 | `git tag -a v1.0.0 -m "备注"` |
| 推送单个标签 | `git push origin v1.0.0` |
| 推送所有标签 | `git push origin --tags` |
| 删除本地标签 | `git tag -d v1.0.0` |
| 删除远程标签 | `git push origin --delete v1.0.0` |
| 查看标签详情 | `git show v1.0.0` |

---

# 七、你的项目真实使用流程（直接照抄）
## 第一次发版（v1.0.0）
```bash
git add .
git commit -m "项目完成"
git push origin main
git tag v1.0.0
git push origin v1.0.0
```

## 升级发版（v1.1.0）
```bash
git pull
git add .
git commit -m "v1.1.0 优化图片目录"
git push origin main
git tag v1.1.0
git push origin v1.1.0
```
