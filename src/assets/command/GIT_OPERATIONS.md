

## 一、查看分支（常用）
```bash
# 查看本地所有分支
git branch

# 查看远程所有分支
git branch -r

# 查看本地 + 远程所有分支（最常用）
git branch -a

# 查看本地分支与远程分支的关联关系
git branch -vv
```

## 二、代码提交与推送
```bash
# 暂存所有修改
git add .

# 提交代码
git commit -m "修改说明"

# 推送到远程 main 分支
git push
```

## 三、版本发布（打 Tag + 功能描述）
### 1. 创建带描述的 Tag
```bash
git tag -a v1.0.0 -m "v1.0.0 正式发布
✅ 完成 GitHub Actions 自动化部署
✅ 修复页面空白 404 问题
✅ 实现 Markdown 文章展示
✅ 配置 Vite 正确打包路径"
```

### 2. 推送 Tag 到 GitHub
```bash
git push origin v1.0.0
```

### 3. Tag 管理
```bash
# 查看所有本地 Tag
git tag

# 查看 Tag 详情（含描述）
git show v1.0.0

# 删除本地 Tag
git tag -d v1.0.0

# 删除远程 Tag
git push origin --delete v1.0.0
```

## 四、分支操作
```bash
# 切换分支
git checkout 分支名

# 创建并切换到新分支
git checkout -b 新分支名

# 合并分支（例：dev 合并到 main）
git checkout main
git merge dev
```

## 五、同步远程代码
```bash
# 拉取远程最新代码
git pull
```

## 六、标准发版流程（完整版）
```bash
# 1. 提交代码
git add .
git commit -m "feat: 发布 v1.0.0 版本"
git push

# 2. 创建带描述的版本 Tag
git tag -a v1.0.0 -m "v1.0.0 正式发布
✅ 新增功能
✅ 修复问题
✅ 优化配置"

# 3. 推送 Tag
git push origin v1.0.0
```


---


