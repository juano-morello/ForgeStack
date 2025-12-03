/**
 * @forgestack/ui
 * Shared UI components for ForgeStack
 *
 * This package provides:
 * - shadcn/ui based components
 * - Tailwind CSS utilities
 * - Storybook stories for all components
 */

export const UI_VERSION = '0.0.1';

// Core UI Components
export * from "./components/alert";
export * from "./components/alert-dialog";
export * from "./components/avatar";
export * from "./components/badge";
export * from "./components/button";
export * from "./components/card";
export * from "./components/checkbox";
export * from "./components/dialog";
export * from "./components/dropdown-menu";
export * from "./components/input";
export * from "./components/label";
export * from "./components/progress";
export * from "./components/select";
export * from "./components/separator";
export * from "./components/sheet";
export * from "./components/skeleton";
export * from "./components/switch";
export * from "./components/table";
export * from "./components/tabs";
export * from "./components/textarea";
export * from "./components/toast";
export * from "./components/toaster";

// Compound Components
export * from "./components/compound/page-header";
export * from "./components/compound/empty-state";
export * from "./components/compound/stat-card";
export * from "./components/compound/confirm-dialog";

// Hooks
export * from "./hooks/use-toast";

// Utilities
export * from "./lib/utils";

// Design Tokens
export * from "./tokens";

