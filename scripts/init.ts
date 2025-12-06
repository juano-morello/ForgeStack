#!/usr/bin/env node
import prompts from 'prompts';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  toKebabCase,
  toPascalCase,
  replaceInFile,
  findFiles,
  fileExists,
  readJsonFile,
  writeJsonFile,
  validateProjectName,
  validateNpmScope,
  validateEmail,
  validateUrl,
} from './init-utils';

interface Config {
  projectName: string;
  displayName: string;
  npmScope: string;
  description: string;
  databaseName: string;
  authorName: string;
  authorEmail: string;
  repositoryUrl: string;
}

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(chalk.bold.cyan('\n🚀 ForgeStack Project Initialization\n'));
  console.log(
    chalk.gray(
      'This script will customize the ForgeStack template for your project.\n',
    ),
  );

  if (DRY_RUN) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No files will be modified\n'));
  }

  // Check for template.config.json with actual values
  let config: Config;
  const templateConfigPath = 'template.config.json';

  if (await fileExists(templateConfigPath)) {
    try {
      const fileConfig = await readJsonFile<Config & { _comment?: string }>(templateConfigPath);
      // Check if config has actual values (not just empty strings)
      if (fileConfig.projectName && fileConfig.displayName && fileConfig.npmScope) {
        console.log(chalk.cyan('📄 Found template.config.json, loading configuration...\n'));
        config = {
          projectName: fileConfig.projectName,
          displayName: fileConfig.displayName,
          npmScope: fileConfig.npmScope,
          description: fileConfig.description || '',
          databaseName: fileConfig.databaseName || `${fileConfig.projectName.replace(/-/g, '_')}_dev`,
          authorName: fileConfig.authorName || '',
          authorEmail: fileConfig.authorEmail || '',
          repositoryUrl: fileConfig.repositoryUrl || '',
        };
        console.log(chalk.green('✓ Configuration loaded from template.config.json\n'));
      } else {
        // Config file exists but has empty values, use interactive mode
        config = await promptForConfig();
      }
    } catch {
      console.log(chalk.yellow('⚠️  Failed to load template.config.json, falling back to interactive mode\n'));
      config = await promptForConfig();
    }
  } else {
    // Prompt for configuration
    config = await promptForConfig();
  }

  // Confirm before proceeding
  const confirmed = await confirmConfig(config);
  if (!confirmed) {
    console.log(chalk.yellow('\n❌ Initialization cancelled.'));
    process.exit(0);
  }

  console.log(chalk.bold.cyan('\n📝 Processing files...\n'));

  try {
    // Build replacement map
    const replacements = buildReplacementMap(config);

    // Find and process all files
    await processFiles(replacements);

    // Update package.json files
    await updatePackageJsonFiles(config);

    // Post-setup actions
    await postSetupActions();

    console.log(chalk.bold.green('\n✅ Initialization complete!\n'));
    printNextSteps(config);
  } catch (error) {
    console.error(chalk.bold.red('\n❌ Error during initialization:'));
    console.error(error);
    process.exit(1);
  }
}

async function promptForConfig(): Promise<Config> {
  const response = await prompts(
    [
      {
        type: 'text',
        name: 'projectName',
        message: 'Project name (kebab-case):',
        initial: 'my-saas-app',
        validate: (value) =>
          validateProjectName(value) || 'Must be kebab-case (e.g., my-saas-app)',
      },
      {
        type: 'text',
        name: 'displayName',
        message: 'Display name:',
        initial: (prev: string) => toPascalCase(prev).replace(/([A-Z])/g, ' $1').trim(),
        validate: (value) => value.length > 0 || 'Display name is required',
      },
      {
        type: 'text',
        name: 'npmScope',
        message: 'NPM scope (e.g., @mycompany):',
        initial: (prev: string, values: any) => `@${toKebabCase(values.projectName)}`,
        validate: (value) =>
          validateNpmScope(value) || 'Must start with @ and be kebab-case',
      },
      {
        type: 'text',
        name: 'description',
        message: 'Project description:',
        initial: 'A modern SaaS application built with ForgeStack',
      },
      {
        type: 'text',
        name: 'databaseName',
        message: 'Database name:',
        initial: (prev: string, values: any) => `${values.projectName}_dev`,
      },
      {
        type: 'text',
        name: 'authorName',
        message: 'Author name:',
        initial: '',
      },
      {
        type: 'text',
        name: 'authorEmail',
        message: 'Author email:',
        initial: '',
        validate: (value) =>
          !value || validateEmail(value) || 'Must be a valid email',
      },
      {
        type: 'text',
        name: 'repositoryUrl',
        message: 'Repository URL:',
        initial: (prev: string, values: any) =>
          `https://github.com/your-org/${values.projectName}`,
        validate: (value) =>
          !value || validateUrl(value) || 'Must be a valid URL',
      },
    ],
    {
      onCancel: () => {
        console.log(chalk.yellow('\n❌ Initialization cancelled.'));
        process.exit(0);
      },
    },
  );

  return response as Config;
}

async function confirmConfig(config: Config): Promise<boolean> {
  console.log(chalk.bold.cyan('\n📋 Configuration Summary:\n'));
  console.log(chalk.gray('  Project Name:    ') + chalk.white(config.projectName));
  console.log(chalk.gray('  Display Name:    ') + chalk.white(config.displayName));
  console.log(chalk.gray('  NPM Scope:       ') + chalk.white(config.npmScope));
  console.log(chalk.gray('  Description:     ') + chalk.white(config.description));
  console.log(chalk.gray('  Database Name:   ') + chalk.white(config.databaseName));
  console.log(chalk.gray('  Author:          ') + chalk.white(config.authorName));
  console.log(chalk.gray('  Email:           ') + chalk.white(config.authorEmail));
  console.log(chalk.gray('  Repository:      ') + chalk.white(config.repositoryUrl));

  const { confirmed } = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message: 'Proceed with these settings?',
    initial: true,
  });

  return confirmed;
}

function buildReplacementMap(config: Config): Map<string, string> {
  const replacements = new Map<string, string>();

  // Project name replacements
  replacements.set('forgestack', config.projectName);
  replacements.set('ForgeStack', config.displayName);
  replacements.set('@forgestack', config.npmScope);

  // Database name replacements
  replacements.set('forgestack_dev', config.databaseName);
  replacements.set('forgestack_prod', `${config.projectName}_prod`);
  replacements.set('forgestack-db', `${config.projectName}-db`);

  // Container name replacements
  replacements.set('forgestack-postgres', `${config.projectName}-postgres`);
  replacements.set('forgestack-redis', `${config.projectName}-redis`);
  replacements.set('forgestack-api', `${config.projectName}-api`);
  replacements.set('forgestack-web', `${config.projectName}-web`);
  replacements.set('forgestack-worker', `${config.projectName}-worker`);
  replacements.set('forgestack-tempo', `${config.projectName}-tempo`);
  replacements.set('forgestack-loki', `${config.projectName}-loki`);
  replacements.set('forgestack-prometheus', `${config.projectName}-prometheus`);
  replacements.set('forgestack-grafana', `${config.projectName}-grafana`);
  replacements.set('forgestack-stripe-cli', `${config.projectName}-stripe-cli`);

  // Service name replacements (for OTEL, etc.)
  replacements.set('forgestack-api', `${config.projectName}-api`);
  replacements.set('forgestack-worker', `${config.projectName}-worker`);

  return replacements;
}

async function processFiles(replacements: Map<string, string>): Promise<void> {
  const patterns = [
    '**/*.md',
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.json',
    '**/*.yml',
    '**/*.yaml',
    '**/*.toml',
    '.env.example',
  ];

  const files = await findFiles(patterns);
  console.log(chalk.gray(`Found ${files.length} files to process...\n`));

  let processedCount = 0;
  for (const file of files) {
    // Skip certain files
    if (shouldSkipFile(file)) {
      continue;
    }

    if (DRY_RUN) {
      console.log(chalk.gray(`  [DRY RUN] Would process: ${file}`));
    } else {
      await replaceInFile(file, replacements);
      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(chalk.gray(`  Processed ${processedCount} files...`));
      }
    }
  }

  console.log(chalk.green(`\n✓ Processed ${processedCount} files`));
}

function shouldSkipFile(filePath: string): boolean {
  const skipPatterns = [
    'node_modules',
    'dist',
    '.next',
    'coverage',
    '.turbo',
    'pnpm-lock.yaml',
    'package-lock.json',
    'yarn.lock',
    'scripts/init.ts',
    'scripts/init-utils.ts',
  ];

  return skipPatterns.some((pattern) => filePath.includes(pattern));
}

async function updatePackageJsonFiles(config: Config): Promise<void> {
  console.log(chalk.cyan('\n📦 Updating package.json files...\n'));

  const packageJsonFiles = await findFiles(['**/package.json']);

  for (const file of packageJsonFiles) {
    if (shouldSkipFile(file)) {
      continue;
    }

    if (DRY_RUN) {
      console.log(chalk.gray(`  [DRY RUN] Would update: ${file}`));
      continue;
    }

    const pkg = await readJsonFile(file);

    // Update name if it uses @forgestack scope
    if (pkg.name && pkg.name.startsWith('@forgestack/')) {
      const packageName = pkg.name.replace('@forgestack/', '');
      pkg.name = `${config.npmScope}/${packageName}`;
    } else if (pkg.name === 'forgestack') {
      pkg.name = config.projectName;
    }

    // Update description for root package
    if (file === 'package.json' && config.description) {
      pkg.description = config.description;
    }

    // Update author
    if (config.authorName || config.authorEmail) {
      pkg.author = config.authorName;
      if (config.authorEmail) {
        pkg.author += ` <${config.authorEmail}>`;
      }
    }

    // Update repository
    if (config.repositoryUrl && file === 'package.json') {
      pkg.repository = {
        type: 'git',
        url: config.repositoryUrl,
      };
    }

    // Update workspace dependencies
    if (pkg.dependencies) {
      for (const [dep, version] of Object.entries(pkg.dependencies)) {
        if (dep.startsWith('@forgestack/')) {
          const depName = dep.replace('@forgestack/', '');
          delete pkg.dependencies[dep];
          pkg.dependencies[`${config.npmScope}/${depName}`] = version;
        }
      }
    }

    if (pkg.devDependencies) {
      for (const [dep, version] of Object.entries(pkg.devDependencies)) {
        if (dep.startsWith('@forgestack/')) {
          const depName = dep.replace('@forgestack/', '');
          delete pkg.devDependencies[dep];
          pkg.devDependencies[`${config.npmScope}/${depName}`] = version;
        }
      }
    }

    await writeJsonFile(file, pkg);
    console.log(chalk.gray(`  ✓ Updated ${file}`));
  }

  console.log(chalk.green('\n✓ Package.json files updated'));
}

async function postSetupActions(): Promise<void> {
  console.log(chalk.cyan('\n🧹 Running post-setup actions...\n'));

  if (DRY_RUN) {
    console.log(chalk.gray('  [DRY RUN] Would remove scripts/init.ts'));
    console.log(chalk.gray('  [DRY RUN] Would remove scripts/init-utils.ts'));
    console.log(chalk.gray('  [DRY RUN] Would remove template.config.json'));
    console.log(chalk.gray('  [DRY RUN] Would run pnpm install'));
    return;
  }

  // Remove init scripts
  try {
    await fs.unlink('scripts/init.ts');
    console.log(chalk.gray('  ✓ Removed scripts/init.ts'));
  } catch (error) {
    console.log(chalk.yellow('  ⚠ Could not remove scripts/init.ts'));
  }

  try {
    await fs.unlink('scripts/init-utils.ts');
    console.log(chalk.gray('  ✓ Removed scripts/init-utils.ts'));
  } catch (error) {
    console.log(chalk.yellow('  ⚠ Could not remove scripts/init-utils.ts'));
  }

  // Remove template.config.json if it exists
  try {
    if (await fileExists('template.config.json')) {
      await fs.unlink('template.config.json');
      console.log(chalk.gray('  ✓ Removed template.config.json'));
    }
  } catch (error) {
    console.log(chalk.yellow('  ⚠ Could not remove template.config.json'));
  }

  console.log(chalk.green('\n✓ Post-setup actions complete'));
}

function printNextSteps(config: Config): void {
  console.log(chalk.bold.cyan('📚 Next Steps:\n'));
  console.log(chalk.white('1. Review the changes:'));
  console.log(chalk.gray('   git diff\n'));
  console.log(chalk.white('2. Install dependencies:'));
  console.log(chalk.gray('   pnpm install\n'));
  console.log(chalk.white('3. Update environment variables:'));
  console.log(chalk.gray('   cp .env.example .env'));
  console.log(chalk.gray('   # Edit .env with your values\n'));
  console.log(chalk.white('4. Start infrastructure:'));
  console.log(chalk.gray('   docker compose up -d\n'));
  console.log(chalk.white('5. Run database migrations:'));
  console.log(chalk.gray('   cd packages/db'));
  console.log(chalk.gray('   pnpm db:push'));
  console.log(chalk.gray('   pnpm db:migrate\n'));
  console.log(chalk.white('6. Start development:'));
  console.log(chalk.gray('   pnpm dev\n'));
  console.log(chalk.bold.green(`🎉 Your project "${config.displayName}" is ready!\n`));
}

// Run the script
main().catch((error) => {
  console.error(chalk.bold.red('Fatal error:'), error);
  process.exit(1);
});

