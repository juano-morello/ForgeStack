/**
 * Organization branding configuration for email templates
 */
export interface OrgBranding {
  /** Organization name */
  orgName: string;
  /** URL to organization logo (optional) */
  logo?: string;
  /** Primary brand color in hex format (e.g., "#3B82F6") */
  primaryColor?: string;
}

/**
 * Base props for all email templates
 */
export interface BaseEmailProps {
  /** Organization branding configuration */
  orgBranding?: OrgBranding;
  /** Preview text shown in email inbox */
  previewText?: string;
}

