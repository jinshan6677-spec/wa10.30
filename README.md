# WhatsApp语言增强层

基于Electron和Evolution API的WhatsApp语言增强桌面应用，提供实时翻译、多模态支持和智能化用户体验。

## 🚀 功能特性

### 核心功能
- 🔗 **WhatsApp集成** - 基于Evolution API的稳定连接
- 🌐 **实时翻译** - 智能语言检测和即时翻译
- 💬 **多模态支持** - 文本、语音、图片翻译
- ⚡ **高性能** - 原生桌面应用体验

### 技术特性
- 🎨 **现代界面** - 基于React 18的用户界面
- 🔒 **安全可靠** - 上下文隔离和内容安全策略
- 🔄 **热重载** - 开发环境实时更新
- 📦 **跨平台** - Windows、macOS、Linux支持

## 📋 系统要求

### 运行环境
- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **操作系统**:
  - Windows 10+ (x64, x86)
  - macOS 10.15+ (x64, Apple Silicon)
  - Ubuntu 18.04+ (x64)

### 开发环境
- **代码编辑器**: VS Code (推荐)
- **Git**: 版本控制
- **TypeScript**: 5.6.3+

## 🛠️ 安装和运行

### 1. 克隆项目
```bash
git clone https://github.com/bmad/whatsapp-language-enhancement.git
cd whatsapp-language-enhancement
```

### 2. 安装依赖
```bash
npm install
```

### 3. 开发模式运行
```bash
npm run dev
```

### 4. 构建应用
```bash
# 开发构建
npm run build:dev

# 生产构建
npm run build
```

### 5. 启动应用
```bash
npm start
```

## 📦 可用脚本

### 开发脚本
```bash
npm run dev          # 启动开发服务器（主进程+渲染进程+预加载脚本）
npm run dev:main     # 只监听主进程文件变化
npm run dev:renderer # 只启动渲染进程开发服务器
npm run dev:preload  # 只监听预加载脚本文件变化
```

### 构建脚本
```bash
npm run build        # 生产构建所有组件
npm run build:main   # 只构建主进程
npm run build:renderer # 只构建渲染进程
npm run build:preload  # 只构建预加载脚本
npm run rebuild      # 清理并重新构建
npm run clean        # 清理构建文件
```

### 测试脚本
```bash
npm test           # 运行测试
npm run test:watch # 监听模式运行测试
npm run test:coverage # 运行测试并生成覆盖率报告
```

### 代码质量脚本
```bash
npm run lint       # 运行ESLint检查
npm run lint:fix   # 自动修复ESLint错误
npm run format     # 格式化代码
npm run type-check # TypeScript类型检查
```

### 打包脚本
```bash
npm run pack        # 打包应用（不生成安装包）
npm run dist        # 生成所有平台的安装包
npm run dist:win    # 只生成Windows安装包
npm run dist:mac    # 只生成macOS安装包
npm run dist:linux  # 只生成Linux安装包
```

## 🏗️ 项目结构

```
whatsapp-language-enhancement/
├── src/                     # 源代码目录
│   ├── main/               # 主进程代码
│   │   └── main.ts         # 主进程入口文件
│   ├── renderer/           # 渲染进程代码
│   │   ├── index.tsx       # 渲染进程入口
│   │   ├── App.tsx         # 主应用组件
│   │   └── App.css         # 应用样式
│   ├── preload/            # 预加载脚本
│   │   └── preload.ts      # 预加载脚本入口
│   └── shared/             # 共享代码
│       ├── types/          # TypeScript类型定义
│       ├── utils/          # 工具函数
│       ├── constants/      # 常量定义
│       └── config/         # 配置文件
├── public/                 # 静态资源
│   └── index.html         # HTML模板
├── assets/                 # 应用资源
│   └── icons/             # 应用图标
├── build/                  # 构建输出目录
├── release/                # 打包输出目录
├── docs/                   # 项目文档
├── tests/                  # 测试文件
├── .github/                # GitHub配置
│   └── workflows/         # CI/CD工作流
├── .vscode/                # VS Code配置
├── .husky/                 # Git hooks
└── package.json           # 项目配置
```

## 🔧 开发配置

### VS Code配置
项目包含了完整的VS Code配置，包括：
- 自动格式化
- 代码检查
- 调试配置
- 任务配置
- 推荐扩展

### Git Hooks
项目使用Husky和lint-staged进行代码质量控制：
- **pre-commit**: 代码格式化、类型检查、测试
- **pre-push**: 完整测试套件、构建验证

### 代码规范
- **ESLint**: Airbnb配置 + TypeScript规则
- **Prettier**: 统一代码格式化
- **TypeScript**: 严格类型检查
- **Conventional Commits**: 提交信息规范

## 🧪 测试

### 测试框架
- **Jest**: 单元测试框架
- **React Testing Library**: React组件测试
- **Electron测试**: 主进程和渲染进程集成测试

### 运行测试
```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 测试结构
```
tests/
├── unit/           # 单元测试
├── integration/    # 集成测试
├── e2e/           # 端到端测试
└── __mocks__/     # Mock文件
```

## 🚀 部署

### 自动部署
项目配置了GitHub Actions进行CI/CD：
- **Pull Request**: 自动运行测试和构建
- **Push到main分支**: 自动构建和创建release
- **Tag推送**: 自动创建GitHub Release

### 手动部署
```bash
# 构建所有平台
npm run dist

# 构建特定平台
npm run dist:win
npm run dist:mac
npm run dist:linux
```

## 🔐 安全考虑

### Electron安全配置
- ✅ 禁用Node.js集成在渲染进程中
- ✅ 启用上下文隔离
- ✅ 使用contextBridge进行安全通信
- ✅ 配置内容安全策略(CSP)
- ✅ 禁用remote模块

### 代码安全
- ✅ TypeScript严格类型检查
- ✅ ESLint安全规则
- ✅ 依赖安全扫描
- ✅ 敏感信息环境变量管理

## 🤝 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

### 提交规范
使用[Conventional Commits](https://www.conventionalcommits.org/)规范：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 代码审查
所有代码必须通过：
- ESLint检查
- TypeScript类型检查
- 单元测试
- 代码审查

## 📝 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 📞 联系我们

- **项目主页**: https://github.com/bmad/whatsapp-language-enhancement
- **问题反馈**: https://github.com/bmad/whatsapp-language-enhancement/issues
- **邮箱**: dev@bmad.com

## 🙏 致谢

感谢以下开源项目：
- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Webpack](https://webpack.js.org/)
- [Evolution API](https://doc.evolution-api.com/)

---

**WhatsApp语言增强层** - 让沟通无国界 🌍