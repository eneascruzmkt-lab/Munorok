import { describe, it, expect, beforeEach } from 'vitest';
import { CombatSystem } from '../../server/CombatSystem.js';

describe('CombatSystem', () => {
  let combat;

  beforeEach(() => {
    combat = new CombatSystem();
  });

  it('should calculate weapon base damage', () => {
    const dmg = combat.getWeaponDamage('sword_shield');
    expect(dmg).toBeGreaterThan(0);
  });

  it('should calculate essence bonus damage', () => {
    const bonus = combat.getEssenceBonus('fire');
    expect(bonus).toBeGreaterThan(0);
  });

  it('should calculate total attack damage', () => {
    const result = combat.calculateAttack('sword_shield', 'fire');
    expect(result.damage).toBeGreaterThan(0);
    expect(result.essenceEffect).toBeDefined();
  });

  it('should respect attack range per weapon', () => {
    const range = combat.getWeaponRange('bow');
    expect(range).toBeGreaterThan(combat.getWeaponRange('sword_shield'));
  });

  it('should check if target is in range', () => {
    const attacker = { x: 0, z: 0 };
    const targetNear = { x: 1, z: 1 };
    const targetFar = { x: 50, z: 50 };
    expect(combat.isInRange(attacker, targetNear, 'sword_shield')).toBe(true);
    expect(combat.isInRange(attacker, targetFar, 'sword_shield')).toBe(false);
  });

  it('should apply cooldown and reject attacks during cooldown', () => {
    const result1 = combat.tryAttack('p1');
    expect(result1.allowed).toBe(true);
    const result2 = combat.tryAttack('p1');
    expect(result2.allowed).toBe(false);
  });

  it('should allow attack after cooldown expires', () => {
    combat.tryAttack('p1');
    for (let i = 0; i < 30; i++) {
      combat.tick();
    }
    const result = combat.tryAttack('p1');
    expect(result.allowed).toBe(true);
  });

  it('should use skill with mana cost', () => {
    const result = combat.useSkill('fire', 50);
    expect(result.success).toBe(true);
    expect(result.manaCost).toBeGreaterThan(0);
    expect(result.damage).toBeGreaterThan(0);
  });

  it('should fail skill when not enough mana', () => {
    const result = combat.useSkill('fire', 0);
    expect(result.success).toBe(false);
  });
});
