# Auto Cursor Rules

Automatically generate [Cursor IDE](https://cursor.com) rules by analyzing your codebase using the cursor-agent CLI. This tool intelligently examines your project's code patterns, frameworks, structure, and conventions to create comprehensive, project-specific rules that enhance Cursor's AI assistance.

## Features

- **Intelligent Analysis**: Uses cursor-agent to deeply analyze your codebase
- **Comprehensive Rules**: Generates rules for code patterns, frameworks, structure, conventions, and best practices
- **Smart Updates**: Compares existing rules and only updates what's changed
- **Multiple Usage Modes**: CLI tool, postinstall script, or programmatic API
- **Flexible Configuration**: Customize output directory, verbosity, and more

## Prerequisites

You must have [cursor-agent](https://cursor.com/docs/cli/overview) installed:

```bash
curl https://cursor.com/install -fsS | bash
```

Make sure `~/.local/bin` is in your PATH. Verify installation:

```bash
cursor-agent --version
```

## Installation

### Option 1: Run with npx (once published)

```bash
npx auto-cursor-rules
```

### Option 2: Install from GitHub (recommended for now)

```bash
# Clone and build
git clone https://github.com/Srajangpt1/auto-cursor-rules.git
cd auto-cursor-rules
yarn install
yarn build
yarn link

# Then in your project
cd /path/to/your/project
yarn link auto-cursor-rules
```

### Option 3: As a Project Dependency (once published)

```bash
yarn add auto-cursor-rules --dev
```

## Usage

### CLI Usage

Generate rules for your current project:

```bash
# If installed locally
auto-cursor-rules

# Or use npx without installation
npx auto-cursor-rules
```

#### CLI Options

```bash
auto-cursor-rules [options]

Options:
  -o, --output <path>   Output directory for rules (default: .cursor/rules)
  -v, --verbose         Enable verbose logging
  -d, --dry-run         Show what would be done without writing files
  --cwd <path>          Working directory (default: current directory)
  -h, --help            Display help information
  -V, --version         Display version number

Commands:
  check                 Check if cursor-agent is installed and accessible
```

### As a Postinstall Script

Add to your `package.json`:

```json
{
  "scripts": {
    "postinstall": "auto-cursor-rules"
  },
  "devDependencies": {
    "auto-cursor-rules": "^0.1.0"
  }
}
```

Now rules will be automatically generated/updated whenever dependencies are installed.

## How It Works

1. **Checks cursor-agent**: Verifies that cursor-agent is installed and accessible
2. **Analyzes Codebase**: Uses cursor-agent's AI to analyze:
   - Code patterns and style conventions
   - Frameworks and libraries in use
   - Project structure and organization
   - Naming conventions
   - Best practices and common patterns
3. **Generates Rules**: Creates structured markdown files with categorized rules
4. **Smart Merging**: Compares with existing rules and only updates what's necessary
5. **Writes to `.cursor/rules`**: Rules are automatically loaded by cursor-agent

## Generated Files

The tool creates files in `.cursor/rules/` using **Cursor's MDC format** (`.mdc` files):

- `README.md` - Summary of all rule categories
- `code-patterns.mdc` - Code style and pattern rules (auto-attached via globs)
- `frameworks.mdc` - Framework-specific guidelines (always applied)
- `structure.mdc` - Project structure conventions (agent-requested)
- `conventions.mdc` - Coding conventions (always applied)
- `best-practices.mdc` - Best practices for the project (always applied)

Each `.mdc` file follows Cursor's rule format with frontmatter metadata:

```markdown
---
description: RPC Service boilerplate
globs: ["**/*.ts", "services/**/*.js"]
alwaysApply: false
---

- **Rule name**: Description of the rule
  - Example usage
```

### Rule Types

- **Always** (`alwaysApply: true`) - Always included in model context
- **Auto Attached** (with `globs`) - Included when files matching glob patterns are referenced
- **Agent Requested** - Available to AI, which decides whether to include it
- **Manual** - Only included when explicitly mentioned using `@ruleName`

## Configuration

### TypeScript Types

```typescript
interface GenerateRulesConfig {
  outputDir?: string;      // Default: '.cursor/rules'
  verbose?: boolean;       // Default: false
  dryRun?: boolean;        // Default: false
  cwd?: string;           // Default: process.cwd()
}
```

## Troubleshooting

### cursor-agent not found

**Error**: `cursor-agent is not installed or not in PATH`

**Solution**: Install cursor-agent:
```bash
curl https://cursor.com/install -fsS | bash
```

Then add to your PATH (add to `~/.zshrc` or `~/.bashrc`):
```bash
export PATH="$HOME/.local/bin:$PATH"
```

### Authentication errors

**Error**: `Authentication required` or `Invalid API key`

**Solution**: cursor-agent requires authentication. There are two methods:

**For Local Development**:
```bash
cursor-agent login
```

**For CI/CD / Automation**:
1. Generate API key from [Cursor Dashboard](https://cursor.com) → Settings → Integrations → User API Keys
2. Set environment variable:
```bash
export CURSOR_API_KEY=your_api_key_here
```

**⚠️ Security Note**: Always use environment variables for API keys. Never pass them as command-line arguments (e.g., `--api-key`), as they would be visible in process lists, shell history, and logs.

For GitHub Actions, add `CURSOR_API_KEY` to your repository secrets.

### Analysis timeout

**Error**: `Analysis timeout after 300 seconds`

**Solution**: The analysis takes time for large codebases. This is normal. The timeout is set to 5 minutes by default. For very large projects, cursor-agent may need more time.

### JSON parsing failed

**Error**: `Failed to parse cursor-agent output as JSON`

**Solution**: The tool has a fallback parser that will attempt to create rules from the raw output. If this happens frequently, please report it as an issue.

### Permission errors

**Error**: `EACCES: permission denied`

**Solution**: Ensure you have write permissions to the output directory. Try running with appropriate permissions or choose a different output directory.

## Development

### Building from Source


```bash
# Clone the repository
git clone https://github.com/Srajangpt1/auto-cursor-rules.git
cd auto-cursor-rules

# Install dependencies
yarn install

# Build
yarn build

# Test locally
yarn link
auto-cursor-rules --help
```

### Project Structure

```
auto-cursor-rules/
├── src/
│   ├── types.ts          # TypeScript type definitions
│   ├── analyzer.ts       # cursor-agent integration
│   ├── rules-manager.ts  # Rules file management
│   ├── cli.ts           # CLI interface
│   └── index.ts         # Main API entry point
├── dist/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- Documentation: https://github.com/Srajangpt1/auto-cursor-rules
- Issues: https://github.com/Srajangpt1/auto-cursor-rules/issues
- Cursor Docs: https://cursor.com/docs/cli/overview

---

Made with ❤️ FOR the Cursor community

