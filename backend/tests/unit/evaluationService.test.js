const crypto = require('crypto');
const { evaluateFlag, hashUserForRollout, evaluateTargetingRules } = require('../../src/services/evaluationService');

describe('evaluationService', () => {
  describe('hashUserForRollout', () => {
    test('returns number between 0 and 99', () => {
      const result = hashUserForRollout('test_flag', 'user_123');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(99);
    });

    test('returns consistent hash for same inputs', () => {
      const result1 = hashUserForRollout('test_flag', 'user_123');
      const result2 = hashUserForRollout('test_flag', 'user_123');
      expect(result1).toBe(result2);
    });

    test('returns different hash for different users', () => {
      const result1 = hashUserForRollout('test_flag', 'user_123');
      const result2 = hashUserForRollout('test_flag', 'user_456');
      expect(result1).not.toBe(result2);
    });

    test('returns different hash for different flags', () => {
      const result1 = hashUserForRollout('flag_a', 'user_123');
      const result2 = hashUserForRollout('flag_b', 'user_123');
      expect(result1).not.toBe(result2);
    });
  });

  describe('evaluateTargetingRules', () => {
    const userId = 'user_123';
    const attributes = { role: 'admin', plan: 'premium', age: 25 };

    test('returns null for empty rules', () => {
      const result = evaluateTargetingRules([], userId, attributes);
      expect(result).toBeNull();
    });

    test('evaluates user_id equals rule', () => {
      const rules = [{ type: 'user_id', operator: 'equals', value: 'user_123' }];
      const result = evaluateTargetingRules(rules, userId, attributes);
      expect(result).toBe(true);
    });

    test('evaluates user_id not_equals rule', () => {
      const rules = [{ type: 'user_id', operator: 'not_equals', value: 'user_456' }];
      const result = evaluateTargetingRules(rules, userId, attributes);
      expect(result).toBe(true);
    });

    test('evaluates user_id in rule', () => {
      const rules = [{ type: 'user_id', operator: 'in', values: ['user_123', 'user_456'] }];
      const result = evaluateTargetingRules(rules, userId, attributes);
      expect(result).toBe(true);
    });

    test('evaluates user_id not_in rule', () => {
      const rules = [{ type: 'user_id', operator: 'not_in', values: ['user_456', 'user_789'] }];
      const result = evaluateTargetingRules(rules, userId, attributes);
      expect(result).toBe(true);
    });

    test('evaluates user_attribute equals rule', () => {
      const rules = [{ type: 'user_attribute', operator: 'equals', key: 'role', value: 'admin' }];
      const result = evaluateTargetingRules(rules, userId, attributes);
      expect(result).toBe(true);
    });

    test('evaluates user_attribute greater_than rule', () => {
      const rules = [{ type: 'user_attribute', operator: 'greater_than', key: 'age', value: 20 }];
      const result = evaluateTargetingRules(rules, userId, attributes);
      expect(result).toBe(true);
    });

    test('evaluates user_attribute less_than rule', () => {
      const rules = [{ type: 'user_attribute', operator: 'less_than', key: 'age', value: 30 }];
      const result = evaluateTargetingRules(rules, userId, attributes);
      expect(result).toBe(true);
    });

    test('evaluates user_attribute contains rule', () => {
      const rules = [{ type: 'user_attribute', operator: 'contains', key: 'role', value: 'admin' }];
      const result = evaluateTargetingRules(rules, userId, attributes);
      expect(result).toBe(true);
    });

    test('returns false when all rules fail', () => {
      const rules = [
        { type: 'user_id', operator: 'equals', value: 'user_456' },
        { type: 'user_attribute', operator: 'equals', key: 'role', value: 'user' }
      ];
      const result = evaluateTargetingRules(rules, userId, attributes);
      expect(result).toBe(false);
    });

    test('returns true when any rule passes', () => {
      const rules = [
        { type: 'user_id', operator: 'equals', value: 'user_456' },
        { type: 'user_attribute', operator: 'equals', key: 'role', value: 'admin' }
      ];
      const result = evaluateTargetingRules(rules, userId, attributes);
      expect(result).toBe(true);
    });
  });

  describe('evaluateFlag', () => {
    const userId = 'user_123';
    const attributes = { role: 'admin' };

    test('returns false when flag is disabled', () => {
      const flag = {
        enabled: false,
        rollout_percentage: 100,
        targeting_rules: []
      };
      const result = evaluateFlag(flag, userId, attributes);
      expect(result).toBe(false);
    });

    test('returns true when targeting rules match', () => {
      const flag = {
        enabled: true,
        rollout_percentage: 0,
        targeting_rules: [{ type: 'user_id', operator: 'equals', value: 'user_123' }]
      };
      const result = evaluateFlag(flag, userId, attributes);
      expect(result).toBe(true);
    });

    test('returns false when targeting rules do not match', () => {
      const flag = {
        enabled: true,
        rollout_percentage: 0,
        targeting_rules: [{ type: 'user_id', operator: 'equals', value: 'user_456' }]
      };
      const result = evaluateFlag(flag, userId, attributes);
      expect(result).toBe(false);
    });

    test('uses rollout percentage when no targeting rules', () => {
      const flag = {
        key: 'test_flag',
        enabled: true,
        rollout_percentage: 100,
        targeting_rules: []
      };
      const result = evaluateFlag(flag, userId, attributes);
      expect(typeof result).toBe('boolean');
    });

    test('evaluates consistently for same user', () => {
      const flag = {
        key: 'test_flag',
        enabled: true,
        rollout_percentage: 50,
        targeting_rules: []
      };
      const result1 = evaluateFlag(flag, userId, attributes);
      const result2 = evaluateFlag(flag, userId, attributes);
      expect(result1).toBe(result2);
    });
  });
});