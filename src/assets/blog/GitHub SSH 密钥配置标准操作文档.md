# 📄 GitHub SSH 密钥配置标准操作文档
解决 HTTPS 推送超时问题，实现免密、稳定的 Git 操作

---

## 一、前置说明
### 1. 为什么要配置 SSH 密钥
- **解决网络问题**：彻底告别 HTTPS 代理、防火墙、超时导致的 `git push` 失败
- **免密操作**：一次配置，永久生效，无需每次输入账号密码
- **更安全稳定**：SSH 协议比 HTTPS 更适合 Git 远程操作，不受网络环境影响

### 2. 适用环境
- Windows 系统（PowerShell / CMD / Trae 终端）
- GitHub 个人账号
- 已创建的 Git 项目（如 `today-history`）

---

## 二、详细操作步骤（全程复制粘贴）
### 步骤 1：打开终端
进入你的项目目录 `D:\Projects\today-history`，右键选择「在终端中打开」，或直接打开 PowerShell。

---

### 步骤 2：生成 SSH 密钥
执行以下命令，**将邮箱替换为你 GitHub 账号下已验证的邮箱**（推荐主邮箱 `896415482@qq.com`，也可使用 `13233768245@163.com`）：
```bash
# 生成 ed25519 算法的 SSH 密钥（推荐，安全性更高）
ssh-keygen -t ed25519 -C "13233768245@163.com"
```

执行后会出现 3 次提示，**全部直接按回车**，无需输入任何内容：
1.  `Enter file in which to save the key`：回车，使用默认保存路径
2.  `Enter passphrase`：回车，不设置密码（免密操作）
3.  `Enter same passphrase again`：回车，确认不设置密码

执行成功后，会输出类似如下内容，代表密钥生成完成：
```
Your identification has been saved in C:\Users\你的用户名/.ssh/id_ed25519
Your public key has been saved in C:\Users\你的用户名/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx 13233768245@163.com
```

> 若系统不支持 ed25519，可使用 RSA 算法替代：
> ```bash
> ssh-keygen -t rsa -b 4096 -C "13233768245@163.com"
> ```

---

### 步骤 3：复制公钥
Windows 系统直接执行以下命令，**自动复制公钥到剪贴板**：
```bash
cat ~/.ssh/id_ed25519.pub | clip
```

> 若命令报错，可手动操作：
> 1.  打开文件夹 `C:\Users\你的用户名\.ssh\`
> 2.  用记事本打开 `id_ed25519.pub` 文件
> 3.  全选内容，手动复制

---

### 步骤 4：在 GitHub 中添加公钥
1.  登录 GitHub 账号，点击右上角头像 → **Settings**
2.  在左侧菜单 `Access` 分类下，点击 **SSH and GPG keys**
3.  点击绿色按钮 **New SSH key**
4.  填写信息：
    - **Title**：自定义名称，如 `我的 Windows 笔记本`（用于标识密钥来源）
    - **Key type**：保持默认 `Authentication key`
    - **Key**：粘贴刚才复制的公钥内容
5.  点击 **Add SSH key**，完成添加（可能需要输入 GitHub 账号密码验证）

---

### 步骤 5：测试 SSH 连接
回到终端，执行以下命令，测试与 GitHub 的连通性：
```bash
ssh -T git@github.com
```

执行后会出现提示：
```
The authenticity of host 'github.com (IP地址)' can't be established.
ED25519 key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.
This key is not known by any other names
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```
输入 `yes` 回车，确认连接。

出现以下内容，代表 SSH 配置成功：
```
Hi jsoncc! You've successfully authenticated, but GitHub does not provide shell access.
```

---

### 步骤 6：修改项目远程地址为 SSH
在你的项目目录下，执行以下命令，将 HTTPS 地址替换为 SSH 地址：
```bash
# 查看当前远程地址（确认是 HTTPS）
git remote -v

# 修改为 SSH 地址（直接复制，无需修改）
git remote set-url origin git@github.com:jsoncc/today-history.git

# 再次查看，确认已改为 SSH
git remote -v
```

执行成功后，输出如下：
```
origin  git@github.com:jsoncc/today-history.git (fetch)
origin  git@github.com:jsoncc/today-history.git (push)
```

---

### 步骤 7：验证推送（可选）
执行 `git push`，测试是否可以正常推送：
```bash
git push
```
若无需输入密码、直接推送成功，代表配置完全生效。

---

## 三、常见问题与解决方案
### 1. 生成密钥时提示「ssh-keygen 不是内部命令」
- 原因：系统未安装 Git 或 Git 未加入环境变量
- 解决：重新安装 Git，安装时勾选「Add Git to PATH」，重启终端后重试

### 2. 测试连接时提示「Permission denied」
- 原因：公钥未正确添加到 GitHub，或密钥文件权限错误
- 解决：
  1.  重新复制公钥，确保完整粘贴到 GitHub
  2.  检查 `C:\Users\你的用户名\.ssh\` 文件夹权限，确保当前用户可读写
  3.  重新生成密钥，重复配置流程

### 3. 推送时提示「fatal: Could not read from remote repository」
- 原因：远程地址未正确修改为 SSH
- 解决：重新执行 `git remote set-url origin git@github.com:jsoncc/today-history.git`，确认地址正确

### 4. 忘记密钥密码（若设置了密码）
- 解决：重新生成无密码的密钥，重复配置流程（推荐不设置密码，方便日常操作）

---

## 四、常用 SSH 相关命令
```bash
# 查看本地 SSH 密钥列表
ls ~/.ssh

# 重新复制公钥
cat ~/.ssh/id_ed25519.pub | clip

# 测试 GitHub 连接
ssh -T git@github.com

# 查看项目远程地址
git remote -v

# 修改远程地址为 SSH
git remote set-url origin git@github.com:jsoncc/today-history.git

# 删除本地 SSH 密钥（如需重新配置）
rm ~/.ssh/id_ed25519 ~/.ssh/id_ed25519.pub
```

