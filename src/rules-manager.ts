import * as fs from 'fs';
import * as path from 'path';
import {
  AnalysisData,
  RulesManagerResult,
  ExistingRuleFile,
  RuleCategory,
} from './types';

/**
 * Get the .cursor/rules directory path
 */
export function getRulesDirectory(cwd?: string): string {
  const baseDir = cwd || process.cwd();
  return path.join(baseDir, '.cursor', 'rules');
}

/**
 * Ensure the .cursor/rules directory exists
 */
export function ensureRulesDirectory(rulesDir: string): void {
  if (!fs.existsSync(rulesDir)) {
    fs.mkdirSync(rulesDir, { recursive: true });
  }
}

/**
 * Read all existing rule files from .cursor/rules directory
 */
export function readExistingRules(rulesDir: string): ExistingRuleFile[] {
  if (!fs.existsSync(rulesDir)) {
    return [];
  }

  const files = fs.readdirSync(rulesDir);
  const ruleFiles: ExistingRuleFile[] = [];

  for (const file of files) {
    // Support .mdc (Cursor format), .md (legacy), and .txt files
    if (file.endsWith('.mdc') || file.endsWith('.md') || file.endsWith('.txt')) {
      const filePath = path.join(rulesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      ruleFiles.push({
        filename: file,
        path: filePath,
        content,
      });
    }
  }

  return ruleFiles;
}

/**
 * Convert analysis data to MDC format (Cursor's rule format)
 */
export function convertToMDC(
  categoryName: string,
  category: RuleCategory
): string {
  // Generate frontmatter
  let mdc = `---\n`;
  mdc += `description: ${category.description || category.title}\n`;
  
  if (category.globs && category.globs.length > 0) {
    mdc += `globs: ${JSON.stringify(category.globs)}\n`;
  }
  
  // Determine alwaysApply based on rule type or category
  const alwaysApply = category.alwaysApply !== undefined 
    ? category.alwaysApply 
    : category.ruleType === 'always'
    ? true
    : (categoryName === 'bestPractices' || categoryName === 'conventions');
  
  mdc += `alwaysApply: ${alwaysApply}\n`;
  mdc += `---\n\n`;

  // Add rule content
  for (const rule of category.rules) {
    mdc += `- **${rule.name}**: ${rule.description}\n`;

    if (rule.examples && rule.examples.length > 0) {
      for (const example of rule.examples) {
        mdc += `  - ${example}\n`;
      }
    }
    mdc += `\n`;
  }

  return mdc;
}

/**
 * Check if a rule file needs updating based on content comparison
 */
export function needsUpdate(
  existingContent: string,
  newContent: string
): boolean {
  // Simple comparison - can be made more sophisticated
  const normalize = (s: string): string => s.trim().replace(/\s+/g, ' ');
  return normalize(existingContent) !== normalize(newContent);
}

/**
 * Generate a filename from category name (using .mdc for Cursor rules)
 */
export function generateFilename(categoryName: string): string {
  return `${categoryName.toLowerCase().replace(/\s+/g, '-')}.mdc`;
}

/**
 * Write rules to the .cursor/rules directory
 */
export function writeRules(
  analysisData: AnalysisData,
  rulesDir: string,
  dryRun: boolean = false,
  verbose: boolean = false
): RulesManagerResult {
  const result: RulesManagerResult = {
    success: true,
    created: [],
    updated: [],
    unchanged: [],
  };

  try {
    // Ensure directory exists
    if (!dryRun) {
      ensureRulesDirectory(rulesDir);
    }

    // Read existing rules
    const existingRules = readExistingRules(rulesDir);
    const existingFilenames = new Set(
      existingRules.map((r) => r.filename.toLowerCase())
    );

    // Process each category
    for (const [categoryName, category] of Object.entries(analysisData)) {
      if (!category || !category.rules || category.rules.length === 0) {
        continue;
      }

      const filename = generateFilename(categoryName);
      const filePath = path.join(rulesDir, filename);
      const mdc = convertToMDC(categoryName, category);

      // Check if file exists
      const existingFile = existingRules.find(
        (r) => r.filename.toLowerCase() === filename.toLowerCase()
      );

      if (existingFile) {
        // File exists, check if it needs updating
        if (needsUpdate(existingFile.content, mdc)) {
          if (verbose) {
            console.log(`Updating: ${filename}`);
          }
          if (!dryRun) {
            fs.writeFileSync(filePath, mdc, 'utf-8');
          }
          result.updated.push(filename);
        } else {
          if (verbose) {
            console.log(`Unchanged: ${filename}`);
          }
          result.unchanged.push(filename);
        }
      } else {
        // New file
        if (verbose) {
          console.log(`Creating: ${filename}`);
        }
        if (!dryRun) {
          fs.writeFileSync(filePath, mdc, 'utf-8');
        }
        result.created.push(filename);
      }
    }

    // Create a summary file
    const summaryFilename = 'README.md';
    const summaryPath = path.join(rulesDir, summaryFilename);
    const summary = createSummary(analysisData);

    if (!existingFilenames.has(summaryFilename.toLowerCase())) {
      if (verbose) {
        console.log(`Creating: ${summaryFilename}`);
      }
      if (!dryRun) {
        fs.writeFileSync(summaryPath, summary, 'utf-8');
      }
      result.created.push(summaryFilename);
    } else {
      const existingFile = existingRules.find(
        (r) => r.filename.toLowerCase() === summaryFilename.toLowerCase()
      );
      if (existingFile && needsUpdate(existingFile.content, summary)) {
        if (verbose) {
          console.log(`Updating: ${summaryFilename}`);
        }
        if (!dryRun) {
          fs.writeFileSync(summaryPath, summary, 'utf-8');
        }
        result.updated.push(summaryFilename);
      } else if (!result.unchanged.includes(summaryFilename)) {
        result.unchanged.push(summaryFilename);
      }
    }

    // Clean up old rule files that are no longer generated
    const keepFiles = [
      ...result.created,
      ...result.updated,
      ...result.unchanged,
    ];
    const removed = cleanupOldRules(rulesDir, keepFiles, dryRun, verbose);
    
    if (removed.length > 0 && verbose) {
      console.log(`Removed ${removed.length} old rule file(s)`);
    }

    return result;
  } catch (error) {
    return {
      success: false,
      created: [],
      updated: [],
      unchanged: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a summary README file
 */
export function createSummary(analysisData: AnalysisData): string {
  let summary = `# Cursor Rules - Auto Generated\n\n`;
  summary += `This directory contains automatically generated rules for this codebase.\n\n`;
  summary += `## Rule Categories\n\n`;

  for (const [categoryName, category] of Object.entries(analysisData)) {
    if (!category || !category.rules || category.rules.length === 0) {
      continue;
    }

    const filename = generateFilename(categoryName);
    summary += `- [${category.title}](./${filename}) - ${
      category.description || 'Rules for ' + category.title
    } (${category.rules.length} rules)\n`;
  }

  summary += `\n---\n\n`;
  summary += `Generated on: ${new Date().toISOString()}\n`;
  summary += `Generator: agent-rule-sync\n`;

  return summary;
}

/**
 * Clean up old/unused rule files
 */
export function cleanupOldRules(
  rulesDir: string,
  keepFiles: string[],
  dryRun: boolean = false,
  verbose: boolean = false
): string[] {
  const removed: string[] = [];

  if (!fs.existsSync(rulesDir)) {
    return removed;
  }

  const existingFiles = fs.readdirSync(rulesDir);
  const keepFilesSet = new Set(
    keepFiles.map((f) => f.toLowerCase())
  );

  for (const file of existingFiles) {
    if (!keepFilesSet.has(file.toLowerCase()) && 
        (file.endsWith('.mdc') || file.endsWith('.md') || file.endsWith('.txt'))) {
      if (verbose) {
        console.log(`Removing old file: ${file}`);
      }
      if (!dryRun) {
        fs.unlinkSync(path.join(rulesDir, file));
      }
      removed.push(file);
    }
  }

  return removed;
}

