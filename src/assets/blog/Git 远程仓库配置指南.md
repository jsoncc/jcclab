---
title: Git 远程仓库配置指南
tags:
  - Git
  - 远程
  - 配置
---

# Git 远程仓库配置指南

## Git 配置

```
# 查看全局配置
git config --global --list

# 设置用户名（必须）
git config --global user.name "你的名字"

# 设置邮箱（必须）
git config --global user.email "你的邮箱"

# 取消全局配置
git config --global --unset user.name
git config --global --unset user.email
```

## 远程仓库管理

```
# 查看远程仓库
git remote -v

# 关联远程仓库
git remote add origin 仓库地址

# 修改远程仓库地址（改名后必用）
git remote set-url origin 新仓库地址

# 删除远程关联
git remote remove origin
```
