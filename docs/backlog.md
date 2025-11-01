# Engineering Backlog

This backlog collects cross-cutting or future action items that emerge from reviews and planning.

Routing guidance:

- Use this file for non-urgent optimizations, refactors, or follow-ups that span multiple stories/epics.
- Must-fix items to ship a story belong in that story's `Tasks / Subtasks`.
- Same-epic improvements may also be captured under the epic Tech Spec `Post-Review Follow-ups` section.

| Date | Story | Epic | Type | Severity | Owner | Status | Notes |
| ---- | ----- | ---- | ---- | -------- | ----- | ------ | ----- |
| 2025-10-31 | 1.3 | 1 | TechDebt | Med | TBD | Open | Add React Router v7 future flags (v7_startTransition, v7_relativeSplatPath) to eliminate deprecation warnings in src/renderer/App.tsx |
| 2025-10-31 | 1.3 | 1 | Enhancement | Low | TBD | Open | Create ThemeToggle UI component (Task 4.3 marked complete but component not found) - should be at src/renderer/components/molecules/ThemeToggle/ThemeToggle.tsx |
| 2025-11-01 | 1.4 | 1 | Enhancement | Low | TBD | Deferred | 归档聊天有新消息时显示通知 - 依赖Story 1.5 (消息接收) + Story 1.12 (系统通知). 当前已完成归档状态持久化和includeArchived参数支持 |
| 2025-11-01 | 1.4 | 1 | Enhancement | Low | TBD | Deferred | 支持批量取消归档 - 非核心AC要求. 需要复选框UI、全选状态管理、批量确认对话框. 当前单个操作已满足基本需求 |
| 2025-11-01 | 1.4 | 1 | Enhancement | Low | TBD | Open | 创建ArchiveView组件 - 独立的归档聊天视图页面，提升归档聊天的可访问性 |
| 2025-11-01 | 1.4 | 1 | Enhancement | Low | TBD | Open | 实现拖拽操作归档/置顶 - 提升用户体验，支持拖拽手势完成置顶和归档操作 |
| 2025-11-01 | 1.1审查后续 | 1 | TechDebt | Med | TBD | Open | [第7次审查] 修复200个ESLint代码质量问题(24错误+176警告) - 主要来自Story 1.2-1.4代码。Story 1.1基础配置文件质量优秀无错误。建议在Epic 1回顾或Story 2.x中统一处理 |
| 2025-11-01 | 1.4 | 1 | TechDebt | Med | TBD | Open | [第7次审查] 修复39个失败的测试用例,提升测试通过率从89.8%到95%以上 - 主要失败来自Story 1.4聊天列表测试(MainLayout.test.tsx:363 chat-list testId)。建议在Story 1.4审查时系统性修复 |
| 2025-11-01 | 1.1-1.4 | 1 | TechDebt | Low | TBD | Open | [第7次审查] 完成或移除15个跳过的测试 - 各测试文件中.skip()标记的测试需要审查并处理 |
| 2025-11-01 | 1.4 | 1 | Bug | Low | TBD | Open | [第7次审查Story 1.4] 修复ContactItem.tsx:64逻辑缺陷 - 将`??`改为`||`使Space键正常触发onClick事件 [file: ContactItem.tsx:64] |
| 2025-11-01 | 1.4 | 1 | TechDebt | Low | TBD | Open | [第7次审查Story 1.4] 修复ContactItem.test.tsx:77测试查询 - 使用data-testid或container.querySelector避免altText歧义 [file: ContactItem.test.tsx:77] |
| 2025-11-01 | 1.4 | 1 | TechDebt | VeryLow | TBD | Open | [第7次审查Story 1.4] 可选:FTS5全文搜索优化 - 在100+聊天时监控LIKE搜索性能,必要时迁移到FTS5或IndexedDB+lunr.js |
| 2025-11-01 | 1.4 | 1 | TechDebt | VeryLow | TBD | Open | [第7次审查Story 1.4] 可选:sql.js持久化优化 - 批量写入优化或定时写盘策略(当前方案可靠,性能可接受) |
