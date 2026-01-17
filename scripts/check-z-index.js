#!/usr/bin/env node
/**
 * Z-Index Architecture Compliance Check
 * 
 * Ensures no arbitrary z-index values (z-[...]) are used in the codebase.
 * Only allows values from the architecture scale:
 * - L0: z-0 to z-10
 * - L1: z-20
 * - L2: z-40
 * - L3: z-50
 * - L4: z-60
 * - L5: z-70, z-80, z-90, z-100
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to search for
const ARBITRARY_Z_INDEX_PATTERN = /z-\[/g;
const NEGATIVE_ARBITRARY_Z_INDEX_PATTERN = /-z-\[/g;

// Files/directories to ignore
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /out/,
  /build/,
  /\.git/,
  /docs\/ARCHITECTURE_RULES\.md/, // Exception: documentation file
  /scripts\/check-z-index\.js/, // Exception: this script itself
  /package-lock\.json/,
  /yarn\.lock/,
  /pnpm-lock\.yaml/,
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

function findFiles(dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (shouldIgnore(filePath)) {
      return;
    }

    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.some(ext => filePath.endsWith(ext))) {
      results.push(filePath);
    }
  });

  return results;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const arbitraryMatch = line.match(ARBITRARY_Z_INDEX_PATTERN);
    const negativeMatch = line.match(NEGATIVE_ARBITRARY_Z_INDEX_PATTERN);

    if (arbitraryMatch) {
      violations.push({
        line: lineNum,
        column: line.indexOf(arbitraryMatch[0]) + 1,
        pattern: arbitraryMatch[0],
        context: line.trim().substring(0, 100),
      });
    }

    if (negativeMatch) {
      violations.push({
        line: lineNum,
        column: line.indexOf(negativeMatch[0]) + 1,
        pattern: negativeMatch[0],
        context: line.trim().substring(0, 100),
      });
    }
  });

  return violations;
}

// Main execution
console.log('🔍 Checking for arbitrary z-index usage (z-[...])...\n');

const projectRoot = path.resolve(__dirname, '..');
const files = findFiles(projectRoot);
let totalViolations = 0;
const violationsByFile = {};

files.forEach(file => {
  const violations = checkFile(file);
  if (violations.length > 0) {
    violationsByFile[file] = violations;
    totalViolations += violations.length;
  }
});

if (totalViolations > 0) {
  console.error('❌ Found arbitrary z-index usage:\n');
  
  Object.entries(violationsByFile).forEach(([file, violations]) => {
    const relativePath = path.relative(projectRoot, file);
    console.error(`  ${relativePath}:`);
    violations.forEach(({ line, column, pattern, context }) => {
      console.error(`    Line ${line}:${column} - ${pattern}`);
      console.error(`      ${context}`);
    });
    console.error('');
  });

  console.error('💡 Use only allowed z-index scale values:');
  console.error('   L0 (Base Content): z-0 to z-10');
  console.error('   L1 (Interactive): z-20');
  console.error('   L2 (Backdrops): z-40');
  console.error('   L3 (Sidebar): z-50');
  console.error('   L4 (Header): z-60');
  console.error('   L5 (Modals): z-70, z-80, z-90, z-100\n');
  
  process.exit(1);
} else {
  console.log('✅ No arbitrary z-index usage found.');
  console.log('   All z-index values conform to architecture scale.\n');
  process.exit(0);
}
