import { checkCursorAgent, analyzeCodebase, parseRawOutput } from './analyzer';
import {
  getRulesDirectory,
  writeRules,
  readExistingRules,
} from './rules-manager';
import {
  GenerateRulesConfig,
  RulesManagerResult,
  CursorAgentCheck,
  AnalysisResult,
} from './types';

/**
 * Main function to generate cursor rules
 */
export async function generateRules(
  config: GenerateRulesConfig = {}
): Promise<RulesManagerResult> {
  const {
    outputDir,
    verbose = false,
    dryRun = false,
    cwd = process.cwd(),
  } = config;

  try {
    // Check if cursor-agent is installed
    const agentCheck = await checkCursorAgent();
    if (!agentCheck.installed) {
      return {
        success: false,
        created: [],
        updated: [],
        unchanged: [],
        error: 'cursor-agent is not installed or not accessible in PATH',
      };
    }

    if (verbose) {
      console.log(`Using cursor-agent: ${agentCheck.version}`);
    }

    // Analyze the codebase
    const analysisResult = await analyzeCodebase({ verbose });

    if (!analysisResult.success) {
      // Try to parse raw output as fallback
      if (analysisResult.rawOutput) {
        if (verbose) {
          console.log('Attempting to parse raw output...');
        }
        const parsedData = parseRawOutput(analysisResult.rawOutput);
        if (parsedData) {
          analysisResult.data = parsedData;
          analysisResult.success = true;
        }
      }

      if (!analysisResult.success) {
        return {
          success: false,
          created: [],
          updated: [],
          unchanged: [],
          error: analysisResult.error || 'Analysis failed',
        };
      }
    }

    if (!analysisResult.data) {
      return {
        success: false,
        created: [],
        updated: [],
        unchanged: [],
        error: 'No analysis data returned',
      };
    }

    // Determine output directory
    const rulesDir = outputDir || getRulesDirectory(cwd);

    if (verbose) {
      console.log(`Output directory: ${rulesDir}`);
    }

    // Write the rules
    const writeResult = writeRules(
      analysisResult.data,
      rulesDir,
      dryRun,
      verbose
    );

    return writeResult;
  } catch (error) {
    return {
      success: false,
      created: [],
      updated: [],
      unchanged: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Check if cursor-agent is installed
 */
export async function checkAgent(): Promise<CursorAgentCheck> {
  return checkCursorAgent();
}

/**
 * Analyze codebase without writing rules
 */
export async function analyze(
  verbose: boolean = false
): Promise<AnalysisResult> {
  return analyzeCodebase({ verbose });
}

/**
 * Get existing rules from a directory
 */
export function getExistingRules(cwd?: string) {
  const rulesDir = getRulesDirectory(cwd);
  return readExistingRules(rulesDir);
}

// Export types for consumers
export * from './types';

