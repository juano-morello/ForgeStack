import { test, expect } from './fixtures';

/**
 * Authentication E2E Tests
 *
 * Tests for login and signup pages, form validation, and navigation.
 * These are smoke tests that verify pages render correctly.
 */

test.describe('Authentication Pages', () => {
  test.describe('Login Page', () => {
    test('should render login page', async ({ page }) => {
      await page.goto('/login');

      // Check page title
      await expect(page).toHaveTitle(/Sign In.*ForgeStack/i);

      // Check main heading text
      await expect(page.getByText('Welcome back')).toBeVisible();

      // Check form elements
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

      // Check link to signup
      await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
    });

    test('should show validation error for empty email', async ({ page }) => {
      await page.goto('/login');
      
      // Try to submit with empty fields
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Check for HTML5 validation or error message
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should show validation error for empty password', async ({ page }) => {
      await page.goto('/login');
      
      // Fill email but leave password empty
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      // Check for HTML5 validation
      const passwordInput = page.getByLabel(/password/i);
      await expect(passwordInput).toHaveAttribute('required', '');
    });

    test('should navigate to signup page', async ({ page }) => {
      await page.goto('/login');

      // Click signup link
      await page.getByRole('link', { name: /sign up/i }).click();

      // Verify navigation
      await expect(page).toHaveURL(/\/signup/);
      await expect(page.getByText('Create an account')).toBeVisible();
    });
  });

  test.describe('Signup Page', () => {
    test('should render signup page', async ({ page }) => {
      await page.goto('/signup');

      // Check page title
      await expect(page).toHaveTitle(/Sign Up.*ForgeStack/i);

      // Check main heading text
      await expect(page.getByText('Create an account')).toBeVisible();

      // Check form elements
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/^password$/i)).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();

      // Check link to login
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    });

    test('should show validation error for empty fields', async ({ page }) => {
      await page.goto('/signup');

      // Try to submit with empty fields
      await page.getByRole('button', { name: /create account/i }).click();

      // Check for HTML5 validation
      const nameInput = page.getByLabel(/name/i);
      await expect(nameInput).toHaveAttribute('required', '');
    });

    test('should navigate to login page', async ({ page }) => {
      await page.goto('/signup');

      // Click login link
      await page.getByRole('link', { name: /sign in/i }).click();

      // Verify navigation
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByText('Welcome back')).toBeVisible();
    });
  });

  test.describe('Auth Layout', () => {
    test('should display welcome message on login page', async ({ page }) => {
      await page.goto('/login');

      // Check for welcome text (CardTitle renders as div, not heading)
      await expect(page.getByText(/welcome back/i)).toBeVisible();

      // Check for description
      await expect(page.getByText(/enter your credentials/i)).toBeVisible();
    });

    test('should display create account message on signup page', async ({ page }) => {
      await page.goto('/signup');

      // Check for create account text (CardTitle renders as div, not heading)
      await expect(page.getByText(/create an account/i)).toBeVisible();
    });
  });
});

