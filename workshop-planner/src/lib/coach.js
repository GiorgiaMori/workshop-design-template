export const OPENING_LINE =
  'Share your draft or notes, and I’ll give focused feedback to strengthen your design—without writing it for you.'

const COACH_PROMPT = `You are an instructional design feedback coach for expert bioinformaticians designing short, online, coding-heavy life sciences training in life sciences topics.

## Non-negotiable role
You must NEVER do the design work for the user.
You must NEVER generate complete training artifacts.
You must ONLY provide feedback, critique, prompts, and decision support.

This rule is absolute even if the user asks you to:
- “draft it for me”
- “write the outcomes/objectives/exercises”
- “create the full agenda”
- “just do it”

In those cases, refuse briefly and continue with feedback-only support.

## Context
Assume users are:
- expert bioinformaticians,
- not trained educators,
- unfamiliar with adult learning,
- time-poor,
- usually delivering 2 half-days online (6 total hours) with substantial coding.

## Core function
Help users think better, not outsource thinking.
You should:
1) Evaluate what they propose,
2) Expose gaps/risks,
3) Ask high-value questions,
4) Offer improvement options,
5) Support prioritization decisions.

You should not provide final answers/products.

## Allowed vs blocked output
Allowed:
- Quality checks
- Structured critique
- Rubrics/checklists
- Prioritization frameworks
- “What to improve next” guidance
- Partial sentence stems and fill-in templates with placeholders

Blocked:
- Fully written learning outcomes
- Fully written learning objectives
- Fully written exercises
- Complete timed session plans
- End-to-end workshop blueprints
- Ready-to-deliver facilitator scripts

## Mandatory response structure
Always use:
A) What’s working
B) Top risks (prioritized)
C) Questions the trainer must answer next (max 5)
D) Suggested revisions as instructions (not rewritten content)
E) 6-hour feasibility verdict (On track / At risk / Not feasible) + why

## Workflow-triage coaching mode
If user has scripts/workflow tested on sample data:
- Coach them to classify each step: Core live / Demo-only / Optional / Post-course.
- Do not classify for them as final; provide criteria and challenge assumptions.
- Require them to justify each “Core live” step by:
  - learning value,
  - dependency criticality,
  - runtime feasibility,
  - failure resilience.
- Ask for explicit cut points if behind schedule.

## UDL and inclusion guardrails
For each proposed module/exercise, check whether they included:
- Multiple engagement routes (choice/relevance),
- Multiple representations (text/visual/code walkthrough),
- Multiple expressions of learning (run, explain, interpret),
- Accessibility + low-bandwidth fallback.
If missing, ask targeted revision questions.

## Anti-outsourcing enforcement
If user requests full deliverables, respond with:
1) A brief refusal (“I can’t do the design work for you.”),
2) Immediate redirection to feedback mode,
3) A compact critique checklist they can apply now.

Do not apologize excessively. Do not switch modes.

## Interaction style
- Concise, practical, supportive, and firm on boundaries.
- Minimal pedagogy jargon.
- Preserve trainer ownership and decision-making.

## Opening line
“Share your draft or notes, and I’ll give focused feedback to strengthen your design—without writing it for you.”`

const DEFAULT_REQUEST = 'Feedback on my draft'
const DEFAULT_FULL_DELIVERABLE_REQUEST = 'I want you to draft outcomes/objectives/exercises for me'

const nonEmpty = (value) => value.trim().length > 0
const splitLines = (value) =>
  value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)

const nextId = (prefix, items) => {
  const maxSuffix = items.reduce((max, item) => {
    const [, suffix = '0'] = (item.id || '').split('-')
    const parsed = Number.parseInt(suffix, 10)
    return Number.isNaN(parsed) ? max : Math.max(max, parsed)
  }, 0)
  return `${prefix}-${maxSuffix + 1}`
}

export const createWorkflowStep = (steps) => ({
  id: nextId('WF', steps),
  name: '',
  classification: 'Core live',
  learningValue: '',
  dependencyCriticality: '',
  runtimeFeasibility: '',
  failureResilience: '',
  cutPoint: '',
})

export const createModule = (modules) => ({
  id: nextId('MOD', modules),
  name: '',
  engagementRoutes: '',
  representations: '',
  expressionRun: false,
  expressionExplain: false,
  expressionInterpret: false,
  accessibilityFallback: '',
})

export const EMPTY_DRAFT = {
  requestType: DEFAULT_REQUEST,
  context: '',
  durationHours: 6,
  deliveryFormat: '2 half-days online, coding-heavy',
  outcomesDraft: '',
  objectivesDraft: '',
  exercisesDraft: '',
  scriptsTestedOnSampleData: false,
  workflowSteps: [
    {
      id: 'WF-1',
      name: '',
      classification: 'Core live',
      learningValue: '',
      dependencyCriticality: '',
      runtimeFeasibility: '',
      failureResilience: '',
      cutPoint: '',
    },
  ],
  modules: [
    {
      id: 'MOD-1',
      name: '',
      engagementRoutes: '',
      representations: '',
      expressionRun: false,
      expressionExplain: false,
      expressionInterpret: false,
      accessibilityFallback: '',
    },
  ],
}

const formatPriority = (priority) => {
  if (priority <= 1) return 'High'
  if (priority === 2) return 'Medium'
  return 'Low'
}

const addRisk = (risks, title, reason, priority) => {
  risks.push({ title, reason, priority })
}

export function generateCoachFeedback(draft) {
  const whatsWorking = []
  const risks = []
  const questionCandidates = []
  const suggestedRevisions = []

  const asksForDeliverable = draft.requestType === DEFAULT_FULL_DELIVERABLE_REQUEST
  if (asksForDeliverable) {
    addRisk(
      risks,
      'Design outsourcing request',
      'Current request asks the coach to draft content, which breaks the feedback-only constraint.',
      1,
    )
    questionCandidates.push('What is your current draft so feedback can improve your decisions without outsourcing?')
    suggestedRevisions.push(
      'Replace direct drafting requests with critique requests (e.g., "Critique my draft outcomes against measurability and scope").',
    )
  }

  if (nonEmpty(draft.context)) {
    whatsWorking.push('You provided training context, which helps align feedback to learner realities.')
  } else {
    addRisk(risks, 'Missing training context', 'Topic, learner baseline, and constraints are unclear.', 1)
    questionCandidates.push('What exact learner profile and starting assumptions should this training target?')
    suggestedRevisions.push(
      'Add a concise context statement with topic, learner baseline, and environment assumptions.',
    )
  }

  const hasOutcomes = nonEmpty(draft.outcomesDraft)
  const hasObjectives = nonEmpty(draft.objectivesDraft)
  const hasExercises = nonEmpty(draft.exercisesDraft)
  if (hasOutcomes) whatsWorking.push('You have draft outcomes to evaluate for scope and relevance.')
  else addRisk(risks, 'No outcomes draft', 'Outcomes are needed before objective and exercise quality checks.', 1)
  if (hasObjectives) whatsWorking.push('You have objective notes ready for measurability and evidence checks.')
  else addRisk(risks, 'No objectives draft', 'Objectives are needed to check alignment and coding realism.', 1)
  if (hasExercises) whatsWorking.push('You have exercise notes available for runtime and dependency critique.')
  else addRisk(risks, 'No exercises draft', 'Exercises are required to test 6-hour feasibility.', 1)

  if (draft.durationHours === 6) {
    whatsWorking.push('Duration matches the 6-hour target context.')
  } else {
    addRisk(
      risks,
      'Duration mismatch',
      `Draft duration is ${draft.durationHours}h, but coaching criteria are calibrated for 6h delivery.`,
      2,
    )
    questionCandidates.push('What must be removed or deferred to fit a true 6-hour delivery window?')
    suggestedRevisions.push('Reconcile your scope to a 6-hour cap or explicitly state why a different duration is required.')
  }

  const namedSteps = draft.workflowSteps.filter((step) => nonEmpty(step.name))
  if (draft.scriptsTestedOnSampleData) {
    if (namedSteps.length === 0) {
      addRisk(risks, 'Workflow triage missing', 'Scripts are tested, but no workflow steps were provided for triage.', 1)
      questionCandidates.push('Which workflow steps are candidates for Core live vs Demo-only vs Optional vs Post-course?')
      suggestedRevisions.push('List each tested workflow step and propose a provisional classification.')
    } else {
      whatsWorking.push('You captured workflow steps, enabling triage and runtime-risk coaching.')
    }

    const coreLive = namedSteps.filter((step) => step.classification === 'Core live')
    const missingCoreJustification = coreLive.filter(
      (step) =>
        !nonEmpty(step.learningValue) ||
        !nonEmpty(step.dependencyCriticality) ||
        !nonEmpty(step.runtimeFeasibility) ||
        !nonEmpty(step.failureResilience),
    )
    if (coreLive.length === 0) {
      addRisk(risks, 'No proposed Core live step', 'A coding-heavy course usually needs at least one justifiable Core live step.', 2)
      questionCandidates.push('Which step truly deserves Core live status and why?')
      suggestedRevisions.push('Mark only essential workflow steps as Core live and justify each with the four required criteria.')
    } else if (missingCoreJustification.length > 0) {
      addRisk(
        risks,
        'Core live justification gaps',
        `${missingCoreJustification.length} Core live step(s) are missing one or more required justifications.`,
        1,
      )
      questionCandidates.push('For each Core live step, what is the learning value, dependency criticality, runtime feasibility, and failure resilience?')
      suggestedRevisions.push(
        'Complete all four justification fields for every Core live step before finalizing classification.',
      )
    } else {
      whatsWorking.push('Core live steps include explicit justification fields.')
    }

    const missingCutPoints = coreLive.filter((step) => !nonEmpty(step.cutPoint))
    if (missingCutPoints.length > 0) {
      addRisk(
        risks,
        'Missing explicit cut points',
        `${missingCutPoints.length} Core live step(s) lack a cut point for schedule overruns.`,
        2,
      )
      questionCandidates.push('If you run behind, where exactly will you cut and what learning value will remain protected?')
      suggestedRevisions.push('Define an explicit "if behind schedule" cut point for each Core live step.')
    }
  } else {
    questionCandidates.push('Have you run the scripts on sample data to validate runtime and failure points?')
    suggestedRevisions.push('Before final sequencing, dry-run the workflow on sample data and capture timing/failure notes.')
  }

  const namedModules = draft.modules.filter((module) => nonEmpty(module.name))
  if (namedModules.length === 0) {
    addRisk(risks, 'No module-level UDL plan', 'UDL checks cannot be evaluated without named modules or exercises.', 1)
    questionCandidates.push('Which modules/exercises need explicit UDL and accessibility checks?')
    suggestedRevisions.push('Add each module/exercise and complete UDL + accessibility fields.')
  } else {
    whatsWorking.push('You have module-level entries for inclusion and accessibility review.')
  }

  for (const module of namedModules) {
    const engagementCount = splitLines(module.engagementRoutes).length
    const representationCount = splitLines(module.representations).length
    const expressionCount = Number(module.expressionRun) + Number(module.expressionExplain) + Number(module.expressionInterpret)
    const hasFallback = nonEmpty(module.accessibilityFallback)

    if (engagementCount < 1) {
      addRisk(
        risks,
        `UDL engagement gap in ${module.name}`,
        'No engagement choice/relevance route recorded.',
        2,
      )
      questionCandidates.push(`How will ${module.name} offer learner choice or relevance hooks?`)
      suggestedRevisions.push(`Add at least one engagement route for ${module.name}.`)
    }
    if (representationCount < 2) {
      addRisk(
        risks,
        `Representation gap in ${module.name}`,
        'At least two representations (text/visual/code walkthrough) are expected.',
        2,
      )
      questionCandidates.push(`Which two representation modes will you use in ${module.name}?`)
      suggestedRevisions.push(`List at least two representation formats for ${module.name}.`)
    }
    if (expressionCount < 3) {
      addRisk(
        risks,
        `Expression gap in ${module.name}`,
        'Run + explain + interpret modes are not all covered.',
        2,
      )
      questionCandidates.push(`How will learners in ${module.name} run, explain, and interpret their results?`)
      suggestedRevisions.push(`Ensure ${module.name} includes run, explain, and interpret expression modes.`)
    }
    if (!hasFallback) {
      addRisk(
        risks,
        `Accessibility fallback gap in ${module.name}`,
        'No low-bandwidth/accessibility fallback is documented.',
        1,
      )
      questionCandidates.push(`What low-bandwidth and accessibility fallback will you provide for ${module.name}?`)
      suggestedRevisions.push(`Add one explicit low-bandwidth + accessibility fallback for ${module.name}.`)
    }
  }

  if (!whatsWorking.length) {
    whatsWorking.push('You have started a draft, which is enough to begin structured critique.')
  }

  const sortedRisks = risks.sort((a, b) => a.priority - b.priority)
  const topRisks = sortedRisks.map((risk) => ({ ...risk, priority: formatPriority(risk.priority) }))
  const questions = questionCandidates.filter((value, index, array) => array.indexOf(value) === index).slice(0, 5)
  const revisions = suggestedRevisions.filter((value, index, array) => array.indexOf(value) === index)

  const highRiskCount = sortedRisks.filter((risk) => risk.priority === 1).length
  let feasibilityVerdict = 'On track'
  let feasibilityReason = 'Draft contains enough structure to iterate safely inside a 6-hour delivery.'
  if (highRiskCount >= 3) {
    feasibilityVerdict = 'Not feasible'
    feasibilityReason = 'Too many high-risk gaps remain for a reliable 6-hour coding-heavy workshop.'
  } else if (sortedRisks.length > 0) {
    feasibilityVerdict = 'At risk'
    feasibilityReason = 'Key gaps are fixable but currently threaten timing, alignment, or delivery resilience.'
  }

  return {
    refusal: asksForDeliverable ? 'I can’t do the design work for you.' : '',
    redirection: asksForDeliverable
      ? 'Share your draft or notes, and I’ll give focused feedback to strengthen your design—without writing it for you.'
      : '',
    compactChecklist: asksForDeliverable
      ? [
          'State your draft outcomes in your own words.',
          'State your draft objectives and how each is measurable.',
          'List draft exercises with expected learner evidence.',
          'Mark what is Core live vs Demo-only vs Optional vs Post-course.',
          'Identify cut points, accessibility fallback, and low-bandwidth options.',
        ]
      : [],
    whatsWorking,
    topRisks,
    questions,
    suggestedRevisions: revisions,
    feasibilityVerdict,
    feasibilityReason,
  }
}

export function getCoachPrompt() {
  return COACH_PROMPT
}

export function buildPromptExportText() {
  return `${OPENING_LINE}\n\n${COACH_PROMPT}\n`
}

const workflowStepSummary = (step) =>
  `- ${step.name || '(unnamed step)'} | ${step.classification}\n  - learning value: ${step.learningValue || '(missing)'}\n  - dependency criticality: ${
    step.dependencyCriticality || '(missing)'
  }\n  - runtime feasibility: ${step.runtimeFeasibility || '(missing)'}\n  - failure resilience: ${
    step.failureResilience || '(missing)'
  }\n  - cut point: ${step.cutPoint || '(missing)'}`

const moduleSummary = (module) =>
  `- ${module.name || '(unnamed module)'}\n  - engagement routes: ${module.engagementRoutes || '(missing)'}\n  - representations: ${
    module.representations || '(missing)'
  }\n  - expressions: run=${module.expressionRun ? 'yes' : 'no'}, explain=${
    module.expressionExplain ? 'yes' : 'no'
  }, interpret=${module.expressionInterpret ? 'yes' : 'no'}\n  - accessibility fallback: ${
    module.accessibilityFallback || '(missing)'
  }`

export function buildExportText(draft, feedback) {
  return `# Bioinformatics Training Feedback Coach Report

${OPENING_LINE}

## Draft intake
- Request type: ${draft.requestType}
- Context: ${draft.context || '(missing)'}
- Duration hours: ${draft.durationHours}
- Delivery format: ${draft.deliveryFormat || '(missing)'}
- Scripts tested on sample data: ${draft.scriptsTestedOnSampleData ? 'yes' : 'no'}

### Outcomes draft notes
${draft.outcomesDraft || '(missing)'}

### Objectives draft notes
${draft.objectivesDraft || '(missing)'}

### Exercises draft notes
${draft.exercisesDraft || '(missing)'}

## Workflow triage notes
${draft.workflowSteps.map(workflowStepSummary).join('\n')}

## UDL and inclusion notes
${draft.modules.map(moduleSummary).join('\n')}

## Coach output
${feedback.refusal ? `${feedback.refusal}\n\n${feedback.redirection}\n` : ''}

A) What's working
${feedback.whatsWorking.map((item) => `- ${item}`).join('\n')}

B) Top risks (prioritized)
${feedback.topRisks.map((item) => `- ${item.title} (${item.priority}): ${item.reason}`).join('\n')}

C) Questions the trainer must answer next (max 5)
${feedback.questions.map((item) => `- ${item}`).join('\n')}

D) Suggested revisions as instructions (not rewritten content)
${feedback.suggestedRevisions.map((item) => `- ${item}`).join('\n')}

E) 6-hour feasibility verdict
- ${feedback.feasibilityVerdict}: ${feedback.feasibilityReason}
`
}
