# Gitlen Lite

A lightweight GitLens clone for VS Code that provides inline blame functionality with minimal performance impact.

## Features

- **Inline Blame Annotations**: Shows commit author and date at the end of each line
- **Hover Cards**: Detailed commit information when hovering over blame annotations
- **Diff Comparison**: Compare current file version with previous commits
- **Performance Optimized**: Lazy loading, caching, and debounced operations
- **Lightweight**: Focused on core blame features without unnecessary complexity

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Gitlen Lite"
4. Click Install

Or install from the command line:

```bash
code --install-extension gitlen-lite
```

## Usage

### Basic Blame Display

Once installed, Gitlen Lite automatically shows blame information at the end of each line in tracked files:

```
console.log('Hello World');  // John Doe, 2 hours ago
```

### Hover Information

Hover over any blame annotation to see detailed commit information:

- **Commit Hash**: Short hash and full hash
- **Author**: Commit author name
- **Date**: Full commit date
- **Message**: Commit message
- **Actions**: Copy hash, show in external tool, compare with previous

### Commands

Use the Command Palette (Ctrl+Shift+P) to access these commands:

- **Gitlen Lite: Toggle Blame** - Enable/disable blame annotations
- **Gitlen Lite: Refresh Blame** - Refresh blame information for current file
- **Gitlen Lite: Copy Commit Hash** - Copy commit hash to clipboard

### Configuration

Open VS Code settings and search for "gitlen-lite" to configure:

- **gitlen-lite.enabled**: Enable/disable inline blame annotations (default: true)
- **gitlen-lite.dateFormat**: Date format for blame annotations
  - `relative`: "2 hours ago", "yesterday", etc. (default)
  - `absolute`: "12/25/2023"
  - `iso`: "2023-12-25"
- **gitlen-lite.maxFileSize**: Maximum file size (lines) for automatic blame (default: 5000)
- **gitlen-lite.cacheEnabled**: Enable blame data caching (default: true)
- **gitlen-lite.debounceDelay**: Debounce delay (ms) for blame updates (default: 500)

## Performance

Gitlen Lite is optimized for performance:

- **Lazy Loading**: Only processes visible files
- **Caching**: In-memory cache for blame data
- **Debouncing**: Prevents excessive git operations during typing
- **File Size Limits**: Automatically disables for very large files
- **Binary File Detection**: Skips binary files automatically

## Requirements

- VS Code 1.74.0 or higher
- Git must be installed and available in PATH

## Supported File Types

Gitlen Lite works with most text-based file types:

- JavaScript, TypeScript
- Python, Java, Go, Rust
- C, C++, C#
- PHP, Ruby, Swift, Kotlin, Scala
- Shell scripts, YAML, JSON
- Markdown, HTML, CSS, Vue, Svelte

## Limitations

- Only works with Git repositories
- Binary files are automatically excluded
- Very large files (>5000 lines by default) may have disabled automatic blame
- Requires git to be installed and accessible

## Troubleshooting

### Blame not showing

1. Ensure the file is in a Git repository
2. Check that git is installed and in PATH
3. Verify the file is tracked by Git (`git ls-files`)
4. Check if blame is enabled in settings

### Performance issues

1. Increase `gitlen-lite.maxFileSize` if needed for large files
2. Adjust `gitlen-lite.debounceDelay` for different responsiveness
3. Disable caching if memory usage is high (`gitlen-lite.cacheEnabled`)

### Git errors

1. Ensure git is installed: `git --version`
2. Check repository health: `git status`
3. Verify file permissions

## Development

### Building

```bash
npm install
npm run compile
```

### Testing

```bash
npm test
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Changelog

### v0.0.1

- Initial release
- Basic inline blame functionality
- Hover cards with commit details
- Diff comparison feature
- Performance optimizations
- Configuration options

## Support

- Report issues: [GitHub Issues](https://github.com/your-username/gitlen-lite/issues)
- Feature requests: [GitHub Discussions](https://github.com/your-username/gitlen-lite/discussions)

## Compared to GitLens

Gitlen Lite is a lightweight alternative to GitLens focused on core blame functionality:

| Feature | Gitlen Lite | GitLens |
|---------|-------------|---------|
| Inline Blame | ✅ | ✅ |
| Hover Cards | ✅ | ✅ |
| Diff View | ✅ | ✅ |
| File History | ❌ | ✅ |
| Commit Graph | ❌ | ✅ |
| Repository Insights | ❌ | ✅ |
| Performance | Optimized | Feature-rich |
| Memory Usage | Low | Higher |
| Setup | Simple | Complex |

Choose Gitlen Lite if you want essential blame functionality with minimal performance impact.

## 项目状态

### ✅ 已完成的功能
- **核心blame功能**: 只在光标所在行显示blame信息
- **实时更新**: 光标移动时立即切换显示
- **详细信息**: 包含作者、时间和commit message
- **交互功能**: Copy Hash、Diff比较等hover按钮
- **性能优化**: 缓存、debounce、懒加载
- **配置选项**: 日期格式、文件大小限制等
- **完整文档**: README、配置说明等

### 📁 项目结构
```
gitlen-lite/
├── src/
│   ├── extension.ts           # 主入口
│   ├── gitBlameProvider.ts    # Git操作
│   ├── blameDecorationManager.ts # UI装饰
│   ├── hoverProvider.ts       # Hover卡片
│   └── diffProvider.ts        # Diff比较
├── openspec/                  # 规格文档
├── README.md                  # 使用说明
├── package.json              # 依赖配置
└── tsconfig.json             # TypeScript配置
```

## 下一步

现在你可以：
1. **继续开发**: 添加更多功能或修复bug
2. **发布扩展**: 打包成VSIX文件发布到市场
3. **分享项目**: 推送到GitHub等代码托管平台

项目已经是一个完整可用的VS Code扩展了！🎉