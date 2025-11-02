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

### As a Project Dependency

**Using npm:**
```bash
npm install auto-cursor-rules --save-dev
```

**Using yarn:**
```bash
yarn add auto-cursor-rules --dev
```

### Global Installation

**Using npm:**
```bash
npm install -g auto-cursor-rules
```

**Using yarn:**
```bash
yarn global add auto-cursor-rules
```

### Use with npx

```bash
npx auto-cursor-rules
```

## Usage

### CLI Usage

Generate rules for your current project:

```bash
auto-cursor-rules
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

#### Examples

```bash
# Generate rules with verbose output
auto-cursor-rules --verbose

# Dry run to see what would be created
auto-cursor-rules --dry-run

# Custom output directory
auto-cursor-rules --output ./.cursor-rules

# Check if cursor-agent is installed
auto-cursor-rules check
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

### Programmatic Usage

```typescript
import { generateRules, checkAgent, analyze } from 'auto-cursor-rules';

// Generate rules programmatically
const result = await generateRules({
  outputDir: '.cursor/rules',
  verbose: true,
  dryRun: false,
  cwd: process.cwd(),
});

if (result.success) {
  console.log('Created:', result.created);
  console.log('Updated:', result.updated);
  console.log('Unchanged:', result.unchanged);
} else {
  console.error('Error:', result.error);
}

// Check if cursor-agent is installed
const agentCheck = await checkAgent();
console.log('Installed:', agentCheck.installed);
console.log('Version:', agentCheck.version);

// Analyze without writing rules
const analysisResult = await analyze(true);
if (analysisResult.success) {
  console.log('Analysis data:', analysisResult.data);
}
```

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

**Using npm:**
```bash
# Clone the repository
git clone https://github.com/yourusername/auto-cursor-rules.git
cd auto-cursor-rules

# Install dependencies
npm install

# Build
npm run build

# Test locally
npm link
auto-cursor-rules --help
```

**Using yarn:**
```bash
# Clone the repository
git clone https://github.com/yourusername/auto-cursor-rules.git
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

## Related Projects

- [Cursor IDE](https://cursor.com) - The AI-first code editor
- [cursor-agent](https://cursor.com/docs/cli/overview) - Cursor's CLI agent

## Support

- Documentation: https://github.com/yourusername/auto-cursor-rules
- Issues: https://github.com/yourusername/auto-cursor-rules/issues
- Cursor Docs: https://cursor.com/docs/cli/overview

---

Made with ❤️ for the Cursor community

