#!/usr/bin/env tsx
/**
 * Combined image cleanup script
 * 
 * This script runs both orphaned image cleanup and temp image cleanup.
 * It's a convenience script for running all cleanup operations at once.
 * 
 * Usage: npx tsx scripts/cleanup-images.ts
 */

import { execSync } from 'child_process';
import * as path from 'path';

console.log('╔═══════════════════════════════════════╗');
console.log('║   IMAGE CLEANUP SCRIPT (COMBINED)     ║');
console.log('╚═══════════════════════════════════════╝\n');

let exitCode = 0;

try {
  console.log('Running orphaned images cleanup...\n');
  execSync('npx tsx scripts/cleanup-orphaned-images.ts', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
} catch (error) {
  console.error('\n⚠️  Orphaned images cleanup failed\n');
  exitCode = 1;
}

console.log('\n' + '─'.repeat(43) + '\n');

try {
  console.log('Running temp images cleanup...\n');
  execSync('npx tsx scripts/cleanup-temp-images.ts', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
} catch (error) {
  console.error('\n⚠️  Temp images cleanup failed\n');
  exitCode = 1;
}

console.log('\n' + '═'.repeat(43));
if (exitCode === 0) {
  console.log('✅ All cleanup operations completed!');
} else {
  console.log('⚠️  Some cleanup operations failed. Check logs above.');
}
console.log('═'.repeat(43) + '\n');

process.exit(exitCode);
