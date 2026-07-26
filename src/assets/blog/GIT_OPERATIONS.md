查看分支（常用）
# 查看本地所有分支
git branch

# 查看远程所有分支
git branch -r

# 查看本地 + 远程所有分支（最常用）
git branch -a

# 查看本地分支与远程分支的关联关系
git branch -vv

# 切换分支
git checkout 分支名
# 或新版
git switch 分支名

# 创建并切换分支
git checkout -b 分支名

# 合并分支（比如把 dev 合并到 main）
git merge 分支名

# 删除本地分支
git branch -d 分支名

# 删除远程分支
git push origin --delete 分支名


## 查看分支（常用）

```bash
# 查看本地所有分支
git branch

# 查看远程所有分支
git branch -r

# 查看本地 + 远程所有分支（最常用）
git branch -a

# 查看本地分支与远程分支的关联关系
git branch -vv

# 切换分支
git checkout 分支名
# 或新版
git switch 分支名

# 创建并切换分支
git checkout -b 分支名

# 合并分支（比如把 dev 合并到 main）
git merge 分支名

# 删除本地分支
git branch -d 分支名

# 删除远程分支
git push origin --delete 分支名
```
## 同步远程代码

```bash
# 克隆远程仓库到本地
git clone 仓库地址

# 拉取远程最新代码（推荐）
git pull

# 拉取但不自动合并
git fetch
```


## 代码提交与推送

```bash
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

## 配置相关（git config）

```bash
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

## 远程仓库相关（git remote）
```bash
# 查看远程仓库
git remote -v

# 关联远程仓库
git remote add origin 仓库地址

# 修改远程仓库地址（改名后必用）
git remote set-url origin 新仓库地址

# 删除远程关联
git remote remove origin
```

## 分支操作

```bash
# 切换分支
git checkout 分支名

# 创建并切换到新分支
git checkout -b 新分支名

# 合并分支（例：dev 合并到 main）
git checkout main
git merge dev
```


