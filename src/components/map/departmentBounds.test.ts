import { describe, expect, it } from 'vitest';
import { getDepartmentBounds, getDepartmentsBounds } from './departmentBounds';
import { getAllDepartmentCodes } from './departments';

describe('departmentBounds', () => {
  it('couvre tous les departements disponibles dans la liste de selection', () => {
    const missing = getAllDepartmentCodes().filter(code => getDepartmentBounds(code) === null);

    expect(missing).toEqual([]);
  });

  it('fusionne les bounds de plusieurs departements', () => {
    const bounds = getDepartmentsBounds(['75', '69']);

    expect(bounds).not.toBeNull();
    expect(bounds?.[0][0]).toBeLessThan(46);
    expect(bounds?.[1][0]).toBeGreaterThan(48.8);
  });
});
