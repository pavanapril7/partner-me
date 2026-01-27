/**
 * Template System Tests
 * Validates that all templates are properly configured and accessible
 */

import {
  templates,
  getTemplate,
  getTemplateNames,
  DEFAULT_TEMPLATE,
  modernGradientTheme,
  minimalProfessionalTheme,
  warmFriendlyTheme,
  type ThemeConfig,
  type TemplateName,
} from '@/styles/templates';

describe('Template System', () => {
  describe('Template Exports', () => {
    it('should export all three templates', () => {
      expect(templates).toBeDefined();
      expect(Object.keys(templates)).toHaveLength(3);
      expect(templates['modern-gradient']).toBeDefined();
      expect(templates['minimal-professional']).toBeDefined();
      expect(templates['warm-friendly']).toBeDefined();
    });

    it('should export individual theme objects', () => {
      expect(modernGradientTheme).toBeDefined();
      expect(minimalProfessionalTheme).toBeDefined();
      expect(warmFriendlyTheme).toBeDefined();
    });

    it('should have a default template', () => {
      expect(DEFAULT_TEMPLATE).toBe('modern-gradient');
    });
  });

  describe('Template Structure', () => {
    const templateNames: TemplateName[] = ['modern-gradient', 'minimal-professional', 'warm-friendly'];

    templateNames.forEach((templateName) => {
      describe(`${templateName} template`, () => {
        let theme: ThemeConfig;

        beforeEach(() => {
          theme = getTemplate(templateName);
        });

        it('should have a name and description', () => {
          expect(theme.name).toBeDefined();
          expect(typeof theme.name).toBe('string');
          expect(theme.description).toBeDefined();
          expect(typeof theme.description).toBe('string');
        });

        it('should have complete color configuration', () => {
          expect(theme.colors).toBeDefined();
          expect(theme.colors.primary).toBeDefined();
          expect(theme.colors.secondary).toBeDefined();
          expect(theme.colors.accent).toBeDefined();
          expect(theme.colors.neutral).toBeDefined();
          expect(theme.colors.semantic).toBeDefined();
        });

        it('should have all color scale values', () => {
          const colorScales = [
            theme.colors.primary,
            theme.colors.secondary,
            theme.colors.accent,
            theme.colors.neutral,
          ];

          colorScales.forEach((scale) => {
            expect(scale[50]).toBeDefined();
            expect(scale[100]).toBeDefined();
            expect(scale[200]).toBeDefined();
            expect(scale[300]).toBeDefined();
            expect(scale[400]).toBeDefined();
            expect(scale[500]).toBeDefined();
            expect(scale[600]).toBeDefined();
            expect(scale[700]).toBeDefined();
            expect(scale[800]).toBeDefined();
            expect(scale[900]).toBeDefined();
            expect(scale[950]).toBeDefined();
            expect(scale.DEFAULT).toBeDefined();
          });
        });

        it('should have semantic colors', () => {
          expect(theme.colors.semantic.success).toBeDefined();
          expect(theme.colors.semantic.warning).toBeDefined();
          expect(theme.colors.semantic.error).toBeDefined();
          expect(theme.colors.semantic.info).toBeDefined();
        });

        it('should have typography configuration', () => {
          expect(theme.typography).toBeDefined();
          expect(theme.typography.fontFamily).toBeDefined();
          expect(theme.typography.fontFamily.heading).toBeDefined();
          expect(theme.typography.fontFamily.body).toBeDefined();
          expect(theme.typography.scale).toBeDefined();
        });

        it('should have complete typography scale', () => {
          const scale = theme.typography.scale;
          expect(scale.xs).toBeDefined();
          expect(scale.sm).toBeDefined();
          expect(scale.base).toBeDefined();
          expect(scale.lg).toBeDefined();
          expect(scale.xl).toBeDefined();
          expect(scale['2xl']).toBeDefined();
          expect(scale['3xl']).toBeDefined();
          expect(scale['4xl']).toBeDefined();
          expect(scale['5xl']).toBeDefined();
          expect(scale['6xl']).toBeDefined();
        });

        it('should have spacing configuration', () => {
          expect(theme.spacing).toBeDefined();
          expect(theme.spacing.xs).toBeDefined();
          expect(theme.spacing.sm).toBeDefined();
          expect(theme.spacing.md).toBeDefined();
          expect(theme.spacing.lg).toBeDefined();
          expect(theme.spacing.xl).toBeDefined();
          expect(theme.spacing['2xl']).toBeDefined();
          expect(theme.spacing['3xl']).toBeDefined();
          expect(theme.spacing['4xl']).toBeDefined();
        });

        it('should have border radius configuration', () => {
          expect(theme.borderRadius).toBeDefined();
          expect(theme.borderRadius.none).toBeDefined();
          expect(theme.borderRadius.sm).toBeDefined();
          expect(theme.borderRadius.md).toBeDefined();
          expect(theme.borderRadius.lg).toBeDefined();
          expect(theme.borderRadius.xl).toBeDefined();
          expect(theme.borderRadius['2xl']).toBeDefined();
          expect(theme.borderRadius.full).toBeDefined();
        });

        it('should have shadow configuration', () => {
          expect(theme.shadows).toBeDefined();
          expect(theme.shadows.sm).toBeDefined();
          expect(theme.shadows.md).toBeDefined();
          expect(theme.shadows.lg).toBeDefined();
          expect(theme.shadows.xl).toBeDefined();
          expect(theme.shadows['2xl']).toBeDefined();
          expect(theme.shadows.inner).toBeDefined();
          expect(theme.shadows.none).toBeDefined();
        });
      });
    });
  });

  describe('Template Utilities', () => {
    it('should return correct template names', () => {
      const names = getTemplateNames();
      expect(names).toHaveLength(3);
      expect(names).toContain('modern-gradient');
      expect(names).toContain('minimal-professional');
      expect(names).toContain('warm-friendly');
    });

    it('should retrieve templates by name', () => {
      const modernGradient = getTemplate('modern-gradient');
      expect(modernGradient.name).toBe('Modern Gradient');

      const minimalProfessional = getTemplate('minimal-professional');
      expect(minimalProfessional.name).toBe('Minimal Professional');

      const warmFriendly = getTemplate('warm-friendly');
      expect(warmFriendly.name).toBe('Warm & Friendly');
    });
  });

  describe('Template Characteristics', () => {
    it('Modern Gradient should have vibrant colors', () => {
      const theme = getTemplate('modern-gradient');
      expect(theme.description).toContain('Vibrant');
      expect(theme.colors.primary.DEFAULT).toBe('#3b82f6');
      expect(theme.colors.secondary.DEFAULT).toBe('#8b5cf6');
      expect(theme.colors.accent.DEFAULT).toBe('#06b6d4');
    });

    it('Minimal Professional should have subtle colors', () => {
      const theme = getTemplate('minimal-professional');
      expect(theme.description).toContain('Clean');
      expect(theme.colors.primary.DEFAULT).toBe('#1e293b');
      expect(theme.colors.accent.DEFAULT).toBe('#4f46e5');
    });

    it('Warm & Friendly should have warm colors', () => {
      const theme = getTemplate('warm-friendly');
      expect(theme.description).toContain('Warm');
      expect(theme.colors.primary.DEFAULT).toBe('#f97316');
      expect(theme.colors.secondary.DEFAULT).toBe('#f59e0b');
      expect(theme.colors.accent.DEFAULT).toBe('#14b8a6');
    });
  });
});
