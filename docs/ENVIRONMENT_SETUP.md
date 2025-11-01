# 环境配置指南

本文档记录了项目运行所需的环境依赖和配置步骤。

## 当前环境问题 (2025-11-01)

### 🚨 CRITICAL: Visual Studio Build Tools 缺失

**问题描述：**
- Story 1.4使用better-sqlite3原生模块需要编译
- 当前环境缺少Visual Studio Build Tools
- 导致better-sqlite3原生模块无法编译，NODE_MODULE_VERSION不匹配

**影响：**
- ❌ 数据库初始化100%失败
- ❌ 聊天列表、搜索、置顶、归档功能全部不可用
- ❌ Story 1.4被阻塞

**错误信息：**
```
Error: The module '\\?\E:\WhatsApps\wa10.30\node_modules\better-sqlite3\build\Release\better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 115. This version of Node.js requires
NODE_MODULE_VERSION 130.
```

**根本原因：**
- 系统Node.js: v16.x (MODULE_VERSION 115)
- Electron 33需要: Node.js v20.x (MODULE_VERSION 130)
- 预编译的better-sqlite3.node版本不匹配

---

## 解决方案：安装Visual Studio Build Tools

### 步骤1：下载Visual Studio Build Tools 2022

**下载链接：**
https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

**文件大小：** ~2-4GB
**安装大小：** ~7GB

### 步骤2：安装配置

1. 运行安装程序
2. 选择 **"使用C++的桌面开发"** 工作负载
3. 确保勾选以下组件：
   - ✅ MSVC v143 - VS 2022 C++ x64/x86 生成工具
   - ✅ Windows 11 SDK（或Windows 10 SDK）
   - ✅ C++ CMake工具

4. 点击安装，等待完成（约30-60分钟）

### 步骤3：重新编译better-sqlite3

安装完成后，在项目根目录执行：

```powershell
# 方法1: 使用npm postinstall脚本
npm run postinstall

# 方法2: 手动使用electron-rebuild
npx electron-rebuild -f -w better-sqlite3

# 方法3: 重新安装better-sqlite3
npm rebuild better-sqlite3
```

### 步骤4：验证编译成功

```powershell
# 检查.node文件是否存在
dir node_modules\better-sqlite3\build\Release\better_sqlite3.node

# 应该看到文件存在，大小约1.6MB
```

### 步骤5：运行时验证

```powershell
# 启动应用
npm run start:dev

# 检查控制台输出，应该看到：
# [Database] Database initialized successfully
```

---

## 验证清单

完成环境配置后，请验证以下项：

- [ ] Visual Studio Build Tools 2022已安装
- [ ] better-sqlite3.node文件已重新编译
- [ ] 应用启动时数据库初始化成功
- [ ] 控制台无NODE_MODULE_VERSION错误
- [ ] 聊天列表可以正常显示
- [ ] 搜索功能可以正常工作
- [ ] 置顶/归档功能可以正常工作

---

## 环境依赖清单

### 必需依赖

| 依赖 | 版本 | 用途 | 状态 |
|------|------|------|------|
| Node.js | v16+ | 运行环境 | ✅ 已安装 |
| npm | v8+ | 包管理器 | ✅ 已安装 |
| Visual Studio Build Tools | 2022 | 编译原生模块 | ❌ 缺失 |
| Windows SDK | 10/11 | C++编译支持 | ❌ 缺失 |

### 原生模块

| 模块 | 版本 | 编译状态 | 说明 |
|------|------|---------|------|
| better-sqlite3 | 9.6.0 | ❌ 版本不匹配 | 需要MODULE_VERSION 130 |
| keytar | 7.9.0 | ⚠️ 未验证 | 可能也需要重新编译 |

---

## 常见问题

### Q1: 为什么不能使用预编译的二进制文件？

**A:** better-sqlite3@9.6.0的预编译二进制是为Node.js v16编译的（MODULE_VERSION 115），但Electron 33内置Node.js v20（MODULE_VERSION 130），版本不匹配导致无法加载。

### Q2: 可以升级/降级Node.js版本来匹配吗？

**A:** 不推荐。系统Node.js版本与Electron内置版本是独立的。即使系统安装Node.js v20，Electron仍然使用自己内置的Node.js运行时。正确的做法是使用electron-rebuild针对Electron版本重新编译原生模块。

### Q3: 安装Visual Studio Build Tools需要多长时间？

**A:**
- 下载时间：10-30分钟（取决于网速）
- 安装时间：20-40分钟
- 总计：30-60分钟

### Q4: 安装后占用多少磁盘空间？

**A:** 约7-10GB（包括安装程序和安装后的文件）

### Q5: 可以只安装特定组件吗？

**A:** 可以。最小化安装只需要：
- MSVC编译器
- Windows SDK
- CMake工具

但推荐完整安装"使用C++的桌面开发"工作负载，确保兼容性。

---

## 技术债务记录

### 当前问题

1. **Story 1.4被阻塞** - 等待环境配置完成
2. **代码已100%完成** - 仅环境依赖阻塞运行时验证

### 未来改进建议

1. **CI/CD环境配置**
   - 在CI环境预装Visual Studio Build Tools
   - 缓存编译后的原生模块

2. **开发者文档**
   - 在README.md添加环境配置章节
   - 提供一键配置脚本

3. **技术选型**
   - 评估是否可以使用纯JavaScript的SQLite实现（如sql.js）
   - 权衡性能损失 vs 环境依赖复杂度

---

## 相关链接

- [Visual Studio Build Tools下载](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- [node-gyp Windows配置指南](https://github.com/nodejs/node-gyp#on-windows)
- [electron-rebuild文档](https://github.com/electron/rebuild)
- [better-sqlite3文档](https://github.com/WiseLibs/better-sqlite3)
- [Node.js MODULE_VERSION对照表](https://nodejs.org/en/download/releases)

---

**最后更新：** 2025-11-01
**维护者：** BMad Development Team
