const WEAPONS = {
  sword_shield: { baseDamage: 12, range: 2.5, cooldownTicks: 20, name: 'Espada e Escudo' },
  greatsword:   { baseDamage: 20, range: 3,   cooldownTicks: 35, name: 'Espadão' },
  dual_daggers: { baseDamage: 8,  range: 1.5, cooldownTicks: 12, name: 'Adagas Duplas' },
  bow:          { baseDamage: 14, range: 15,  cooldownTicks: 25, name: 'Arco' },
  staff:        { baseDamage: 10, range: 12,  cooldownTicks: 22, name: 'Cajado' },
  warhammer:    { baseDamage: 18, range: 3,   cooldownTicks: 40, name: 'Martelo de Guerra' },
};

const ESSENCES = {
  fire:    { bonusDamage: 8,  manaCost: 10, effect: 'burn',    name: 'Fogo' },
  ice:     { bonusDamage: 5,  manaCost: 8,  effect: 'slow',    name: 'Gelo' },
  shadow:  { bonusDamage: 6,  manaCost: 12, effect: 'dot',     name: 'Sombra' },
  light:   { bonusDamage: 3,  manaCost: 15, effect: 'heal',    name: 'Luz' },
  thunder: { bonusDamage: 10, manaCost: 14, effect: 'aoe',     name: 'Trovão' },
  earth:   { bonusDamage: 4,  manaCost: 10, effect: 'barrier', name: 'Terra' },
};

class CombatSystem {
  constructor() {
    this.cooldowns = new Map();
  }

  getWeaponDamage(weaponType) {
    return WEAPONS[weaponType]?.baseDamage || 0;
  }

  getWeaponRange(weaponType) {
    return WEAPONS[weaponType]?.range || 0;
  }

  getEssenceBonus(essenceType) {
    return ESSENCES[essenceType]?.bonusDamage || 0;
  }

  calculateAttack(weaponType, essenceType) {
    const weapon = WEAPONS[weaponType];
    const essence = ESSENCES[essenceType];
    if (!weapon) return { damage: 0, essenceEffect: null };

    const variance = 0.85 + Math.random() * 0.30;
    const baseDmg = weapon.baseDamage + (essence ? essence.bonusDamage : 0);
    const totalDamage = Math.round(baseDmg * variance);

    return {
      damage: totalDamage,
      essenceEffect: essence ? essence.effect : null,
    };
  }

  isInRange(attacker, target, weaponType) {
    const range = this.getWeaponRange(weaponType);
    const dx = target.x - attacker.x;
    const dz = target.z - attacker.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist <= range;
  }

  tryAttack(playerId) {
    const remaining = this.cooldowns.get(playerId) || 0;
    if (remaining > 0) {
      return { allowed: false, remainingTicks: remaining };
    }
    this.cooldowns.set(playerId, 20);
    return { allowed: true };
  }

  tick() {
    for (const [id, ticks] of this.cooldowns) {
      if (ticks <= 0) {
        this.cooldowns.delete(id);
      } else {
        this.cooldowns.set(id, ticks - 1);
      }
    }
  }

  useSkill(essenceType, currentMana) {
    const essence = ESSENCES[essenceType];
    if (!essence) return { success: false, reason: 'unknown_essence' };
    if (currentMana < essence.manaCost) return { success: false, reason: 'no_mana' };

    const variance = 0.85 + Math.random() * 0.30;
    const damage = Math.round(essence.bonusDamage * 2 * variance);

    return {
      success: true,
      damage,
      manaCost: essence.manaCost,
      effect: essence.effect,
    };
  }

  removePlayer(playerId) {
    this.cooldowns.delete(playerId);
  }
}

export { CombatSystem, WEAPONS, ESSENCES };
