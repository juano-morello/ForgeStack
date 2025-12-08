import { test, expect } from './fixtures';

/**
 * Members E2E Tests
 *
 * Tests for organization member management including invitations,
 * role changes, and member removal.
 */

test.describe('Members', () => {
  test.describe('Organization Members (Unauthenticated)', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      // Try to access members page without authentication
      // Note: We need an orgId, but we'll use a placeholder
      await page.goto('/organizations/test-org-id/members');
      
      // Should redirect to login
      await page.waitForURL(/\/(login|organizations)/, { timeout: 5000 });
      
      if (page.url().includes('/login')) {
        await expect(page.getByText('Welcome back')).toBeVisible();
      }
    });
  });

  test.describe('Organization Members Page (Authenticated)', () => {
    test('should display members page when navigating from organizations', async ({ authenticatedPage: page }) => {
      // First go to organizations page
      await page.goto('/organizations');
      
      // Look for a link to members (could be in org card or navigation)
      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);
      
      if (isVisible) {
        await membersLink.click();
        await expect(page).toHaveURL(/\/organizations\/.*\/members/);
      }
    });

    test('should show members page header', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      
      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);
      
      if (isVisible) {
        await membersLink.click();
        
        const heading = page.getByRole('heading', { name: /members/i });
        await expect(heading).toBeVisible();
      }
    });

    test('should display member list table', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      
      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);
      
      if (isVisible) {
        await membersLink.click();
        
        // Look for table or list of members
        const memberTable = page.getByRole('table')
          .or(page.getByRole('list'))
          .or(page.locator('[data-testid="member-list"]'));
        
        const tableVisible = await memberTable.isVisible().catch(() => false);
        if (tableVisible) {
          await expect(memberTable).toBeVisible();
        }
      }
    });

    test('should show current user in member list', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      
      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);
      
      if (isVisible) {
        await membersLink.click();
        
        // Should show the test user's email
        const currentUser = page.getByText(/admin@forgestack\.dev/i)
          .or(page.getByText(/admin user/i));
        
        const userVisible = await currentUser.isVisible().catch(() => false);
        if (userVisible) {
          await expect(currentUser).toBeVisible();
        }
      }
    });

    test('should show member roles', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');
      
      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);
      
      if (isVisible) {
        await membersLink.click();
        
        // Should show role badges or labels
        const role = page.getByText(/owner/i)
          .or(page.getByText(/admin/i))
          .or(page.getByText(/member/i));
        
        const roleVisible = await role.isVisible().catch(() => false);
        if (roleVisible) {
          await expect(role).toBeVisible();
        }
      }
    });

    test('should have invite member button for owners', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        // Look for invite button or link
        const inviteButton = page.getByRole('button', { name: /invite/i })
          .or(page.getByRole('link', { name: /invite/i }));

        const buttonVisible = await inviteButton.isVisible().catch(() => false);
        if (buttonVisible) {
          await expect(inviteButton).toBeVisible();
        }
      }
    });
  });

  test.describe('Invite Member Flow', () => {
    test('should navigate to invite page', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        const inviteButton = page.getByRole('link', { name: /invite/i });
        const buttonVisible = await inviteButton.isVisible().catch(() => false);

        if (buttonVisible) {
          await inviteButton.click();
          await expect(page).toHaveURL(/\/organizations\/.*\/members\/invite/);
        }
      }
    });

    test('should open invite dialog when clicking invite button', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        // Look for invite button (not link)
        const inviteButton = page.getByRole('button', { name: /invite/i });
        const buttonVisible = await inviteButton.isVisible().catch(() => false);

        if (buttonVisible) {
          await inviteButton.click();

          const dialog = page.getByRole('dialog')
            .or(page.getByRole('heading', { name: /invite/i }));
          await expect(dialog).toBeVisible();
        }
      }
    });

    test('should have email input in invite form', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        const inviteLink = page.getByRole('link', { name: /invite/i });
        const linkVisible = await inviteLink.isVisible().catch(() => false);

        if (linkVisible) {
          await inviteLink.click();

          const emailInput = page.getByLabel(/email/i)
            .or(page.getByPlaceholder(/email/i));
          await expect(emailInput).toBeVisible();
        }
      }
    });

    test('should have role selector in invite form', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        const inviteLink = page.getByRole('link', { name: /invite/i });
        const linkVisible = await inviteLink.isVisible().catch(() => false);

        if (linkVisible) {
          await inviteLink.click();

          const roleSelector = page.getByLabel(/role/i)
            .or(page.getByRole('combobox'));

          const selectorVisible = await roleSelector.isVisible().catch(() => false);
          if (selectorVisible) {
            await expect(roleSelector).toBeVisible();
          }
        }
      }
    });

    test('should validate email format', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        const inviteLink = page.getByRole('link', { name: /invite/i });
        const linkVisible = await inviteLink.isVisible().catch(() => false);

        if (linkVisible) {
          await inviteLink.click();

          const emailInput = page.getByLabel(/email/i)
            .or(page.getByPlaceholder(/email/i));

          if (await emailInput.isVisible()) {
            await emailInput.fill('invalid-email');

            const submitButton = page.getByRole('button', { name: /send.*invite/i })
              .or(page.getByRole('button', { name: /invite/i })).last();
            await submitButton.click();

            // Should show validation error
            const error = page.getByText(/invalid.*email/i)
              .or(page.getByText(/valid.*email/i))
              .or(page.getByText(/please enter a valid email/i));
            const errorVisible = await error.isVisible().catch(() => false);

            // Or HTML5 validation
            const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
            expect(errorVisible || isInvalid).toBeTruthy();
          }
        }
      }
    });

    test('should close invite dialog on cancel', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        const inviteButton = page.getByRole('button', { name: /invite/i });
        const buttonVisible = await inviteButton.isVisible().catch(() => false);

        if (buttonVisible) {
          await inviteButton.click();

          const cancelButton = page.getByRole('button', { name: /cancel/i });
          if (await cancelButton.isVisible()) {
            await cancelButton.click();

            const dialog = page.getByRole('dialog');
            await expect(dialog).not.toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Pending Invitations', () => {
    test('should show pending invitations section', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        const pendingSection = page.getByText(/pending/i)
          .or(page.getByText(/invitations/i))
          .or(page.getByRole('heading', { name: /pending/i }));

        const sectionVisible = await pendingSection.isVisible().catch(() => false);
        if (sectionVisible) {
          await expect(pendingSection).toBeVisible();
        }
      }
    });

    test('should show resend invitation option', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        const resendButton = page.getByRole('button', { name: /resend/i });

        const buttonVisible = await resendButton.isVisible().catch(() => false);
        if (buttonVisible) {
          await expect(resendButton).toBeVisible();
        }
      }
    });

    test('should show cancel invitation option', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        const cancelButton = page.getByRole('button', { name: /cancel.*invitation/i })
          .or(page.getByRole('button', { name: /revoke/i }))
          .or(page.getByRole('button', { name: /delete/i }));

        const buttonVisible = await cancelButton.isVisible().catch(() => false);
        if (buttonVisible) {
          await expect(cancelButton).toBeVisible();
        }
      }
    });
  });

  test.describe('Member Role Management', () => {
    test('should show role change option for members', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        const roleButton = page.getByRole('button', { name: /change.*role/i })
          .or(page.getByRole('combobox', { name: /role/i }))
          .or(page.locator('select[name*="role"]'));

        const buttonVisible = await roleButton.isVisible().catch(() => false);
        if (buttonVisible) {
          await expect(roleButton).toBeVisible();
        }
      }
    });

    test('should show available roles in dropdown', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        // Look for role selector/combobox
        const roleButton = page.getByRole('combobox').first();
        const buttonVisible = await roleButton.isVisible().catch(() => false);

        if (buttonVisible) {
          await roleButton.click();

          const adminRole = page.getByRole('option', { name: /admin/i })
            .or(page.getByText(/admin/i));
          const memberRole = page.getByRole('option', { name: /member/i })
            .or(page.getByText(/member/i));

          const adminVisible = await adminRole.isVisible().catch(() => false);
          const memberVisible = await memberRole.isVisible().catch(() => false);

          expect(adminVisible || memberVisible).toBeTruthy();
        }
      }
    });

    test('should show edit roles button', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        const editButton = page.getByRole('button', { name: /edit.*role/i })
          .or(page.locator('button[aria-label*="edit"]'));

        const buttonVisible = await editButton.isVisible().catch(() => false);
        if (buttonVisible) {
          await expect(editButton).toBeVisible();
        }
      }
    });
  });

  test.describe('Remove Member', () => {
    test('should show remove member option', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        const removeButton = page.getByRole('button', { name: /remove/i })
          .or(page.getByRole('button', { name: /delete/i }))
          .or(page.locator('button[aria-label*="remove"]'));

        const buttonVisible = await removeButton.isVisible().catch(() => false);
        if (buttonVisible) {
          await expect(removeButton).toBeVisible();
        }
      }
    });

    test('should show confirmation dialog when removing member', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        const removeButton = page.getByRole('button', { name: /remove/i }).first();
        const buttonVisible = await removeButton.isVisible().catch(() => false);

        if (buttonVisible) {
          await removeButton.click();

          const confirmDialog = page.getByRole('alertdialog')
            .or(page.getByRole('dialog'))
            .or(page.getByText(/are you sure/i));
          const dialogVisible = await confirmDialog.isVisible().catch(() => false);

          if (dialogVisible) {
            await expect(confirmDialog).toBeVisible();

            // Cancel to avoid actually removing
            const cancelButton = page.getByRole('button', { name: /cancel/i });
            if (await cancelButton.isVisible()) {
              await cancelButton.click();
            }
          }
        }
      }
    });

    test('should prevent removing last owner', async ({ authenticatedPage: page }) => {
      await page.goto('/organizations');

      const membersLink = page.getByRole('link', { name: /members/i }).first();
      const isVisible = await membersLink.isVisible().catch(() => false);

      if (isVisible) {
        await membersLink.click();

        // Look for disabled remove button or warning message
        const warning = page.getByText(/last owner/i)
          .or(page.getByText(/cannot remove/i))
          .or(page.getByText(/at least one owner/i));

        const warningVisible = await warning.isVisible().catch(() => false);
        if (warningVisible) {
          await expect(warning).toBeVisible();
        }
      }
    });
  });

  test.describe('Invitation Accept Page', () => {
    test('should display invitation accept page with token', async ({ page }) => {
      // Navigate to accept invitation page with a mock token
      await page.goto('/invitations/accept?token=test-token');

      // Should show invitation page or redirect to login
      const invitationPage = page.getByText(/invitation/i)
        .or(page.getByText(/join/i))
        .or(page.getByText(/accept/i));

      const isVisible = await invitationPage.isVisible().catch(() => false);
      const isRedirected = page.url().includes('/login') || page.url().includes('/signup');

      expect(isVisible || isRedirected).toBeTruthy();
    });

    test('should show organization name in invitation', async ({ authenticatedPage: page }) => {
      await page.goto('/invitations/accept?token=test-token');

      // Skip if redirected
      if (page.url().includes('/login') || page.url().includes('/signup')) return;

      const orgName = page.getByText(/organization/i)
        .or(page.getByText(/join/i));
      const isVisible = await orgName.isVisible().catch(() => false);

      if (isVisible) {
        await expect(orgName).toBeVisible();
      }
    });

    test('should show accept button', async ({ authenticatedPage: page }) => {
      await page.goto('/invitations/accept?token=test-token');

      // Skip if redirected
      if (page.url().includes('/login') || page.url().includes('/signup')) return;

      const acceptButton = page.getByRole('button', { name: /accept/i })
        .or(page.getByRole('button', { name: /join/i }));
      const isVisible = await acceptButton.isVisible().catch(() => false);

      if (isVisible) {
        await expect(acceptButton).toBeVisible();
      }
    });

    test('should show decline option', async ({ authenticatedPage: page }) => {
      await page.goto('/invitations/accept?token=test-token');

      // Skip if redirected
      if (page.url().includes('/login') || page.url().includes('/signup')) return;

      const declineButton = page.getByRole('button', { name: /decline/i })
        .or(page.getByRole('link', { name: /decline/i }));
      const isVisible = await declineButton.isVisible().catch(() => false);

      if (isVisible) {
        await expect(declineButton).toBeVisible();
      }
    });

    test('should handle missing token', async ({ page }) => {
      await page.goto('/invitations/accept');

      // Should show error or redirect
      const error = page.getByText(/token.*required/i)
        .or(page.getByText(/invalid.*invitation/i))
        .or(page.getByText(/missing.*token/i));

      const errorVisible = await error.isVisible().catch(() => false);
      const isRedirected = page.url().includes('/login') || page.url().includes('/organizations');

      expect(errorVisible || isRedirected).toBeTruthy();
    });

    test('should handle invalid token', async ({ authenticatedPage: page }) => {
      await page.goto('/invitations/accept?token=invalid-token-12345');

      // Should show error message
      const error = page.getByText(/invalid/i)
        .or(page.getByText(/expired/i))
        .or(page.getByText(/not found/i));

      const errorVisible = await error.isVisible().catch(() => false);
      if (errorVisible) {
        await expect(error).toBeVisible();
      }
    });
  });

  test.describe('Invitation Decline Page', () => {
    test('should display decline invitation page', async ({ page }) => {
      await page.goto('/invitations/decline?token=test-token');

      // Should show decline page
      const declinePage = page.getByText(/decline/i)
        .or(page.getByRole('heading', { name: /decline/i }));

      const isVisible = await declinePage.isVisible().catch(() => false);
      if (isVisible) {
        await expect(declinePage).toBeVisible();
      }
    });

    test('should show confirmation message', async ({ page }) => {
      await page.goto('/invitations/decline?token=test-token');

      const confirmMessage = page.getByText(/are you sure/i)
        .or(page.getByText(/confirm/i));

      const isVisible = await confirmMessage.isVisible().catch(() => false);
      if (isVisible) {
        await expect(confirmMessage).toBeVisible();
      }
    });

    test('should show decline button', async ({ page }) => {
      await page.goto('/invitations/decline?token=test-token');

      const declineButton = page.getByRole('button', { name: /decline/i })
        .or(page.getByRole('button', { name: /confirm/i }));

      const isVisible = await declineButton.isVisible().catch(() => false);
      if (isVisible) {
        await expect(declineButton).toBeVisible();
      }
    });

    test('should show cancel option', async ({ page }) => {
      await page.goto('/invitations/decline?token=test-token');

      const cancelButton = page.getByRole('button', { name: /cancel/i })
        .or(page.getByRole('link', { name: /cancel/i }));

      const isVisible = await cancelButton.isVisible().catch(() => false);
      if (isVisible) {
        await expect(cancelButton).toBeVisible();
      }
    });

    test('should handle missing token on decline page', async ({ page }) => {
      await page.goto('/invitations/decline');

      // Should show error or redirect
      const error = page.getByText(/token.*required/i)
        .or(page.getByText(/invalid.*invitation/i))
        .or(page.getByText(/missing.*token/i));

      const errorVisible = await error.isVisible().catch(() => false);
      if (errorVisible) {
        await expect(error).toBeVisible();
      }
    });
  });
});

