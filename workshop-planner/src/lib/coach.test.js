import { describe, expect, it } from 'vitest'
import { EMPTY_DRAFT, generateCoachFeedback } from './coach'

describe('generateCoachFeedback', () => {
  it('returns mandatory structure and limits questions to max 5', () => {
    const feedback = generateCoachFeedback(EMPTY_DRAFT)
    expect(Array.isArray(feedback.whatsWorking)).toBe(true)
    expect(Array.isArray(feedback.topRisks)).toBe(true)
    expect(Array.isArray(feedback.questions)).toBe(true)
    expect(Array.isArray(feedback.suggestedRevisions)).toBe(true)
    expect(['On track', 'At risk', 'Not feasible']).toContain(feedback.feasibilityVerdict)
    expect(feedback.questions.length).toBeLessThanOrEqual(5)
  })

  it('enforces anti-outsourcing response when full deliverables are requested', () => {
    const feedback = generateCoachFeedback({
      ...EMPTY_DRAFT,
      requestType: 'I want you to draft outcomes/objectives/exercises for me',
    })
    expect(feedback.refusal).toBe('I can’t do the design work for you.')
    expect(feedback.redirection).toContain('Share your draft or notes')
    expect(feedback.compactChecklist.length).toBeGreaterThan(0)
  })

  it('can produce an on-track verdict for a complete draft', () => {
    const feedback = generateCoachFeedback({
      ...EMPTY_DRAFT,
      context: 'RNA-seq differential expression for bench biologists with basic R.',
      outcomesDraft: 'Outcomes present.',
      objectivesDraft: 'Objectives present.',
      exercisesDraft: 'Exercises present.',
      scriptsTestedOnSampleData: true,
      workflowSteps: [
        {
          id: 'WF-1',
          name: 'Run DESeq2 baseline analysis',
          classification: 'Core live',
          learningValue: 'Shows complete analysis flow.',
          dependencyCriticality: 'Needed for downstream interpretation.',
          runtimeFeasibility: 'Verified 15-minute runtime on workshop hardware.',
          failureResilience: 'Includes fallback precomputed object.',
          cutPoint: 'Skip optional plotting branch if behind time.',
        },
      ],
      modules: [
        {
          id: 'MOD-1',
          name: 'DE results interpretation',
          engagementRoutes: 'Learner picks one contrast relevant to their dataset.',
          representations: 'Annotated table walkthrough\nVolcano plot visual',
          expressionRun: true,
          expressionExplain: true,
          expressionInterpret: true,
          accessibilityFallback: 'Static HTML report with screenshots and captions.',
        },
      ],
    })
    expect(feedback.feasibilityVerdict).toBe('On track')
  })
})
