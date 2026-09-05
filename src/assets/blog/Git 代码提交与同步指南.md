---
title: Git 代码提交与同步指南
category: code-collaboration
tags:
  - Git
  - 基础
---

# Git 代码提交与同步指南

## 同步远程代码

```
# 克隆远程仓库到本地
git clone 仓库地址

# 拉取远程最新代码（推荐）
git pull

# 拉取但不自动合并
git fetch
```

## 代码提交与推送

```
# 查看文件状态
git status

# 暂存所有修改
git add .

# 添加单个文件
git add 文件名

# 提交代码
git commit -m "修改说明"

# 推送到远程 main 分支
git push
```
