- [一、查看分支（常用）](#一查看分支常用)
- [二、代码提交与推送](#二代码提交与推送)
- [三、版本发布（打 Tag + 描述）](#三版本发布打-tag--描述)
  - [1. 创建带功能描述的版本 Tag](#1-创建带功能描述的版本-tag)
  - [2. 推送 Tag 到 GitHub](#2-推送-tag-到-github)
  - [3. 常用 Tag 管理](#3-常用-tag-管理)
- [四、分支切换与创建](#四分支切换与创建)
- [五、同步远程代码](#五同步远程代码)
- [六、项目发版标准流程（完整版）](#六项目发版标准流程完整版)
- [七、GitHub SSH 密钥配置（解决 HTTPS 推送超时）](#七github-ssh-密钥配置解决-https-推送超时)
  - [1. 生成 SSH 密钥](#1-生成-ssh-密钥)
  - [2. 复制公钥](#2-复制公钥)
  - [3. GitHub 添加公钥](#3-github-添加公钥)
  - [4. 测试 SSH 连接](#4-测试-ssh-连接)
  - [5. 修改项目远程地址为 SSH](#5-修改项目远程地址为-ssh)
  - [6. 验证推送](#6-验证推送)


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

# 提交代码（填写提交信息）
git commit -m "本次修改说明"

# 推送到远程 main 分支
git push
```

## 三、版本发布（打 Tag + 描述）

### 1. 创建带功能描述的版本 Tag

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

### 3. 常用 Tag 管理

```bash
# 查看所有本地 Tag
git tag

# 查看某个 Tag 的详细信息（含描述）
git show v1.0.0

# 删除本地 Tag
git tag -d v1.0.0

# 删除远程 Tag
git push origin --delete v1.0.0
```

## 四、分支切换与创建

```bash
# 切换到已有分支
git checkout 分支名

# 创建并切换到新分支
git checkout -b 新分支名

# 合并分支（例：将 dev 合并到 main）
git checkout main
git merge dev
```

## 五、同步远程代码

```bash
# 拉取远程最新代码
git pull
```

## 六、项目发版标准流程（完整版）

```bash
# 1. 提交代码
git add .
git commit -m "feat: 完成 v1.0.0 版本开发"
git push

# 2. 创建带描述的版本 Tag
git tag -a v1.0.0 -m "v1.0.0 正式发布
✅ 新增功能
✅ 修复问题
✅ 优化配置"

# 3. 推送版本到 GitHub
git push origin v1.0.0
```

## 七、GitHub SSH 密钥配置（解决 HTTPS 推送超时）

### 1. 生成 SSH 密钥

```bash
# 生成 ed25519 算法密钥（推荐，邮箱替换为自己的 GitHub 主邮箱）
ssh-keygen -t ed25519 -C "896415482@qq.com"
```

> 执行后 3 次提示全部回车，不设置密码

### 2. 复制公钥

```bash
# Windows 自动复制公钥到剪贴板
cat ~/.ssh/id_ed25519.pub | clip
```

### 3. GitHub 添加公钥

1. 登录 GitHub → 头像 → Settings → SSH and GPG keys → New SSH key
2. Title 填「我的笔记本」，Key 粘贴复制的公钥，点击 Add SSH key

### 4. 测试 SSH 连接

```bash
ssh -T git@github.com
```

> 输入 `yes` 确认，出现 `Hi jsoncc! You've successfully authenticated` 即成功

### 5. 修改项目远程地址为 SSH

```bash
# 查看当前远程地址
git remote -v

# 修改为 SSH 地址
git remote set-url origin git@github.com:jsoncc/today-history.git

# 再次查看确认
git remote -v
```

### 6. 验证推送

```bash
git push
```


