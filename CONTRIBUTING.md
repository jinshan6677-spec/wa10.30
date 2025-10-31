# 贡献指南

感谢您对WhatsApp语言增强层项目的关注！我们欢迎所有形式的贡献，包括但不限于代码、文档、问题反馈和功能建议。

## 🤝 如何贡献

### 报告问题

如果您发现了bug或有功能建议，请：

1. **搜索现有Issue** - 确保问题未被报告
2. **创建新Issue** - 使用适当的模板
3. **提供详细信息** - 包括：
   - 操作系统和版本
   - Node.js版本
   - 复现步骤
   - 期望行为
   - 实际行为
   - 错误日志（如果有）

### 提交代码

#### 1. 准备工作

```bash
# Fork项目到您的GitHub账户
# 然后克隆您的fork
git clone https://github.com/YOUR_USERNAME/whatsapp-language-enhancement.git
cd whatsapp-language-enhancement

# 添加上游仓库
git remote add upstream https://github.com/bmad/whatsapp-language-enhancement.git

# 安装依赖
npm install

# 创建开发分支
git checkout -b feature/your-feature-name
```

#### 2. 开发流程

```bash
# 保持分支最新
git fetch upstream
git rebase upstream/main

# 进行开发
# ... 编写代码 ...

# 运行测试
npm test

# 代码检查
npm run lint:fix
npm run type-check

# 提交代码
git add .
git commit -m "feat: add your feature"
```

#### 3. 提交规范

我们使用[Conventional Commits](https://www.conventionalcommits.org/)规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**类型说明：**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI/CD相关
- `build`: 构建系统或依赖变更

**示例：**
```
feat(auth): add user login functionality

Implement user authentication with email and password.
Add login form component and authentication service.

Closes #123
```

#### 4. Pull Request流程

```bash
# 推送到您的fork
git push origin feature/your-feature-name

# 在GitHub上创建Pull Request
# 填写PR模板，提供详细描述
```

## 📋 代码规范

### TypeScript规范

#### 类型定义
```typescript
// ✅ 明确的类型定义
interface UserConfig {
  id: string;
  name: string;
  preferences: UserPreferences;
}

// ❌ 避免使用any
const data: any = fetchData();
```

#### 函数签名
```typescript
// ✅ 明确的参数和返回类型
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ✅ 异步函数
const fetchUser = async (id: string): Promise<User | null> => {
  try {
    return await userService.findById(id);
  } catch (error) {
    logger.error('Failed to fetch user', error);
    return null;
  }
};
```

### React组件规范

#### 函数组件
```typescript
// ✅ 使用React.FC和明确的Props类型
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

#### Hooks使用
```typescript
// ✅ 自定义Hook
const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error('Error reading localStorage', error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error('Error setting localStorage', error);
    }
  };

  return [storedValue, setValue];
};
```

### 样式规范

#### CSS类命名
```css
/* ✅ 使用BEM命名规范 */
.user-card {
  display: flex;
  padding: 1rem;
}

.user-card__header {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.user-card__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.user-card--highlighted {
  border: 2px solid var(--color-primary);
}
```

#### CSS变量
```css
/* ✅ 使用CSS变量 */
:root {
  --color-primary: #3498db;
  --color-secondary: #2c3e50;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
}
```

## 🧪 测试要求

### 单元测试
```typescript
// ✅ 完整的测试覆盖
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
    });

    it('should throw error with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
      };

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid email format');
    });
  });
});
```

### 组件测试
```typescript
// ✅ React组件测试
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('should render children correctly', () => {
    render(<Button onClick={jest.fn()}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button onClick={jest.fn()} disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

## 📝 文档贡献

### 文档类型
- **README.md**: 项目概述和快速开始
- **DEVELOPMENT.md**: 详细开发指南
- **API.md**: API文档
- **CHANGELOG.md**: 版本更新日志
- **代码内文档**: JSDoc注释

### JSDoc规范
```typescript
/**
 * 计算两个日期之间的天数差
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 * @returns 天数差
 * @example
 * ```typescript
 * const days = calculateDaysBetween(
 *   new Date('2024-01-01'),
 *   new Date('2024-01-10')
 * );
 * console.log(days); // 9
 * ```
 */
export const calculateDaysBetween = (
  startDate: Date,
  endDate: Date
): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
```

## 🔍 代码审查

### 审查清单

#### 功能性
- [ ] 代码实现了预期功能
- [ ] 边界条件处理正确
- [ ] 错误处理完善
- [ ] 性能考虑合理

#### 代码质量
- [ ] 代码结构清晰
- [ ] 命名规范一致
- [ ] 注释充分准确
- [ ] 无重复代码

#### 安全性
- [ ] 输入验证完整
- [ ] 敏感信息保护
- [ ] 权限控制合理
- [ ] 无安全漏洞

#### 测试
- [ ] 测试覆盖率足够
- [ ] 测试用例完整
- [ ] 边界测试充分
- [ ] 集成测试通过

#### 文档
- [ ] 代码注释充分
- [ ] API文档更新
- [ ] README同步更新
- [ ] 变更日志记录

### 审查流程

1. **自动检查**
   - CI/CD流水线自动运行
   - 代码格式检查
   - 类型检查
   - 测试执行

2. **人工审查**
   - 至少一个维护者审查
   - 功能性检查
   - 代码质量评估
   - 安全性审查

3. **反馈处理**
   - 及时响应审查意见
   - 修改建议问题
   - 更新相关文档
   - 重新提交审查

## 🎯 贡献类型

### 代码贡献
- 新功能开发
- Bug修复
- 性能优化
- 代码重构

### 文档贡献
- README改进
- API文档完善
- 开发指南补充
- 翻译支持

### 测试贡献
- 单元测试编写
- 集成测试补充
- 端到端测试
- 测试覆盖率提升

### 设计贡献
- UI/UX改进
- 图标设计
- 主题样式
- 交互优化

## 🏆 贡献者认可

### 贡献者列表
所有贡献者都会在项目中得到认可：
- README贡献者列表
- 发布说明感谢
- 年度贡献者报告

### 贡献等级
- **Contributor**: 提交被合并
- **Active Contributor**: 持续贡献
- **Core Contributor**: 核心维护者

## 📞 获取帮助

如果您在贡献过程中遇到问题：

1. **查看文档**
   - [开发指南](./docs/DEVELOPMENT.md)
   - [API文档](./docs/API.md)
   - [常见问题](./docs/FAQ.md)

2. **搜索Issue**
   - 查看是否有类似问题
   - 参考现有讨论

3. **创建讨论**
   - GitHub Discussions
   - 技术问题讨论
   - 功能建议交流

4. **联系维护者**
   - 创建Issue并标记`question`
   - 发邮件至dev@bmad.com

## 📄 许可证

通过贡献代码，您同意您的贡献将在[MIT License](LICENSE)下发布。

---

再次感谢您的贡献！🙏

让我们一起构建更好的WhatsApp语言增强层！