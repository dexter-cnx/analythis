export type { AnalysisRule, RuleResult, RiskSeverity, AnalysisContext } from './types';
export { RuleEngine } from './engine';

import { noCyclesRule } from './dependency/no-cycles.rule';
import { highCouplingRule } from './dependency/high-coupling.rule';
import { boundaryViolationRule } from './dependency/boundary-violation.rule';
import { mixedConcernsRule } from './architecture/mixed-concerns.rule';
import { missingServiceLayerRule } from './architecture/missing-service-layer.rule';
import { dtoLeakRule } from './architecture/dto-leak.rule';
import { deepNestingRule } from './structure/deep-nesting.rule';
import { oversizedSharedRule } from './structure/oversized-shared.rule';
import { configScatterRule } from './cross-cutting/config-scatter.rule';
import { authScatterRule } from './cross-cutting/auth-scatter.rule';
import { RuleEngine } from './engine';

export const allRules = [
  noCyclesRule,
  highCouplingRule,
  boundaryViolationRule,
  missingServiceLayerRule,
  dtoLeakRule,
  mixedConcernsRule,
  deepNestingRule,
  oversizedSharedRule,
  configScatterRule,
  authScatterRule
];

export const defaultRuleEngine = new RuleEngine(allRules);
