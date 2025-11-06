# Agent Instructions for auto-cursor-rules

This document provides context and guidelines for AI coding agents working on the `auto-cursor-rules` project.

## Project Overview

`auto-cursor-rules` is an npm package that automatically generates Cursor IDE rules by analyzing codebases using the `cursor-agent` CLI. It's built in TypeScript and designed to work both as a CLI tool and as a postinstall script.

## Architecture

### Core Components

1. **analyzer.ts** - Cursor-agent integration
   - Checks if cursor-agent is installed
   - Spawns cursor-agent as child process
   - Parses JSON output from cursor-agent
   - Handles context-aware analysis (passes existing rules to cursor-agent)

2. **rules-manager.ts** - File system operations
   - Reads existing rules from `.cursor/rules/`
   - Converts analysis data to `.mdc` format (Cursor's rule format)
   - Writes/updates rule files
   - Cleans up obsolete rule files

3. **cli.ts** - Command-line interface
   - Uses Commander.js for CLI
   - Uses Chalk for colored output
   - Handles user interaction and error messages

4. **index.ts** - Main API entry point
   - Orchestrates the rule generation process
   - Exports public API for programmatic use

5. **types.ts** - TypeScript type definitions
   - Centralized type definitions for all modules

### Key Concepts

#### Context-Aware Analysis
The tool reads existing rules and passes them to cursor-agent, enabling intelligent diff-based updates:
- Keeps rules that are still valid
- Updates rules that need changes
- Removes rules that no longer apply
- Adds new rules for newly discovered patterns

#### Cursor Rules Format (.mdc)
Rules are generated in Cursor's `.mdc` format with frontmatter:
```markdown
---
description: Brief description
globs: ["**/*.ts", "**/*.js"]
alwaysApply: false
---

- **Rule Name**: Rule description
  - Example 1
  - Example 2
```

#### Rule Types
- `always`: Always included in model context
- `auto-attached`: Included when files matching glob patterns are referenced
- `agent-requested`: Available to AI, which decides whether to include it
- `manual`: Only included when explicitly mentioned

## Development Guidelines

### Code Style

1. **TypeScript Strictness**
   - Use strict TypeScript mode
   - No `any` types allowed (use `unknown` if type is truly unknown)
   - Explicit return types on all exported functions
   - Proper type annotations for callbacks

2. **Error Handling**
   - Always check `error instanceof Error` before accessing `.message`
   - Return result objects with `success: boolean` and optional `error: string`
   - Use try-catch blocks in async functions
   - Provide helpful, actionable error messages

3. **Async Patterns**
   - Always use async/await, never Promise chains
   - Wrap callback-based APIs in Promise constructors
   - Handle timeouts appropriately (default 5 minutes for cursor-agent)

4. **Security**
   - Never hardcode API keys or credentials
   - Always use environment variables for sensitive data
   - Inherit environment variables when spawning processes
   - Never pass sensitive data as command-line arguments
   - Use `spawn` for external commands, not `eval` or `exec`

5. **File Operations**
   - Use synchronous file operations for CLI tools when appropriate
   - Check file existence before reading
   - Use recursive directory creation
   - Normalize paths for comparison

### Module Organization

- **analyzer.ts**: All cursor-agent interaction logic
- **rules-manager.ts**: All file system operations for rules
- **cli.ts**: CLI interface and user interaction
- **index.ts**: Public API and orchestration
- **types.ts**: Shared type definitions

### Testing Approach

When making changes:
1. Run `yarn lint` to check for linting issues
2. Run `yarn type-check` to verify TypeScript types
3. Run `yarn build` to ensure compilation succeeds
4. Test CLI locally with `yarn link` before publishing

## Common Tasks

### Adding a New Rule Category

1. Update the analysis prompt in `analyzer.ts` to request the new category
2. Add the category to the `AnalysisData` interface in `types.ts`
3. The rest is handled automatically by the existing code

### Modifying Rule Format

1. Update `convertToMDC()` in `rules-manager.ts`
2. Update the `RuleCategory` interface in `types.ts` if metadata changes
3. Update the analysis prompt in `analyzer.ts` to request new metadata

### Improving cursor-agent Integration

1. Modify `analyzeCodebase()` in `analyzer.ts`
2. Update the prompt in `createAnalysisPrompt()`
3. Adjust JSON parsing logic if output format changes

## GitHub Actions Workflows

### auto-cursor-rules.yml
- Triggers on pull requests (when src/, lib/, package.json change)
- Installs cursor-agent and auto-cursor-rules from source
- Generates rules and commits them to the PR branch
- Requires `CURSOR_API_KEY` in repository secrets

### lint.yml
- Triggers on pull requests and pushes to main
- Runs ESLint and TypeScript type checking
- Ensures code quality standards

## Dependencies

### Runtime Dependencies
- `chalk@^4.1.2` - Terminal colors (v4 for CommonJS compatibility)
- `commander@^11.1.0` - CLI framework

### Dev Dependencies
- `typescript@^5.3.3` - TypeScript compiler
- `@types/node@^20.10.6` - Node.js type definitions
- `eslint@^8.56.0` - Linting
- `@typescript-eslint/*` - TypeScript ESLint plugins

### External Dependencies
- `cursor-agent` - Must be installed separately by users
- Node.js >= 16.0.0

## Important Notes for Agents

1. **Never create .md documentation files** unless explicitly requested by the user
2. **Never add emojis** to code or documentation unless explicitly requested
3. **Always preserve security patterns** - environment variables for secrets, proper process spawning
4. **Maintain backward compatibility** - this is a published package
5. **Follow existing patterns** - result objects, error handling, async/await
6. **Test changes thoroughly** - this tool modifies user files
7. **Keep code simple and maintainable** - avoid over-engineering

## Troubleshooting

### cursor-agent not found
- Check if cursor-agent is in PATH
- Provide installation instructions in error message

### JSON parsing fails
- cursor-agent may wrap output in a `result` field
- Fallback parser handles malformed JSON
- Log raw output in verbose mode for debugging

### Rules not updating
- Check if content actually changed (normalized comparison)
- Verify cursor-agent received existing rules as context
- Check if cleanup logic removed files incorrectly

## Future Considerations

- Add support for custom rule templates
- Implement rule validation
- Add support for multiple rule directories
- Consider adding a configuration file (`.auto-cursor-rules.json`)
- Add unit tests for core functionality
- Consider publishing to npm registry

## Resources

- [Cursor CLI Documentation](https://cursor.com/docs/cli/overview)
- [Cursor Rules Format](https://cursor.com/docs/rules)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

