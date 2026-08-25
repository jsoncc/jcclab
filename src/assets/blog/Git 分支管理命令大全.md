---
title: Git 分支管理命令大全
tags:
  - Git
  - 分支
---

# Git 分支管理命令大全

## 查看分支

```
# 查看本地所有分支
git branch

# 查看远程所有分支
git branch -r

# 查看本地 + 远程所有分支（最常用）
git branch -a

# 查看本地分支与远程分支的关联关系
git branch -vv
```

## 切换分支

```
# 切换分支
git checkout 分支名

# 或新版命令
git switch 分支名

# 创建并切换分支
git checkout -b 分支名
```

## 合并与删除分支

```
# 合并分支（比如把 dev 合并到 main）
git merge 分支名

# 删除本地分支
git branch -d 分支名

# 删除远程分支
git push origin --delete 分支名
```
