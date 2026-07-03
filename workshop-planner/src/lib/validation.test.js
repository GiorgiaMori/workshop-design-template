import { describe, expect, it } from 'vitest'
import { samplePlan } from '../data/samplePlan'
import { validatePlan } from './validation'

describe('validatePlan', () => {
  it('passes the included sample with feasible verdict', () => {
    const result = validatePlan(samplePlan)
    expect(result.errors).toHaveLength(0)
    expect(result.verdict).toBe('Feasible')
  })

  it('fails when objective mapping to activity and assessment is missing', () => {
    const broken = {
      ...samplePlan,
      activities: samplePlan.activities.map((item) => ({ ...item, objectiveRefs: 'OBJ-1' })),
      assessments: samplePlan.assessments.map((item) => ({ ...item, objectiveRefs: 'OBJ-1' })),
    }

    const result = validatePlan(broken)
    expect(result.errors.join(' ')).toContain('OBJ-2')
    expect(result.errors.join(' ')).toContain('OBJ-3')
    expect(result.verdict).toBe('Not Feasible')
  })

  it('fails UDL minimum checks', () => {
    const broken = {
      ...samplePlan,
      udl: {
        engagementChoices: [],
        representations: ['One representation'],
        expressionOptions: ['One expression option'],
      },
    }

    const result = validatePlan(broken)
    expect(result.errors.join(' ')).toContain('UDL minimum unmet')
  })

  it('enforces worked-example ordering', () => {
    const broken = {
      ...samplePlan,
      sessionPlan: samplePlan.sessionPlan.map((entry) =>
        entry.phase === 'worked-example' ? { ...entry, phase: 'guided-practice' } : entry,
      ),
    }

    const result = validatePlan(broken)
    expect(result.errors.join(' ')).toContain('At least one worked example is required')
  })

  it('enforces must-know and guided practice ratio', () => {
    const broken = {
      ...samplePlan,
      sessionPlan: samplePlan.sessionPlan.map((entry) => ({
        ...entry,
        category: 'other',
      })),
    }

    const result = validatePlan(broken)
    expect(result.errors.join(' ')).toContain('Must-know + guided practice must be between 60% and 70%')
  })
})
