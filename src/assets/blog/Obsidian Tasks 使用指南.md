---
category: dev-environment
title: Obsidian Tasks 使用指南
tags:
  - Obsidian
  - 插件
  - 任务管理
---



> Obsidian Tasks 是 Obsidian 最流行的任务管理插件之一。
> 
> 它可以将散落在各种 Markdown 笔记中的任务统一管理、查询、筛选和追踪。
> 
> 核心理念：
> 
> **任务属于笔记，而不是独立存在于任务软件中。**
> 
> 所有任务数据仍然保存在 Markdown 文件中，不会产生额外数据库。

---

# 1. Tasks 插件简介

## 1.1 Tasks 能解决什么问题？

在普通 Obsidian 中，任务通常分散在不同笔记：

例如：

```markdown
# 用户系统开发

- [ ] 完成登录接口
- [ ] 添加权限控制


# 学习笔记

- [ ] 阅读 Spring Boot 源码


# 会议记录

- [ ] 整理会议纪要
```

当笔记越来越多：

- 不知道还有哪些任务未完成
    
- 不知道哪些任务已经过期
    
- 无法看到今天应该做什么
    

Tasks 插件可以：

- 自动扫描所有 Markdown 任务
    
- 汇总所有待办事项
    
- 根据日期过滤
    
- 根据优先级排序
    
- 按文件或标题分组
    
- 直接修改原始任务状态
    

---

# 2. 安装 Tasks 插件

安装步骤：

```
设置
 ↓
第三方插件
 ↓
关闭安全模式
 ↓
社区插件市场
 ↓
搜索 Tasks
 ↓
安装
 ↓
启用
```

插件名称：

```
Tasks
```

---

# 3. Tasks 基础任务格式

Tasks 基于 Markdown Checkbox。

## 3.1 普通任务

写法：

```markdown
- [ ] 学习 Obsidian Tasks
```

显示：

```
☐ 学习 Obsidian Tasks
```

完成：

```markdown
- [x] 学习 Obsidian Tasks
```

显示：

```
☑ 学习 Obsidian Tasks
```

---

# 4. 任务属性

Tasks 支持给任务添加额外信息。

---

## 4.1 截止日期（Due Date）

格式：

```markdown
📅 YYYY-MM-DD
```

示例：

```markdown
- [ ] 完成接口开发 📅 2026-08-10
```

表示：

```
任务：
完成接口开发

截止：
2026-08-10
```

---

## 4.2 开始日期（Scheduled Date）

格式：

```markdown
🛫 YYYY-MM-DD
```

示例：

```markdown
- [ ] 开始重构用户模块 🛫 2026-08-15
```

表示：

任务计划从：

```
2026-08-15
```

开始。

---

## 4.3 优先级

Tasks 使用 Emoji 表示优先级：

|符号|级别|
|---|---|
|🔺|最高|
|⏫|高|
|🔼|普通|
|🔽|低|
|⏬|最低|

示例：

```markdown
- [ ] 修复线上 Bug 🔺
```

---

## 4.4 循环任务

格式：

```markdown
🔁 every 周期
```

示例：

每天：

```markdown
- [ ] 写日报 🔁 every day
```

每周：

```markdown
- [ ] 周总结 🔁 every week
```

完成后 Tasks 会自动生成下一次任务。

---

## 4.5 标签

任务可以添加标签：

```markdown
- [ ] 修复登录问题 #backend
```

查询时可以根据标签筛选。

---

# 5. Tasks 查询语法

Tasks 的查询类似 SQL。

基本结构：

````markdown
```tasks

查询条件

排序

分组

```
````

例如：

````markdown
```tasks
not done
due today
group by filename
sort by due
```
````

---

# 6. 查询条件详解

---

## 6.1 查询未完成任务

语法：

```
not done
```

示例：

````markdown
```tasks
not done
```
````

显示：

```markdown
- [ ] 未完成任务A
- [ ] 未完成任务B
```

不会显示：

```markdown
- [x] 已完成任务
```

---

## 6.2 查询已完成任务

语法：

```
done
```

示例：

````markdown
```tasks
done
```
````

---

## 6.3 日期查询

### 今天任务

```
due today
```

示例：

````markdown
```tasks
not done
due today
```
````

---

### 明天任务

```
due tomorrow
```

---

### 已过期任务

```
due before today
```

示例：

````markdown
```tasks
not done
due before today
```
````

---

### 未来任务

```
due after today
```

---

### 没有截止日期任务

```
no due date
```

---

# 7. 分组（Group）

## 按文件分组

语法：

```
group by filename
```

例如：

````markdown
```tasks
not done
group by filename
```
````

显示：

```
项目A.md

☐ 完成接口


学习笔记.md

☐ 阅读源码
```

---

## 按标题分组

语法：

```
group by heading
```

例如：

```markdown
# 用户模块

- [ ] 登录接口


# 订单模块

- [ ] 支付接口
```

结果：

```
用户模块

☐ 登录接口


订单模块

☐ 支付接口
```

---

# 8. 排序（Sort）

## 按截止日期排序

```
sort by due
```

示例：

````markdown
```tasks
not done
sort by due
```
````

---

## 常用排序方式

|语法|作用|
|---|---|
|sort by due|截止日期|
|sort by priority|优先级|
|sort by created|创建时间|
|sort by description|任务名称|
|sort by path|文件路径|

---

## 倒序

格式：

```
sort by due reverse
```

---

# 9. 常用任务查询模板

---

## 9.1 今日任务

````markdown
```tasks
not done
due today
```
````

---

## 9.2 所有未完成任务

````markdown
```tasks
not done
```
````

---

## 9.3 逾期任务

````markdown
```tasks
not done
due before today
sort by due
```
````

---

## 9.4 高优先级任务

````markdown
```tasks
not done
priority is high
```
````

---

## 9.5 某个项目任务

例如项目目录：

```
Projects/ERP
```

查询：

````markdown
```tasks
path includes Projects/ERP
not done
```
````

---

## 9.6 没有日期的任务

````markdown
```tasks
not done
no due date
```
````

---

## 9.7 循环任务

````markdown
```tasks
not done
is recurring
```
````

---

# 10. Tasks 查询页面设计

推荐建立：

```
Vault

├── Daily
│
├── Projects
│
├── Knowledge
│
└── Dashboard
    └── Tasks.md
```

---

Tasks.md：

````markdown
# 今日任务

```tasks
not done
due today
sort by priority
````

## 逾期任务

```tasks
not done
due before today
sort by due
```

## 所有任务

```tasks
not done
group by filename
sort by due
```

```

效果：

```

今日任务  
↓  
今天必须完成

逾期任务  
↓  
需要处理的问题

所有任务  
↓  
完整任务列表

```

---

# 11. Tasks 配置在哪里查看？

## 方法一：插件帮助文档

进入：

```

设置  
↓  
第三方插件  
↓  
Tasks  
↓  
Documentation

```

可以查看：

- 查询语法
- 日期规则
- 循环任务
- 排序
- 分组
- 高级过滤


---

## 方法二：命令面板

快捷键：

```

Ctrl + P

```

搜索：

```

Tasks

```

可以看到：

```

Tasks: Create or edit task

Tasks: Toggle task done

Tasks: Open documentation

```

---

## 方法三：官方文档

搜索：

```

Obsidian Tasks Query Language

```

重点查看：

- Filters
- Sorting
- Grouping
- Task Fields

---

# 12. Tasks 与其他插件组合

## Tasks + Calendar

用途：

- 日历查看任务
- 日期管理


---

## Tasks + Periodic Notes

用途：

建立：

```

Daily  
Weekly  
Monthly

```

周期笔记。

例如：

每天：

```

今日计划

↓  
Tasks 自动显示

```

---

## Tasks + Dataview

区别：

| |Tasks|Dataview|
|-|-|-|
|定位|任务管理|数据查询|
|Checkbox|强|一般|
|日期|原生支持|需要配置|
|循环任务|支持|弱|
|修改任务|支持|通常只读|

推荐：

```

Tasks 管任务

Dataview 管数据

```

---

# 13. 程序员推荐工作流

目录：

```

Vault

├── Daily  
│  
├── Projects  
│  
│ ├── 项目A.md  
│ └── 项目B.md  
│  
├── Knowledge  
│  
└── Dashboard  
└── Tasks.md

````

---

项目笔记：

```markdown
# 用户系统


## TODO

- [ ] 完成登录接口 🔺 📅 2026-08-10

- [ ] 添加权限控制 📅 2026-08-15
````

---

Dashboard 自动汇总：

````markdown
```tasks
not done
group by filename
sort by due
```
````

最终效果：

- 项目任务保存在项目文档
    
- 每日任务自动汇总
    
- 技术笔记和任务绑定
    
- 所有数据都是 Markdown
    

---

# 14. Tasks 优缺点

## 优点

✅ Markdown 数据保存  
✅ 不锁定数据  
✅ 查询能力强  
✅ 支持日期、优先级、循环任务  
✅ 非常适合个人知识管理

---

## 缺点

❌ 不适合多人协作  
❌ 没有 Jira 那种项目管理能力  
❌ 高级查询需要学习

---

# 总结

Obsidian Tasks 可以理解为：

> 给 Obsidian 增加一个完整的个人任务管理系统。

推荐组合：

```
Tasks
+
Dataview
+
Calendar
+
Periodic Notes
```

适合：

- 程序员
    
- 技术学习者
    
- 知识库用户
    
- GTD 用户
    

尤其适合：

```
技术笔记
+
项目管理
+
任务追踪
+
AI 编程记录
```

形成一个完整的个人开发知识管理系统。