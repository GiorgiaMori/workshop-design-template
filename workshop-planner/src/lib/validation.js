const MEASURABLE_VERBS = new Set([
  'analyze',
  'apply',
  'build',
  'calculate',
  'compare',
  'create',
  'define',
  'demonstrate',
  'describe',
  'evaluate',
  'explain',
  'identify',
  'implement',
  'interpret',
  'measure',
  'run',
  'test',
])

export const parseObjectiveRefs = (value) =>
  (value || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

export function validatePlan(plan) {
  const errors = []
  const warnings = []
  const objectiveIds = new Set(plan.objectives.map((objective) => objective.id))

  if (!plan.objectives.length) {
    errors.push('No objective-free content allowed: add at least one learning objective.')
  }

  for (const objective of plan.objectives) {
    if (!objective.statement.trim()) {
      errors.push(`Objective ${objective.id} is missing a statement.`)
    }
    if (!objective.measurableVerb.trim()) {
      errors.push(`Objective ${objective.id} must include a measurable verb.`)
    } else if (!MEASURABLE_VERBS.has(objective.measurableVerb.trim().toLowerCase())) {
      errors.push(`Objective ${objective.id} uses a verb outside the measurable verb list.`)
    }
    if (!objective.criterion.trim()) {
      errors.push(`Objective ${objective.id} needs measurable evidence criteria.`)
    }
  }

  const objectiveActivityCount = Object.fromEntries(plan.objectives.map((objective) => [objective.id, 0]))
  const objectiveAssessmentCount = Object.fromEntries(plan.objectives.map((objective) => [objective.id, 0]))

  for (const activity of plan.activities) {
    const refs = parseObjectiveRefs(activity.objectiveRefs)
    for (const ref of refs) {
      if (!objectiveIds.has(ref)) {
        errors.push(`Activity ${activity.id} references unknown objective ${ref}.`)
        continue
      }
      objectiveActivityCount[ref] += 1
    }

    for (const field of ['prompt', 'inputMaterials', 'expectedOutput', 'interpretationGuidance', 'extensionOption']) {
      if (!activity[field]?.trim()) {
        errors.push(`Activity ${activity.id} is missing required field: ${field}.`)
      }
    }
  }

  for (const assessment of plan.assessments) {
    const refs = parseObjectiveRefs(assessment.objectiveRefs)
    for (const ref of refs) {
      if (!objectiveIds.has(ref)) {
        errors.push(`Assessment ${assessment.id} references unknown objective ${ref}.`)
        continue
      }
      objectiveAssessmentCount[ref] += 1
    }
    if (!assessment.evidence.trim()) {
      errors.push(`Assessment ${assessment.id} must include evidence.`)
    }
  }

  for (const objective of plan.objectives) {
    if (objectiveActivityCount[objective.id] < 1) {
      errors.push(`Objective ${objective.id} must map to at least one activity.`)
    }
    if (objectiveAssessmentCount[objective.id] < 1) {
      errors.push(`Objective ${objective.id} must map to at least one assessment evidence source.`)
    }
  }

  const durationMinutes = Number(plan.durationMinutes) || 0
  const totalPlannedMinutes = plan.sessionPlan.reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0)
  if (durationMinutes <= 0) {
    errors.push('Duration must be greater than zero minutes.')
  }
  if (totalPlannedMinutes !== durationMinutes) {
    warnings.push(`Session plan totals ${totalPlannedMinutes} minutes, expected ${durationMinutes}.`)
  }

  const mustKnowGuidedMinutes = plan.sessionPlan.reduce((sum, entry) => {
    if (entry.category === 'must-know' || entry.category === 'guided-practice') {
      return sum + (Number(entry.minutes) || 0)
    }
    return sum
  }, 0)
  const mustKnowGuidedRatio = durationMinutes > 0 ? mustKnowGuidedMinutes / durationMinutes : 0
  if (mustKnowGuidedRatio < 0.6 || mustKnowGuidedRatio > 0.7) {
    errors.push('Must-know + guided practice must be between 60% and 70% of total time.')
  }

  const conceptsPerHour = durationMinutes > 0 ? (Number(plan.coreConceptCount) || 0) / (durationMinutes / 60) : 0
  if (conceptsPerHour > 7) {
    errors.push('Core concepts exceed maximum density of 7 per 60 minutes.')
  }
  if (conceptsPerHour < 5) {
    warnings.push('Core concepts are below the 5-7 target range per 60 minutes.')
  }

  const firstWorked = plan.sessionPlan.findIndex((entry) => entry.phase === 'worked-example')
  const firstIndependent = plan.sessionPlan.findIndex((entry) => entry.phase === 'independent-practice')
  if (firstWorked === -1) {
    errors.push('At least one worked example is required.')
  }
  if (firstIndependent !== -1 && (firstWorked === -1 || firstWorked > firstIndependent)) {
    errors.push('A worked example must occur before independent practice.')
  }

  for (const term of plan.jargon) {
    if (term.term.trim() && !term.definition.trim()) {
      errors.push(`Define jargon on first use: ${term.term}.`)
    }
  }

  if (plan.udl.engagementChoices.filter((entry) => entry.trim()).length < 1) {
    errors.push('UDL minimum unmet: include at least one engagement choice.')
  }
  if (plan.udl.representations.filter((entry) => entry.trim()).length < 2) {
    errors.push('UDL minimum unmet: include at least two representations for core concepts.')
  }
  if (plan.udl.expressionOptions.filter((entry) => entry.trim()).length < 2) {
    errors.push('UDL minimum unmet: include at least two expression options.')
  }

  const suggestions = plan.scopeItems.map((item) => {
    if (item.decision === 'Out') {
      return { topic: item.topic, action: 'Remove', reason: item.reason || 'Marked out of scope.' }
    }
    if (item.bucket === 'Must') {
      return { topic: item.topic, action: 'Keep now', reason: item.reason || 'Essential for must-know objectives.' }
    }
    if (item.bucket === 'Should') {
      return {
        topic: item.topic,
        action: errors.length ? 'Defer' : 'Keep now',
        reason: errors.length ? 'Protect feasibility by deferring should-have content.' : (item.reason || 'Fits current scope.'),
      }
    }
    return {
      topic: item.topic,
      action: errors.length || warnings.length ? 'Remove' : 'Defer',
      reason: item.reason || 'Optional content for later iterations.',
    }
  })

  const verdict = errors.length ? 'Not Feasible' : warnings.length ? 'At Risk' : 'Feasible'

  return {
    errors,
    warnings,
    verdict,
    suggestions,
    metrics: {
      durationMinutes,
      totalPlannedMinutes,
      mustKnowGuidedRatio,
      conceptsPerHour,
    },
  }
}
