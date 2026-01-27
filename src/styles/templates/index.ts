/**
 * Template Configuration System
 * 
 * This module exports all available design templates for the application.
 * Each template provides a complete theme configuration including colors,
 * typography, spacing, and other design tokens.
 */

export * from './types';
export * from './modern-gradient';
export * from './minimal-professional';
export * from './warm-friendly';

import { modernGradientTheme } from './modern-gradient';
import { minimalProfessionalTheme } from './minimal-professional';
import { warmFriendlyTheme } from './warm-friendly';
import { ThemeConfig } from './types';

/**
 * Available templates
 */
export const templates = {
  'modern-gradient': modernGradientTheme,
  'minimal-professional': minimalProfessionalTheme,
  'warm-friendly': warmFriendlyTheme,
} as const;

export type TemplateName = keyof typeof templates;

/**
 * Default template (can be changed based on preference)
 */
export const DEFAULT_TEMPLATE: TemplateName = 'modern-gradient';

/**
 * Get a template by name
 */
export function getTemplate(name: TemplateName): ThemeConfig {
  return templates[name];
}

/**
 * Get all available template names
 */
export function getTemplateNames(): TemplateName[] {
  return Object.keys(templates) as TemplateName[];
}
