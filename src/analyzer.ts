import { spawn } from 'child_process';
import {
  CursorAgentCheck,
  AnalysisResult,
  AnalysisData,
  AnalyzeOptions,
} from './types';

/**
 * Check if cursor-agent is installed and accessible
 */
export async function checkCursorAgent(): Promise<CursorAgentCheck> {
  return new Promise((resolve) => {
    const process = spawn('cursor-agent', ['--version']);
    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    process.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0 && output.trim()) {
        resolve({
          installed: true,
          version: output.trim(),
        });
      } else {
        resolve({
          installed: false,
          error: errorOutput || 'cursor-agent command not found',
        });
      }
    });

    process.on('error', (err) => {
      resolve({
        installed: false,
        error: err.message,
      });
    });
  });
}

/**
 * Comprehensive analysis prompt for cursor-agent
 */
function createAnalysisPrompt(existingRules?: string): string {
  let prompt = `Analyze this entire codebase thoroughly and provide comprehensive coding rules and guidelines.`;
  
  if (existingRules) {
    prompt += `

EXISTING RULES:
The following rules already exist for this codebase. Review them and:
1. Keep rules that are still valid based on current code
2. Update rules that need changes based on code evolution
3. Remove rules that no longer apply
4. Add new rules for patterns you discover

${existingRules}

Your analysis should be an intelligent diff - preserve what's still accurate, update what changed, remove what's obsolete, add what's new.
`;
  }
  
  prompt += ` 

DO NOT WRITE ANY CODE OR MODIFY ANY FILES. Only analyze and provide insights.

Please analyze the following aspects:

1. **Code Patterns & Style Conventions**
   - Indentation style (tabs/spaces, size)
   - Naming conventions (camelCase, PascalCase, snake_case, etc.)
   - Code organization patterns
   - Comment styles and documentation patterns

2. **Frameworks & Libraries**
   - Identify all frameworks and libraries in use
   - Best practices specific to these frameworks
   - Common patterns used with these frameworks
   - Configuration conventions

3. **Project Structure**
   - Directory organization patterns
   - File naming conventions
   - Module structure
   - Import/export patterns

4. **Coding Conventions**
   - Error handling patterns
   - Async/await vs promises usage
   - Function/method organization
   - Type usage (if TypeScript)
   - Testing patterns

5. **Best Practices**
   - Security considerations
   - Performance patterns
   - Code reusability patterns
   - DRY principle applications

Output your analysis as a structured JSON object with this format:
{
  "codePatterns": {
    "title": "Code Patterns & Style",
    "description": "Brief description",
    "globs": ["**/*.ts", "**/*.js"],
    "alwaysApply": false,
    "ruleType": "auto-attached",
    "rules": [
      {
        "name": "Rule name",
        "description": "Detailed description of the rule",
        "examples": ["example 1", "example 2"]
      }
    ]
  },
  "frameworks": {
    "title": "Frameworks & Libraries",
    "description": "Brief description",
    "globs": ["**/*"],
    "alwaysApply": true,
    "ruleType": "always",
    "rules": [...]
  },
  "structure": {
    "title": "Project Structure",
    "description": "Brief description",
    "globs": [],
    "alwaysApply": false,
    "ruleType": "agent-requested",
    "rules": [...]
  },
  "conventions": {
    "title": "Coding Conventions",
    "description": "Brief description",
    "globs": [],
    "alwaysApply": true,
    "ruleType": "always",
    "rules": [...]
  },
  "bestPractices": {
    "title": "Best Practices",
    "description": "Brief description",
    "globs": [],
    "alwaysApply": true,
    "ruleType": "always",
    "rules": [...]
  }
}

Rule types:
- "always": Always included in model context
- "auto-attached": Included when files matching glob patterns are referenced
- "agent-requested": Available to AI, which decides whether to include it
- "manual": Only included when explicitly mentioned

Set globs to appropriate file patterns when using "auto-attached" type.

Be specific and provide actionable rules based on the actual code in this repository.

Only update the specific rule if any code pattern, framework, structure, or convention is changed.`;
  
  return prompt;
}

/**
 * Analyze the codebase using cursor-agent
 */
export async function analyzeCodebase(
  options: AnalyzeOptions = {}
): Promise<AnalysisResult> {
  const { timeout = 300000, verbose = false, existingRules } = options; // 5 minute default timeout

  return new Promise((resolve) => {
    const prompt = createAnalysisPrompt(existingRules);
    const args = ['chat', prompt, '-p', '--output-format', 'json'];

    if (verbose) {
      console.log('Executing cursor-agent with prompt...');
      console.log('Command:', 'cursor-agent', args.join(' '));
    }

    const childProcess = spawn('cursor-agent', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env, // Inherit all environment variables (includes CURSOR_API_KEY)
        PATH: process.env.PATH || '', // Ensure PATH is available
      },
    });

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;
      if (verbose) {
        process.stdout.write(chunk);
      }
    });

    childProcess.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      if (verbose) {
        process.stderr.write(chunk);
      }
    });

    // Set timeout
    const timeoutId = setTimeout(() => {
      childProcess.kill();
      resolve({
        success: false,
        error: `Analysis timeout after ${timeout / 1000} seconds`,
        rawOutput: stdout,
      });
    }, timeout);

    childProcess.on('close', (code) => {
      clearTimeout(timeoutId);

      if (code !== 0) {
        resolve({
          success: false,
          error: `cursor-agent exited with code ${code}: ${stderr}`,
          rawOutput: stdout,
        });
        return;
      }

      // Try to parse the output as JSON
      try {
        // cursor-agent may include additional text, so we need to extract JSON
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          resolve({
            success: false,
            error: 'No JSON found in cursor-agent output',
            rawOutput: stdout,
          });
          return;
        }

        let parsed = JSON.parse(jsonMatch[0]) as unknown;
        
        // cursor-agent wraps the result in a response object with 'result' field
        // Extract the actual analysis data from the wrapper
        if (typeof parsed === 'object' && parsed !== null && 'result' in parsed) {
          const wrapper = parsed as { result: unknown };
          if (typeof wrapper.result === 'string') {
            // The result is a JSON string inside the wrapper, parse it
            const resultMatch = wrapper.result.match(/\{[\s\S]*\}/);
            if (resultMatch) {
              parsed = JSON.parse(resultMatch[0]) as unknown;
            }
          }
        }
        
        const data = parsed as AnalysisData;
        resolve({
          success: true,
          data,
          rawOutput: stdout,
        });
      } catch (parseError) {
        resolve({
          success: false,
          error: `Failed to parse cursor-agent output as JSON: ${
            parseError instanceof Error ? parseError.message : 'Unknown error'
          }`,
          rawOutput: stdout,
        });
      }
    });

    childProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        error: `Failed to execute cursor-agent: ${err.message}`,
      });
    });
  });
}

/**
 * Parse raw text output into structured data (fallback if JSON parsing fails)
 */
export function parseRawOutput(rawOutput: string): AnalysisData | null {
  // This is a fallback parser for when cursor-agent doesn't return JSON
  // We can implement more sophisticated parsing here if needed
  
  // For now, create a simple structure
  const data: AnalysisData = {
    codePatterns: {
      title: 'Code Patterns & Style',
      description: 'Extracted from raw output',
      rules: [],
    },
    frameworks: {
      title: 'Frameworks & Libraries',
      description: 'Extracted from raw output',
      rules: [],
    },
    structure: {
      title: 'Project Structure',
      description: 'Extracted from raw output',
      rules: [],
    },
    conventions: {
      title: 'Coding Conventions',
      description: 'Extracted from raw output',
      rules: [],
    },
    bestPractices: {
      title: 'Best Practices',
      description: 'Extracted from raw output',
      rules: [],
    },
  };

  // Add the raw output as a single rule
  if (data.codePatterns) {
    data.codePatterns.rules.push({
      name: 'Analysis Output',
      description: rawOutput,
    });
  }

  return data;
}

