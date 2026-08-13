# Windows 10 专业版开发环境安装指引（AI 可执行版）

> 适用场景：全新安装的 Windows 10 专业版（C 盘已清理）
> 执行方式：**以管理员身份运行 PowerShell**，逐节执行命令，每节末尾验证
> 目标环境：nvm + Node.js（v24 LTS 与 v14 双版本）| Git | JDK 1.8 | Python
> **统一安装目录：`D:\Program Files`（所有可自定义位置的软件都装这里）**
> **核心原则：先查复用，再安装——所有磁盘上已存在的内容绝不重复安装**
> 整理日期：2026-08-13
> **本指引中所有 winget 包 ID 已于 2026-08-13 实测确认存在（winget search 验证）**

---

## ⚠️ 执行须知（AI 先读这里）

1. **全程用管理员 PowerShell**：开始菜单搜 "PowerShell" → 右键 → "以管理员身份运行"
2. **每节末尾必须执行"验证"命令**，输出符合预期才继续下一节；验证失败先看本节"排错"
3. winget 是 Windows 10 自带包管理器，若提示找不到，先执行第 0 节
4. 环境变量修改后**必须重开终端**才生效（本指引每节之间默认会重开）
5. 若 winget 提示找不到包 ID，用 `winget search <关键字>` 找新 ID（包 ID 可能随版本变化）
6. **安装后必须验证实际安装位置**：`--location` 参数对部分安装器（Inno Setup 类）可能不生效，软件会装到默认位置——此时按该节"排错"手动移动到 D 盘，**不要**认为安装成功就算完

### 全局复用规则（最重要的原则，每节安装前必读）

**安装任何软件之前，必须先按以下顺序检查。检查到软件已存在时，无论它在哪个目录，最终都必须位于 `D:\Program Files` 下：**

1. **查命令是否已可用**：`Get-Command <命令名> -ErrorAction SilentlyContinue`
   - 有结果 → 查其实际路径：`(Get-Command <命令名>).Source`
   - 路径在 `D:\Program Files\` 下 → 已合规，直接"验证"后进入下一节
   - 路径在其他目录 → **剪切到 `D:\Program Files`**（见下方剪切步骤），再验证
2. **查统一目录**：`Test-Path "D:\Program Files\<软件目录>"` 为 True → 已存在于 D 盘，配置好环境变量后直接使用
3. **查其他常见位置**：`C:\Program Files\`、`C:\Program Files (x86)\`、`D:\Software\`、`E:\Software\` 等 → 找到就**剪切（Move-Item）到 `D:\Program Files`** 再使用
4. **全盘搜索兜底**（很慢，最后才用）：跨所有磁盘搜关键文件，找到就剪切到 `D:\Program Files`
5. **以上都不存在 → 才允许安装**到 `D:\Program Files`

> **剪切步骤（Move-Item 参考）：**
> ```powershell
> # 示例:把 C:\Program Files\Git 剪切到 D 盘
> Move-Item "C:\Program Files\Git" "D:\Program Files\Git" -Force
> ```
> **剪切后必须同步更新 PATH**（旧路径失效会让命令找不到）：
> ```powershell
> # 示例:移除旧路径,加入新路径(以 Git 为例)
> $old = [Environment]::GetEnvironmentVariable("Path","Machine")
> $new = ($old -split ";" | Where-Object { $_ -ne "C:\Program Files\Git\cmd" -and $_ -ne "C:\Program Files\Git\bin" }) -join ";"
> [Environment]::SetEnvironmentVariable("Path", "$new;D:\Program Files\Git\cmd", "Machine")
> ```
> 重开终端后验证命令可用。

> **全盘搜索参考（最后手段，5 分钟无结果就 Ctrl+C 中止，改用已知目录搜索）：**
> ```powershell
> Get-PSDrive -PSProvider FileSystem | ForEach-Object {
>     Get-ChildItem -Path $_.Root -Filter "<关键文件名>" -Recurse -ErrorAction SilentlyContinue -Force | Select-Object -First 5
> }
> ```
> 优先搜已知目录（`C:\Program Files`、`D:\`、`E:\` 根下的软件目录），全盘递归非常慢。

---

## 0️⃣ 准备工作

### 0.1 确认 winget 可用

```powershell
winget --version
```

- 正常输出版本号 → 继续
- 提示"无法识别" → 到微软商店搜索安装"应用安装程序 (App Installer)"，装完重开终端

### 0.2 确认 D 盘与统一目录

```powershell
Test-Path "D:\Program Files"
```

- 返回 `True` → 继续
- 返回 `False` → 创建目录：
  ```powershell
  New-Item -ItemType Directory -Path "D:\Program Files" -Force
  ```

### 0.3 确认网络与系统

```powershell
systeminfo | Select-String "OS Name|系统型号"
```

确认是 Windows 10 专业版即可。

---

## 1️⃣ nvm + Node.js（v24 LTS 与 v14 双版本）

### 1.0 安装前检查（复用优先）

```powershell
# ① nvm 命令是否已可用,以及它实际在哪个目录
Get-Command nvm -ErrorAction SilentlyContinue | Select-Object Source
# ② D 盘统一目录是否存在
Test-Path "D:\Program Files\nvm"
# ③ 其他常见位置(注意:官方默认装到 %LocalAppData%\nvm,即 AppData\Local\nvm)
Test-Path "$env:LOCALAPPDATA\nvm"; Test-Path "C:\Program Files\nvm"; Test-Path "D:\Software\nvm"
```

分支处理：
- **① 有结果且 Source 在 `D:\Program Files\nvm`** → 已合规，`nvm list` 查看已有版本，跳到 1.4
- **① 有结果但 Source 在别处** → 剪切到 D 盘（见全局规则），并确认 NVM_HOME/NVM_SYMLINK 指向 D 盘（见 1.1 排错），**不要重新安装**
- **② 或 ③ 存在但 ① 无** → 检查该目录里有没有 nvm.exe：有则配置环境变量后使用（见 1.1 排错）；没有则目录是残留空壳，可忽略
- **①②③ 都无 → 执行 1.1 安装**

### 1.1 安装 nvm-windows（装到 D 盘）

```powershell
winget install --id CoreyButler.NVMforWindows --location "D:\Program Files\nvm"
```

> **包 ID 是 `CoreyButler.NVMforWindows`**（不是 coreybutler.nvm，那个 ID 不存在）。
> nvm-windows 是 Windows 版 nvm（注意：不是 Linux 的 nvm，命令一样但实现不同）。

**验证：**

```powershell
nvm version
```

正常输出 `1.2.2` 或 `1.x.x`。

**排错（关键）：** 提示 `nvm 不是内部或外部命令`，或确认安装位置不在 D 盘时，手动配置（把 nvm 指向 D 盘）：

```powershell
# ① 找到 nvm 实际装到哪了(官方默认位置是 %LocalAppData%\nvm)
Test-Path "$env:LOCALAPPDATA\nvm"
# ② 若在默认位置,把整个 nvm 文件夹移动到 D 盘
Move-Item "$env:LOCALAPPDATA\nvm" "D:\Program Files\nvm" -Force
# ③ 设置环境变量指向 D 盘
[Environment]::SetEnvironmentVariable("NVM_HOME", "D:\Program Files\nvm", "Machine")
[Environment]::SetEnvironmentVariable("NVM_SYMLINK", "D:\Program Files\nodejs", "Machine")
```

再检查 `D:\Program Files\nvm\settings.txt`，确认内容为：

```
root: D:\Program Files\nvm
path: D:\Program Files\nodejs
```

改完**重开终端**再验证 `nvm version`。

### 1.2 安装 Node v24 LTS（长期支持版）

```powershell
nvm list
nvm install 24
nvm use 24
nvm alias default 24
```

> 先 `nvm list`：若 v24 已存在则只执行 `nvm use 24` 和 `nvm alias default 24`，**不要重复下载**。
> `nvm install 24` 会自动装最新的 v24.x LTS；`alias default` 让每次新终端默认用 v24。
> Node 本体和软链接会装在 `D:\Program Files\nvm` 和 `D:\Program Files\nodejs` 下。

**验证：**

```powershell
node -v
npm -v
```

- `node -v` 输出 `v24.x.x`
- `npm -v` 输出 `10.x.x` 或更高

### 1.3 安装 Node v14（旧项目兼容版）

```powershell
nvm list
nvm install 14
```

**注意：** 先 `nvm list` 确认 v14 已存在则跳过安装。

**验证（不切换，只确认已装上）：**

```powershell
nvm list
```

输出应同时包含 `24.x.x` 和 `14.21.3`（v14 最终版），且 `*` 标在当前使用的 v24 上。

**排错：** `nvm install 14` 下载慢或失败 → 是网络问题，可重试；或临时切换镜像：
```powershell
nvm node_mirror https://npmmirror.com/mirrors/node/
nvm npm_mirror https://npmmirror.com/mirrors/npm/
```

### 1.4 切换版本（日常用法，写进文档供参考）

```powershell
nvm use 24    # 切到 v24
nvm use 14    # 切到 v14
nvm current   # 查看当前版本
```

**排错：** VS Code 终端里 `npm` 报"禁止运行脚本"（PowerShell 执行策略）：
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```
输入 `Y` 确认，重启 VS Code。

---

## 2️⃣ 安装 Git（装到 D 盘）

### 2.0 安装前检查（复用优先）

```powershell
# ① git 命令是否已可用,以及它实际在哪个目录
Get-Command git -ErrorAction SilentlyContinue | Select-Object Source
# ② D 盘统一目录是否存在
Test-Path "D:\Program Files\Git"
# ③ 其他常见位置
Test-Path "C:\Program Files\Git"; Test-Path "D:\Software\Git"; Test-Path "E:\Software\Git"
```

分支处理：
- **① 有结果且 Source 在 `D:\Program Files\Git`** → 已合规，直接验证（2.2）
- **① 有结果但 Source 在别处** → 剪切到 `D:\Program Files\Git` + 更新 PATH（见全局规则剪切步骤），不要重新安装
- **② 或 ③ 存在但 ① 无** → 剪切到 `D:\Program Files\Git` + 把 `D:\Program Files\Git\cmd` 加入 PATH
- **都没有 → 执行 2.1**

### 2.1 安装

```powershell
winget install --id Git.Git --location "D:\Program Files\Git"
```

### 2.2 验证

```powershell
git --version
```

正常输出 `git version 2.x.x.windows.x`。

### 2.3 基本配置（可选，**可跳过**，不影响安装）

```powershell
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

> **说明：** 这两条**不是必须的**。clone、pull、push 都不需要；只有将来第一次 `git commit` 时 git 会要求提供身份，到时再设置即可（会提示 "Please tell me who you are"）。
> AI 执行时若不知道用户的姓名邮箱，**直接跳过本节**，不影响安装成功。

---

## 3️⃣ 安装 JDK 1.8（Java 8，装到 D 盘）

### 3.0 安装前检查（复用优先）

```powershell
# ① java 命令是否已可用(注意:可能装了其他版本,需确认是 1.8)
Get-Command java -ErrorAction SilentlyContinue | Select-Object Source
java -version
# ② D 盘统一目录是否存在
Test-Path "D:\Program Files\Java"
# ③ 其他常见位置(Oracle 默认目录也查一下)
Test-Path "C:\Program Files\Java"; Test-Path "C:\Program Files (x86)\Java"; Test-Path "D:\Software\Java"
```

分支处理：
- **① 有结果、版本是 1.8/8.x、且 Source 在 D 盘** → 已合规，确认 JAVA_HOME（3.4）后跳到下一节
- **① 有结果但版本不是 1.8**（如 11/17/21）→ **也复用**：保留该版本，但需额外确认老项目要的 1.8 是否在磁盘某处；若只有高版本没有 1.8 → 继续安装 1.8 到 D 盘（两个版本可共存，JAVA_HOME 指向 1.8）
- **① 有结果但 Source 在别处** → 剪切到 `D:\Program Files\Java` + 重设 JAVA_HOME（3.4），不要重新安装
- **② 或 ③ 存在但 ① 无** → 剪切到 `D:\Program Files\Java` + 重设 JAVA_HOME（3.4）
- **都没有 → 执行 3.2**

### 3.1 说明（先读）

- **用 Eclipse Temurin 8**（Adoptium 社区版）而非 Oracle 官方 JDK 8：Oracle 下载需注册账号、AI 无法自动完成
- Temurin 的命令（java/javac）、兼容性、JAVA_HOME 用法与 Oracle JDK 8 完全一样

### 3.2 安装

```powershell
winget install --id EclipseAdoptium.Temurin.8.JDK --location "D:\Program Files\Java"
```

> 包 ID 已实测确认存在（版本 8.0.502.7）。若提示找不到该 ID，先搜：`winget search Temurin`，装带 `8` 的 JDK 包。
> 装好后 JDK 目录一般在 `D:\Program Files\Java\jdk-8u...` 下。

### 3.3 验证

```powershell
java -version
javac -version
```

- `java -version` 输出含 `1.8.0_xxx` 或 `8.0.xxx` 即为成功（JDK 1.8 的版本号写法特殊）
- `javac -version` 输出 `javac 1.8.0_xxx`

### 3.4 确认 JAVA_HOME（重要）

```powershell
echo $env:JAVA_HOME
```

- 有输出且指向 `D:\Program Files\Java\...` → 完成
- 为空或指向 C 盘 → 手动设置（路径按实际安装位置调整）：
  ```powershell
  [Environment]::SetEnvironmentVariable("JAVA_HOME", "D:\Program Files\Java\jdk-8uXXX", "Machine")
  ```
  重开终端再验证 `java -version`。

---

## 4️⃣ 安装 Python（装到 D 盘）

### 4.0 安装前检查（复用优先）

```powershell
# ① python 命令是否已可用——注意:要排除微软商店的"应用执行别名"存根(WindowsApps)
$cmd = Get-Command python -ErrorAction SilentlyContinue
if ($cmd -and $cmd.Source -notlike "*WindowsApps*") { $cmd.Source } else { "未安装(或只有商店存根)" }
python --version
# ② D 盘统一目录是否存在
Test-Path "D:\Program Files\Python313"
# ③ 其他常见位置
Test-Path "$env:LOCALAPPDATA\Programs\Python"; Test-Path "D:\Software\Python"
```

> **关键：** Windows 10 未装 Python 时，`Get-Command python` 会命中微软商店的"应用执行别名"（`%LOCALAPPDATA%\Microsoft\WindowsApps\python.exe` 存根），**会误报"已安装"**。上面第①条已排除此情况——Source 含 WindowsApps 一律视为未安装。

分支处理：
- **① 有结果（非存根）且 Source 在 D 盘** → 已合规，直接验证（4.2）
- **① 有结果（非存根）但 Source 在别处** → 剪切到 `D:\Program Files\Python313` + 更新 PATH，不要重新安装
- **② 或 ③ 存在但 ① 无** → 剪切到 `D:\Program Files\Python313` + 把其目录加入 PATH
- **都没有 → 执行 4.1**

### 4.1 安装（装最新稳定版，本指引以 3.13 为例，可按需换版本号）

```powershell
winget install --id Python.Python.3.13 --location "D:\Program Files\Python313"
```

> 包 ID 已实测确认存在（版本 3.13.15）。版本号可换成 3.12 / 3.14 等，`winget search Python.Python` 可查看所有可用版本。
> 若该 Python 安装器不支持 winget 的 `--location` 参数，会装到用户目录下——此时在 4.2 验证通过即可正常使用；如需严格放 D 盘，用 4.0 的剪切步骤处理。

### 4.2 验证

```powershell
python --version
pip --version
```

- `python --version` 输出 `Python 3.13.x`
- `pip --version` 输出 `pip 2x.x from ...`

**排错：** 运行 `python` 却打开了微软商店页面 → 是 Windows 的"应用执行别名"拦截：
- 设置 → 应用 → 高级应用设置 → 应用执行别名 → 关闭 `python.exe` 和 `python3.exe` 两个开关
- 或重新安装时勾选官方 Python 安装器的 "Add python.exe to PATH"

### 4.3（可选）pip 国内镜像加速

```powershell
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

---

## 5️⃣ 总体验收清单（全部做完后逐项确认）

| 软件 | 验证命令 | 预期输出 | 安装位置 |
|------|----------|----------|----------|
| nvm | `nvm version` | `1.2.2` 或 `1.x.x` | `D:\Program Files\nvm` |
| Node v24 | `node -v` | `v24.x.x`（当前默认） | `D:\Program Files\nvm\v24.x.x` |
| Node v14 | `nvm list` | 列表含 `14.21.3` | `D:\Program Files\nvm\v14.21.3` |
| npm | `npm -v` | `10.x.x` | — |
| Git | `git --version` | `git version 2.x.x.windows.x` | `D:\Program Files\Git` |
| JDK 1.8 | `java -version` | 含 `1.8.0_xxx` 或 `8.0.xxx` | `D:\Program Files\Java` |
| Java 编译器 | `javac -version` | `javac 1.8.0_xxx` | — |
| Python | `python --version` | `Python 3.13.x` | `D:\Program Files\Python313` |
| pip | `pip --version` | `pip 2x.x` | — |

> AI 执行完毕：逐条运行上表命令，全部符合预期才算安装成功。
> 若某软件是"复用/剪切"来的（检查阶段发现已存在），同样要验证通过，且确认它已位于 `D:\Program Files` 下。

---

## 6️⃣ 常见问题速查

| 现象 | 原因 | 解决 |
|------|------|------|
| `nvm` 不是内部或外部命令 | 环境变量没生效 | 重开终端；不行就手动设 NVM_HOME/NVM_SYMLINK 指向 D 盘（见 1.1 排错） |
| nvm 装到了 C 盘默认位置 | 安装器忽略 --location | 手动移动文件夹 + 改环境变量 + 改 settings.txt（见 1.1 排错，默认位置是 %LocalAppData%\nvm） |
| 检查发现软件在其他目录 | 旧安装残留 | `Move-Item` 剪切到 `D:\Program Files` 对应目录 + 更新 PATH，不重复安装 |
| 剪切后命令反而找不到了 | PATH 里还是旧路径 | 按全局规则里的 PATH 更新命令移除旧路径、加入新路径 |
| 检查 python 时报"已安装"但实际没有 | 微软商店应用执行别名存根 | Source 含 WindowsApps 一律视为未安装（见 4.0） |
| `npm` 在 VS Code 报"禁止运行脚本" | PowerShell 执行策略 | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `nvm install` 下载慢 | 网络问题 | 重试或换 npmmirror 镜像（见 1.3） |
| `nvm use` 提示版本未安装 | 版本没装 | 先 `nvm install <版本>` 再 `nvm use` |
| 运行 `python` 打开微软商店 | 应用执行别名拦截 | 设置 → 应用执行别名 → 关闭 python 两个开关 |
| `java -version` 不显示 1.8 | JAVA_HOME 未设或指向其他版本 | 确认/重设 JAVA_HOME 指向 D:\Program Files\Java（见 3.4） |
| winget 找不到软件包 ID | 包 ID 随版本变化 | `winget search <关键字>` 找新 ID |

---

*文档结束。执行中遇到本指引未覆盖的问题，把报错原文发给 AI 协助处理。*
