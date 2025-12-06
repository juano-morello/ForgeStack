import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Convert a string to kebab-case
 * Example: "My SaaS App" -> "my-saas-app"
 */
export function toKebabCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Convert a string to PascalCase
 * Example: "my-saas-app" -> "MySaasApp"
 */
export function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert a string to camelCase
 * Example: "my-saas-app" -> "mySaasApp"
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Replace all occurrences in a file
 */
export async function replaceInFile(
  filePath: string,
  replacements: Map<string, string>,
): Promise<void> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;

    for (const [search, replace] of replacements.entries()) {
      if (content.includes(search)) {
        // Use a global regex to replace all occurrences
        const regex = new RegExp(escapeRegExp(search), 'g');
        content = content.replace(regex, replace);
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
    }
  } catch (error) {
    throw new Error(`Failed to replace in file ${filePath}: ${error}`);
  }
}

/**
 * Escape special regex characters
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find files matching glob patterns
 */
export async function findFiles(patterns: string[]): Promise<string[]> {
  const allFiles: string[] = [];

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/coverage/**'],
      nodir: true,
    });
    allFiles.push(...files);
  }

  // Remove duplicates
  return [...new Set(allFiles)];
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read JSON file
 */
export async function readJsonFile<T = any>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Write JSON file with formatting
 */
export async function writeJsonFile(filePath: string, data: any): Promise<void> {
  const content = JSON.stringify(data, null, 2) + '\n';
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Create a backup of a file
 */
export async function backupFile(filePath: string): Promise<string> {
  const backupPath = `${filePath}.backup`;
  await fs.copyFile(filePath, backupPath);
  return backupPath;
}

/**
 * Validate project name (kebab-case, alphanumeric + hyphens)
 */
export function validateProjectName(name: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}

/**
 * Validate npm scope (starts with @, alphanumeric + hyphens)
 */
export function validateNpmScope(scope: string): boolean {
  return /^@[a-z0-9]+(-[a-z0-9]+)*$/.test(scope);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

