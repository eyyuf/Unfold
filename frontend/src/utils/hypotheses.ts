import type { UserHypothesisData } from '@/types'

export function groupHypotheses(hypotheses: UserHypothesisData[]) {
  return {
    supported: hypotheses.filter((hypothesis) => hypothesis.status === 'supported'),
    emerging: hypotheses.filter((hypothesis) => hypothesis.status === 'emerging'),
    uncertain: hypotheses.filter((hypothesis) => hypothesis.status === 'uncertain'),
    contradicted: hypotheses.filter((hypothesis) => hypothesis.status === 'contradicted'),
  }
}
