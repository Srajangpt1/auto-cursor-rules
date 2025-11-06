#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { generateRules } from './index';
import { checkCursorAgent } from './analyzer';
import { GenerateRulesConfig } from './types';

const program = new Command();

program
  .name('agent-rule-sync')
  .description('Automatically generate Cursor IDE rules by analyzing your codebase')
  .version('0.1.0');

program
  .option('-o, --output <path>', 'Output directory for rules (default: .cursor/rules)')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('-d, --dry-run', 'Show what would be done without writing files', false)
  .option('--cwd <path>', 'Working directory (default: current directory)')
  .action(async (options: { output?: string; verbose: boolean; dryRun: boolean; cwd?: string }) => {
    console.log(chalk.bold.cyan('\nAgent Rule Sync\n'));

    // Check if cursor-agent is installed
    console.log(chalk.gray('Checking for cursor-agent...'));
    const agentCheck = await checkCursorAgent();

    if (!agentCheck.installed) {
      console.error(chalk.red('\nError: cursor-agent is not installed or not in PATH'));
      console.log(chalk.yellow('\nTo install cursor-agent, run:'));
      console.log(chalk.white('  curl https://cursor.com/install -fsS | bash\n'));
      console.log(chalk.gray('Then make sure ~/.local/bin is in your PATH\n'));
      process.exit(1);
    }

    console.log(chalk.green(`Found cursor-agent: ${agentCheck.version}\n`));

    // Prepare configuration
    const config: GenerateRulesConfig = {
      outputDir: options.output,
      verbose: options.verbose,
      dryRun: options.dryRun,
      cwd: options.cwd,
    };

    if (config.dryRun) {
      console.log(chalk.yellow('DRY RUN MODE: No files will be written\n'));
    }

    // Generate rules
    try {
      console.log(chalk.gray('Analyzing codebase with cursor-agent...'));
      console.log(chalk.gray('This may take a few minutes...\n'));

      const result = await generateRules(config);

      if (result.success) {
        console.log(chalk.green.bold('\nSuccess!\n'));

        if (result.created.length > 0) {
          console.log(chalk.cyan('Created files:'));
          result.created.forEach((file) => console.log(chalk.white(`  + ${file}`)));
        }

        if (result.updated.length > 0) {
          console.log(chalk.yellow('\nUpdated files:'));
          result.updated.forEach((file) => console.log(chalk.white(`  ~ ${file}`)));
        }

        if (result.unchanged.length > 0 && config.verbose) {
          console.log(chalk.gray('\nUnchanged files:'));
          result.unchanged.forEach((file) => console.log(chalk.gray(`  = ${file}`)));
        }

        const outputDir = config.outputDir || '.cursor/rules';
        console.log(chalk.green(`\nRules have been written to: ${outputDir}`));
        console.log(
          chalk.gray(
            '\nThese rules will be automatically loaded by cursor-agent in this project.\n'
          )
        );
      } else {
        console.error(chalk.red.bold('\nFailed to generate rules\n'));
        if (result.error) {
          console.error(chalk.red(`Error: ${result.error}\n`));
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red.bold('\nUnexpected error occurred\n'));
      console.error(
        chalk.red(error instanceof Error ? error.message : String(error))
      );
      if (config.verbose && error instanceof Error && error.stack) {
        console.error(chalk.gray('\nStack trace:'));
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

program
  .command('check')
  .description('Check if cursor-agent is installed and accessible')
  .action(async () => {
    console.log(chalk.gray('Checking for cursor-agent...\n'));

    const agentCheck = await checkCursorAgent();

    if (agentCheck.installed) {
      console.log(chalk.green('cursor-agent is installed'));
      console.log(chalk.white(`Version: ${agentCheck.version}\n`));
    } else {
      console.log(chalk.red('cursor-agent is NOT installed or not in PATH'));
      if (agentCheck.error) {
        console.log(chalk.gray(`Error: ${agentCheck.error}\n`));
      }
      console.log(chalk.yellow('To install cursor-agent, run:'));
      console.log(chalk.white('  curl https://cursor.com/install -fsS | bash\n'));
      process.exit(1);
    }
  });

program.parse();

