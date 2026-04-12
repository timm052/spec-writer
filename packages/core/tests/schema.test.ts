import { describe, it, expect } from 'vitest';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  AddClauseToProjectSchema,
  UpdateProjectClauseSchema,
  SearchClausesSchema,
} from '../src';

describe('CreateProjectSchema', () => {
  it('accepts valid minimal input (name only)', () => {
    const result = CreateProjectSchema.safeParse({ name: 'Sky Tower' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Sky Tower');
      expect(result.data.variables).toEqual({});
    }
  });

  it('accepts full input with all optional fields', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'Sky Tower',
      number: 'PRJ-001',
      client: 'Acme Corp',
      address: '123 Main Street',
      variables: { 'project.name': 'Sky Tower', 'site.address': '123 Main St' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.client).toBe('Acme Corp');
      expect(result.data.variables['project.name']).toBe('Sky Tower');
    }
  });

  it('rejects empty name', () => {
    const result = CreateProjectSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is required');
    }
  });

  it('rejects missing name', () => {
    const result = CreateProjectSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('defaults variables to empty object when omitted', () => {
    const result = CreateProjectSchema.safeParse({ name: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variables).toEqual({});
    }
  });

  it('rejects non-string variable values', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'Test',
      variables: { 'project.name': 42 },
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty variables object explicitly', () => {
    const result = CreateProjectSchema.safeParse({ name: 'Test', variables: {} });
    expect(result.success).toBe(true);
  });
});

describe('UpdateProjectSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = UpdateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with just name', () => {
    const result = UpdateProjectSchema.safeParse({ name: 'New Name' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('New Name');
      expect(result.data.client).toBeUndefined();
    }
  });

  it('accepts partial update with just client', () => {
    const result = UpdateProjectSchema.safeParse({ client: 'New Client' });
    expect(result.success).toBe(true);
  });

  it('rejects name as empty string when provided', () => {
    const result = UpdateProjectSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('accepts variables-only update', () => {
    const result = UpdateProjectSchema.safeParse({
      variables: { 'site.address': '456 New Road' },
    });
    expect(result.success).toBe(true);
  });
});

describe('AddClauseToProjectSchema', () => {
  const validUuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  it('accepts valid uuid clauseId', () => {
    const result = AddClauseToProjectSchema.safeParse({ clauseId: validUuid });
    expect(result.success).toBe(true);
  });

  it('accepts optional sortOrder', () => {
    const result = AddClauseToProjectSchema.safeParse({ clauseId: validUuid, sortOrder: 3 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortOrder).toBe(3);
    }
  });

  it('rejects non-uuid clauseId', () => {
    const result = AddClauseToProjectSchema.safeParse({ clauseId: 'not-a-uuid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid clause ID');
    }
  });

  it('rejects missing clauseId', () => {
    const result = AddClauseToProjectSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects negative sortOrder', () => {
    const result = AddClauseToProjectSchema.safeParse({ clauseId: validUuid, sortOrder: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects fractional sortOrder', () => {
    const result = AddClauseToProjectSchema.safeParse({ clauseId: validUuid, sortOrder: 1.5 });
    expect(result.success).toBe(false);
  });

  it('accepts zero sortOrder', () => {
    const result = AddClauseToProjectSchema.safeParse({ clauseId: validUuid, sortOrder: 0 });
    expect(result.success).toBe(true);
  });
});

describe('UpdateProjectClauseSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = UpdateProjectClauseSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts bodyOverride as string', () => {
    const result = UpdateProjectClauseSchema.safeParse({ bodyOverride: 'Custom text' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bodyOverride).toBe('Custom text');
    }
  });

  it('accepts bodyOverride as null (reset to base)', () => {
    const result = UpdateProjectClauseSchema.safeParse({ bodyOverride: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bodyOverride).toBeNull();
    }
  });

  it('accepts included as boolean', () => {
    const result = UpdateProjectClauseSchema.safeParse({ included: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.included).toBe(false);
    }
  });

  it('accepts sortOrder', () => {
    const result = UpdateProjectClauseSchema.safeParse({ sortOrder: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects negative sortOrder', () => {
    const result = UpdateProjectClauseSchema.safeParse({ sortOrder: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts all fields together', () => {
    const result = UpdateProjectClauseSchema.safeParse({
      bodyOverride: 'Override text',
      sortOrder: 2,
      included: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('SearchClausesSchema', () => {
  it('accepts empty object', () => {
    const result = SearchClausesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts search query', () => {
    const result = SearchClausesSchema.safeParse({ q: 'site works' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe('site works');
    }
  });

  it('accepts valid uuid section filter', () => {
    const result = SearchClausesSchema.safeParse({
      section: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid section filter', () => {
    const result = SearchClausesSchema.safeParse({ section: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('accepts tags as comma-separated string', () => {
    const result = SearchClausesSchema.safeParse({ tags: 'preliminary,siteworks' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toBe('preliminary,siteworks');
    }
  });

  it('accepts all filters together', () => {
    const result = SearchClausesSchema.safeParse({
      q: 'access',
      section: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      tags: 'preliminary',
    });
    expect(result.success).toBe(true);
  });
});
