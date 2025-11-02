/**
 * Configuration options for generating cursor rules
 */
export interface GenerateRulesConfig {
  outputDir?: string;
  verbose?: boolean;
  dryRun?: boolean;
  cwd?: string;
}

/**
 * Result from cursor-agent analysis
 */
export interface AnalysisResult {
  success: boolean;
  data?: AnalysisData;
  error?: string;
  rawOutput?: string;
}

/**
 * Structured data from analysis
 */
export interface AnalysisData {
  codePatterns?: RuleCategory;
  frameworks?: RuleCategory;
  structure?: RuleCategory;
  conventions?: RuleCategory;
  bestPractices?: RuleCategory;
  [key: string]: RuleCategory | undefined;
}

/**
 * A category of rules
 */
export interface RuleCategory {
  title: string;
  description?: string;
  rules: Rule[];
  globs?: string[];
  alwaysApply?: boolean;
  ruleType?: 'always' | 'auto-attached' | 'agent-requested' | 'manual';
}

/**
 * A single rule
 */
export interface Rule {
  name: string;
  description: string;
  examples?: string[];
  category?: string;
}

/**
 * Result of rules management operations
 */
export interface RulesManagerResult {
  success: boolean;
  created: string[];
  updated: string[];
  unchanged: string[];
  error?: string;
}

/**
 * Existing rule file information
 */
export interface ExistingRuleFile {
  filename: string;
  path: string;
  content: string;
}

/**
 * Cursor agent check result
 */
export interface CursorAgentCheck {
  installed: boolean;
  version?: string;
  error?: string;
}

/**
 * Options for analyzing the codebase
 */
export interface AnalyzeOptions {
  timeout?: number;
  verbose?: boolean;
}

