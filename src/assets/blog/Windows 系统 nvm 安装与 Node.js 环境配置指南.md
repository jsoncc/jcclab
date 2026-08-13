> 适用场景：Windows 10 / Windows 11 | nvm-windows | Node.js ≥ 18.0.0（推荐 LTS）

---

## 📦 一、安装 nvm

### 1.1 下载 nvm-windows

1. 访问官方 Releases 页面：  
   [https://github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases)

2. 下载最新版本的 `nvm-setup.exe` 安装程序。

### 1.2 安装 nvm

1. **以管理员身份运行** `nvm-setup.exe`

2. 按安装向导提示操作，**建议修改安装路径**（避免默认的 `C:\Program Files` 可能带来的权限问题）：
   - 例如安装到：`E:\Software\nvm`

3. 安装程序会自动配置以下环境变量：
   - `NVM_HOME`：指向 nvm 安装目录
   - `NVM_SYMLINK`：指向 `nodejs` 软链接目录（如 `E:\Software\nodejs`）

4. 安装完成后，打开 **新的** 命令提示符（CMD），验证安装：
   ```cmd
   nvm version
   ```
   正常输出版本号即表示安装成功。

---

## 🚀 二、安装 Node.js

### 2.1 安装指定版本（如最新 LTS）

```cmd
nvm install --lts
```

该命令会自动下载并安装最新的 LTS（长期支持）版本，例如 `v20.x.x` 或 `v22.x.x`。

### 2.2 安装特定版本（如 Node.js 18）

```cmd
nvm install 18.0.0
```
#### [node版本查看地址](https://nodejs.org/en/download)

![](./images/blog/nvm-install-guide/Pasted-image-20260719225111.png)
### 2.3 查看已安装的版本列表

```cmd
nvm list
```

输出示例：
```
  * 22.14.0 (Currently using 64-bit executable)
    20.18.0
    18.0.0
```

---

## 🔄 三、切换与使用 Node 版本

### 3.1 切换到指定版本

```cmd
nvm use 22.14.0
```

### 3.2 设置默认版本（每次打开终端自动生效）

```cmd
nvm alias default 22.14.0
```

### 3.3 验证 Node 和 npm 是否可用

```cmd
node -v
npm -v
```

正常输出示例：
```
v22.14.0
10.9.0
```
![](./images/blog/nvm-install-guide/Pasted-image-20260719225333.png)
---

## 🔧 四、重装系统后的环境恢复

> 适用场景：重装 Windows 系统后，nvm 程序文件还在（如 D 盘或 E 盘），但系统环境变量被清空。

### 4.1 配置环境变量

1. 按 `Win + R`，输入 `sysdm.cpl`，回车

2. 切换到 **“高级”** 选项卡 → 点击 **“环境变量”**

3. 在 **“系统变量”** 区域，添加或确认以下变量：

   | 变量名 | 变量值（示例） |
   |--------|---------------|
   | `NVM_HOME` | `E:\Software\nvm` |
   | `NVM_SYMLINK` | `E:\Software\nodejs` |

4. 在 **“系统变量”** 中找到 `Path` 变量，双击编辑，添加以下两条路径：
   - `E:\Software\nvm`
   - `E:\Software\nodejs`

5. 点击 **“确定”** 保存所有设置。

### 4.2 检查配置文件

打开 `E:\Software\nvm\settings.txt`，确认内容格式正确：

```
root: E:\Software\nvm
path: E:\Software\nodejs
```

### 4.3 重新激活 Node 版本

打开 **新的** 命令提示符（CMD），执行：

```cmd
nvm use 24.14.0
```

或者直接验证：

```cmd
node -v
npm -v
```

如果能正常输出版本号，说明环境已恢复。

### 4.4（可选）重建软链接

如果 `E:\Software\nodejs` 目录不存在或链接失效，可以手动重建（需管理员权限）：

```cmd
cd /d E:\Software\nvm
rmdir nodejs          # 如果已存在则先删除
mklink /D nodejs v24.14.0
```

---

## 🛠️ 五、常见问题与解决方案

### 5.1 `npm` 在 VS Code 中报错 `UnauthorizedAccess`

**现象**：在 VS Code 的终端（PowerShell）中执行 `npm -v` 报错：
> 无法加载文件 E:\Software\nodejs\npm.js，因为在此系统上禁止运行脚本。

**解决方案**：以管理员身份打开 PowerShell，执行：

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

输入 `Y` 确认后，重启 VS Code 即可。

![](./images/blog/nvm-install-guide/Pasted-image-20260719225610.png)
![](./images/blog/nvm-install-guide/Pasted-image-20260719225722.png)

> 💡 **原理**：PowerShell 默认禁止运行未签名的脚本，`RemoteSigned` 策略允许运行本地脚本，是从网络下载的脚本才需要签名，兼顾安全与便利。

### 5.2 `node` 或 `npm` 提示“不是内部或外部命令”

**原因**：环境变量未正确配置。

**解决方案**：
1. 检查 `NVM_HOME` 和 `NVM_SYMLINK` 是否配置正确
2. 检查 `Path` 变量中是否包含上述两个路径
3. **重启终端**后再试（环境变量修改后需要重新打开终端才能生效）

### 5.3 `nvm use` 提示“版本不存在”

```cmd
nvm use 20.18.0
# 提示：Node v20.18.0 is not installed.
```

**解决方案**：先安装该版本：

```cmd
nvm install 20.18.0
nvm use 20.18.0
```

### 5.4 如何卸载某个 Node 版本

```cmd
nvm uninstall 18.0.0
```

---

## 📋 六、常用 nvm 命令速查表

| 命令 | 说明 |
|------|------|
| `nvm version` | 查看 nvm 自身版本 |
| `nvm list` | 列出所有已安装的 Node 版本 |
| `nvm install <version>` | 安装指定版本，如 `18.0.0` |
| `nvm install --lts` | 安装最新的 LTS 版本 |
| `nvm use <version>` | 切换到指定版本 |
| `nvm alias default <version>` | 设置默认使用的版本 |
| `nvm uninstall <version>` | 卸载指定版本 |
| `nvm current` | 查看当前正在使用的版本 |

---

## 📌 七、版本要求说明

- **Node.js ≥ 18.0.0**：满足现代前端工程化工具（如 Vite、Next.js 等）的最低要求
- **推荐使用 LTS 版本**：如 v20.x 或 v22.x，稳定性更好，适合生产项目

---

## 🎯 八、总结

| 场景 | 操作 |
|------|------|
| 首次安装 | 下载 `nvm-setup.exe` → 安装 → `nvm install --lts` |
| 切换版本 | `nvm use <version>` |
| 设置默认 | `nvm alias default <version>` |
| 重装系统恢复 | 配置环境变量 → `nvm use` 激活 → 验证 |
| VS Code 报错 | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |

---

有任何问题欢迎随时交流～ 🚀