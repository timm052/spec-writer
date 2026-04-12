import { describe, it, expect } from 'vitest';
import { resolveClause, extractVariables, Variables } from '../src';

describe('resolveClause', () => {
  it('should resolve a single variable from project vars', () => {
    const body = 'This is {{project.name}}';
    const projectVars: Variables = { 'project.name': 'Sky Tower' };
    const practiceVars: Variables = {};

    expect(resolveClause(body, projectVars, practiceVars)).toBe('This is Sky Tower');
  });

  it('should resolve a single variable from practice vars', () => {
    const body = 'This is {{project.name}}';
    const projectVars: Variables = {};
    const practiceVars: Variables = { 'project.name': 'Default Project' };

    expect(resolveClause(body, projectVars, practiceVars)).toBe('This is Default Project');
  });

  it('should prioritize project vars over practice vars', () => {
    const body = 'This is {{project.name}}';
    const projectVars: Variables = { 'project.name': 'Sky Tower' };
    const practiceVars: Variables = { 'project.name': 'Default Project' };

    expect(resolveClause(body, projectVars, practiceVars)).toBe('This is Sky Tower');
  });

  it('should return empty string for missing variables', () => {
    const body = 'This is {{undefined.variable}}';
    const projectVars: Variables = {};
    const practiceVars: Variables = {};

    expect(resolveClause(body, projectVars, practiceVars)).toBe('This is ');
  });

  it('should handle multiple variables', () => {
    const body = 'Project {{project.name}} is located at {{site.address}} for client {{project.client}}';
    const projectVars: Variables = {
      'project.name': 'Sky Tower',
      'site.address': '123 Main Street',
      'project.client': 'Acme Corp',
    };

    expect(resolveClause(body, projectVars, {})).toBe(
      'Project Sky Tower is located at 123 Main Street for client Acme Corp'
    );
  });

  it('should handle nested dot keys', () => {
    const body = '{{practice.abn}} - {{practice.name}}';
    const projectVars: Variables = {};
    const practiceVars: Variables = {
      'practice.abn': '12 345 678 901',
      'practice.name': 'Acme Architects',
    };

    expect(resolveClause(body, projectVars, practiceVars)).toBe('12 345 678 901 - Acme Architects');
  });

  it('should not leave raw tokens in output', () => {
    const body = 'Project {{missing.var}} with {{empty.value}}';
    const result = resolveClause(body, {}, {});

    expect(result).not.toContain('{{');
    expect(result).not.toContain('}}');
  });

  it('should handle empty body', () => {
    expect(resolveClause('', {}, {})).toBe('');
  });

  it('should handle null/undefined body', () => {
    expect(resolveClause(null as unknown as string, {}, {})).toBe('');
    expect(resolveClause(undefined as unknown as string, {}, {})).toBe('');
  });

  it('should preserve non-variable text', () => {
    const body = 'This clause applies to {{project.name}} and cannot be modified.';
    const projectVars: Variables = { 'project.name': 'Sky Tower' };

    expect(resolveClause(body, projectVars, {})).toBe(
      'This clause applies to Sky Tower and cannot be modified.'
    );
  });

  it('should handle repeated variables', () => {
    const body = '{{project.name}} must comply with {{project.name}} standards';
    const projectVars: Variables = { 'project.name': 'Project X' };

    expect(resolveClause(body, projectVars, {})).toBe('Project X must comply with Project X standards');
  });

  it('should handle HTML content in body without corrupting tags', () => {
    const body = '<p>Works for <strong>{{project.name}}</strong></p>';
    const projectVars: Variables = { 'project.name': 'Sky Tower' };

    expect(resolveClause(body, projectVars, {})).toBe('<p>Works for <strong>Sky Tower</strong></p>');
  });

  it('should handle special characters in variable values', () => {
    const body = 'Client: {{project.client}}';
    const projectVars: Variables = { 'project.client': 'Smith & Sons (Pty) Ltd — Est. 2001' };

    expect(resolveClause(body, projectVars, {})).toBe('Client: Smith & Sons (Pty) Ltd — Est. 2001');
  });

  it('should not double-resolve if variable value contains a token pattern', () => {
    const body = 'Address: {{site.address}}';
    // Value itself looks like a token — should NOT be re-resolved
    const projectVars: Variables = { 'site.address': '{{main.road}}' };

    const result = resolveClause(body, projectVars, {});
    // The substituted value is a literal string, not re-resolved
    expect(result).toBe('Address: {{main.road}}');
  });

  it('should handle body with only whitespace', () => {
    expect(resolveClause('   ', {}, {})).toBe('   ');
  });

  it('should handle body with adjacent tokens', () => {
    const body = '{{a}}{{b}}{{c}}';
    const vars: Variables = { a: 'X', b: 'Y', c: 'Z' };

    expect(resolveClause(body, vars, {})).toBe('XYZ');
  });
});

describe('extractVariables', () => {
  it('should extract single variable', () => {
    const body = 'This is {{project.name}}';
    expect(extractVariables(body)).toEqual(['project.name']);
  });

  it('should extract multiple variables', () => {
    const body = 'Project {{project.name}} at {{site.address}} for {{project.client}}';
    expect(extractVariables(body)).toEqual(['project.name', 'site.address', 'project.client']);
  });

  it('should extract repeated variables', () => {
    const body = '{{project.name}} and {{project.name}} again';
    expect(extractVariables(body)).toEqual(['project.name', 'project.name']);
  });

  it('should return empty array for text with no variables', () => {
    const body = 'This is plain text with no variables';
    expect(extractVariables(body)).toEqual([]);
  });

  it('should handle empty body', () => {
    expect(extractVariables('')).toEqual([]);
  });

  it('should handle null/undefined', () => {
    expect(extractVariables(null as unknown as string)).toEqual([]);
    expect(extractVariables(undefined as unknown as string)).toEqual([]);
  });

  it('should return duplicate tokens when the same token appears twice', () => {
    const body = '{{project.name}} and {{project.name}}';
    // extractVariables returns all occurrences (not deduplicated)
    expect(extractVariables(body)).toEqual(['project.name', 'project.name']);
  });

  it('should extract tokens from HTML-tagged body', () => {
    const body = '<p>{{project.name}}</p><ul><li>{{site.address}}</li></ul>';
    expect(extractVariables(body)).toEqual(['project.name', 'site.address']);
  });

  it('should not extract malformed tokens (single brace)', () => {
    const body = '{project.name} and {site.address}';
    expect(extractVariables(body)).toEqual([]);
  });
});
