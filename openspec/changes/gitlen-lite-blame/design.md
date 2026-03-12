## Context

This is a VS Code extension that provides GitLens-like blame functionality. The current workspace is a new extension project that needs core blame features implemented. The extension will integrate with VS Code's decoration API to show inline blame information and leverage Git commands for data retrieval.

## Goals / Non-Goals

**Goals:**
- Provide lightweight, performant inline blame annotations
- Display commit details in hover cards without performance impact
- Enable quick diff comparison between current and previous versions
- Maintain minimal memory footprint for large repositories
- Support common Git workflows and repository structures

**Non-Goals:**
- Advanced GitLens features like file history, commit graph, or repository insights
- Complex configuration options or custom theming
- Integration with external services or APIs
- Support for non-Git version control systems

## Decisions

**VS Code Extension Architecture:**
- Use VS Code's DecorationType API for inline blame rendering
- Leverage TextEditorDecorationType for consistent styling
- Implement workspace-level git repository detection and monitoring

**Git Data Retrieval:**
- Use simple-git npm package for cross-platform Git command execution
- Cache blame data per file to avoid repeated expensive operations
- Implement incremental updates when files change

**UI Components:**
- Inline decorations using after property for line-end annotations
- Hover provider for detailed commit information cards
- Quick diff provider for version comparison functionality

**Performance Strategy:**
- Lazy loading of blame data only when visible in editor
- Debounced git operations to prevent excessive command execution
- Memory-efficient data structures for blame information storage

## Risks / Trade-offs

**[Performance Risk]** Large repositories may cause slow blame operations → Mitigation: Implement caching, lazy loading, and debounced operations

**[Memory Risk]** Storing blame data for many files could impact memory → Mitigation: Implement LRU cache and cleanup for inactive editors

**[Git Dependency Risk]** Requires git to be installed and available in PATH → Mitigation: Add clear error messaging and git installation guidance

**[Compatibility Risk]** Different git versions may have varying blame output → Mitigation: Use simple-git for consistent command handling and fallback parsing

## Migration Plan

1. Set up basic VS Code extension structure with manifest
2. Implement core git integration and blame data retrieval
3. Add inline decoration rendering
4. Implement hover cards for commit details
5. Add diff comparison functionality
6. Performance optimization and testing

## Open Questions

- Should blame data persist across VS Code sessions or be recalculated each time?
  answer: 
  ```
  In-memory Cache： 在当前 VS Code 会话中，对已打开的文件进行内存缓存。

  生命周期触发： 仅在“文件打开”、“文件聚焦（Focus）”或“文件保存”后延迟（Debounce）触发计算。

  避免增量编辑时实时重算： 当用户正在打字时，Blame 信息应该暂时隐藏或显示为“已修改”，直到输入停止一段时间后再更新，防止消耗过多 CPU。
  ```
- How to handle binary files or files without git history?
  answer: 
  ```
结论：优雅降级（Graceful Degradation）。

二进制文件（.png, .exe, .pdf）：

策略： 预先通过文件头或 VS Code 的 fs API 判断。

交互： 在原本显示 Blame 的地方显示 Binary File 或者干脆保持空白。不要尝试对二进制文件运行 Git 命令，这会产生无意义的计算开销。

无 Git 历史的文件（未跟踪的本地新文件）：

策略： 运行 git ls-files 检查状态。

交互： 显示 Not Committed 或 Local Changes。

不在 Git 仓库中的文件：

策略： 插件初始化时向上递归查找 .git 文件夹。

交互： 如果没有发现仓库，彻底禁用该文件的 Blame 逻辑，避免报错干扰用户。
  ```
- What fallback behavior for repositories with many commits or large files?
  answer: ```
  结论：限制作用域 + 异步流式处理。

大文件（例如 > 5000 行）：

分片计算： 不要一次性 blame 整个文件。可以只对**当前可见视口（Viewport）**内的行进行 blame。

节流（Throttling）： 限制最大行数。如果文件过大，弹出提示“文件过大，已禁用自动 Blame”，仅在用户点击时触发。

超多提交记录（Monorepo）：

异步子进程： 必须在单独的 Worker 进程中运行 git 命令，利用 VS Code 的 ChildProcess 并设置 timeout。

优先级管理： 优先处理当前活跃编辑器。如果后台有多个文件的 Blame 任务，使用队列管理，新任务可以强行取消旧任务。

UI 降级：

如果命令返回时间超过 500ms，在状态栏显示一个微小的加载图标，避免让用户觉得编辑器“卡住了”。
```
