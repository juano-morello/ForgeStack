# ForgeStack Initialization Script

This directory contains the initialization script for customizing the ForgeStack template for your project.

## Usage

### Interactive Setup

Run the initialization script to customize the project:

```bash
pnpm install  # Install dependencies first
pnpm init
```

The script will prompt you for:

- **Project Name** (kebab-case, e.g., "my-saas-app")
  - Used for package names, Docker images, database name
  
- **Display Name** (e.g., "My SaaS App")
  - Used for UI branding, page titles
  
- **NPM Scope** (e.g., "@mycompany")
  - Used for all package.json names
  
- **Description** (short project description)
  
- **Database Name** (default: `${projectName}_dev`)
  
- **Author Name** and **Author Email** for package.json
  
- **Repository URL** (GitHub repo URL)

### Dry Run

Preview changes without modifying files:

```bash
pnpm init --dry-run
```

### Non-Interactive Setup

For automated/CI environments, create a `template.config.json` file in the root:

```json
{
  "projectName": "my-saas-app",
  "displayName": "My SaaS App",
  "npmScope": "@mycompany",
  "description": "A modern SaaS application",
  "databaseName": "my_saas_app_dev",
  "authorName": "Your Name",
  "authorEmail": "you@example.com",
  "repositoryUrl": "https://github.com/mycompany/my-saas-app"
}
```

Then run:

```bash
pnpm init
```

The script will automatically use the configuration from the file.

## What It Does

The initialization script performs the following actions:

### 1. String Replacements

Replaces all occurrences across the codebase:

- `forgestack` → your project name (kebab-case)
- `ForgeStack` → your display name
- `@forgestack` → your npm scope
- `forgestack_dev` → your database name
- Container names (e.g., `forgestack-postgres` → `yourproject-postgres`)

### 2. File Processing

Processes the following file types:

- All `package.json` files
- `.env.example`
- `docker-compose*.yml`
- Deployment configs (`deploy/*.toml`, `deploy/*.json`, `deploy/*.yaml`)
- Observability configs (`docker/**/*.yml`, `docker/**/*.yaml`, `docker/**/*.json`)
- All TypeScript/JavaScript files (`*.ts`, `*.tsx`, `*.js`, `*.jsx`)
- All Markdown files (`*.md`)
- `turbo.json`
- `pnpm-workspace.yaml`

### 3. Package.json Updates

Updates all `package.json` files:

- Renames packages from `@forgestack/*` to `${npmScope}/*`
- Updates workspace dependencies
- Sets author and repository information
- Updates project description

### 4. Post-Setup Actions

After processing:

- Removes `scripts/init.ts` and `scripts/init-utils.ts` (self-cleanup)
- Displays next steps for project setup

## Files Excluded

The script automatically skips:

- `node_modules/`
- `dist/`
- `.next/`
- `coverage/`
- `.turbo/`
- Lock files (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`)
- The init scripts themselves

## Next Steps After Initialization

After running the init script, follow these steps:

1. **Review changes:**
   ```bash
   git diff
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Update environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Start infrastructure:**
   ```bash
   docker compose up -d
   ```

5. **Run database migrations:**
   ```bash
   cd packages/db
   pnpm db:push
   pnpm db:migrate
   ```

6. **Start development:**
   ```bash
   pnpm dev
   ```

## Troubleshooting

### Script fails with "Module not found"

Make sure you've installed dependencies:

```bash
pnpm install
```

### Want to re-run the script

The script removes itself after running. To re-run:

1. Restore from git: `git checkout scripts/init.ts scripts/init-utils.ts`
2. Run again: `pnpm init`

### Need to undo changes

If you haven't committed yet:

```bash
git reset --hard HEAD
```

If you've committed:

```bash
git revert <commit-hash>
```

## Implementation Details

### Utilities (`init-utils.ts`)

Helper functions for:

- String transformations (kebab-case, PascalCase, camelCase)
- File operations (read, write, replace)
- Glob pattern matching
- Validation (project name, npm scope, email, URL)

### Main Script (`init.ts`)

- Interactive prompts using `prompts`
- Colored output using `chalk`
- File processing with glob patterns
- JSON manipulation for package.json files
- Dry-run mode for safe previewing

