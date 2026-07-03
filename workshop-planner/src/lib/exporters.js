export function toJsonBlob(plan) {
  return new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' })
}

export function toMarkdown(plan, validation) {
  const objectives = plan.objectives
    .map(
      (objective) =>
        `- **${objective.id}** ${objective.statement}\n  - Measurable verb: ${objective.measurableVerb}\n  - Criterion: ${objective.criterion}`,
    )
    .join('\n')

  const scope = plan.scopeItems
    .map((item) => `- ${item.topic} — ${item.bucket} — ${item.decision} (${item.reason || 'No reason provided'})`)
    .join('\n')

  const cuts = validation.suggestions
    .filter((item) => item.action !== 'Keep now')
    .map((item) => `- ${item.topic}: ${item.action} (${item.reason})`)
    .join('\n')

  const session = plan.sessionPlan
    .map(
      (entry) =>
        `- ${entry.minutes} min | ${entry.title} | ${entry.category} | ${entry.phase} | Objectives: ${entry.objectiveRefs || 'None'}`,
    )
    .join('\n')

  const udlRows = [
    ...plan.udl.engagementChoices.filter((item) => item.trim()).map((item) => `- Engagement: ${item}`),
    ...plan.udl.representations.filter((item) => item.trim()).map((item) => `- Representation: ${item}`),
    ...plan.udl.expressionOptions.filter((item) => item.trim()).map((item) => `- Action/Expression: ${item}`),
  ].join('\n')

  const activities = plan.activities
    .map(
      (activity) =>
        `- **${activity.title}** (Objectives: ${activity.objectiveRefs || 'None'})\n  - Prompt: ${activity.prompt}\n  - Input/materials: ${activity.inputMaterials}\n  - Expected output: ${activity.expectedOutput}\n  - Interpretation guidance: ${activity.interpretationGuidance}\n  - Extension option: ${activity.extensionOption}`,
    )
    .join('\n')

  const evidence = plan.assessments
    .map((assessment) => `- ${assessment.title} (Objectives: ${assessment.objectiveRefs || 'None'}) — ${assessment.evidence}`)
    .join('\n')

  return `# Workshop Plan\n
## Training Goal\n${plan.goal}\n
## Learners & Variability (UDL)\n${plan.audience}\n\n${plan.variability}\n
## Learning Objectives (measurable)\n${objectives}\n
## Feasibility Verdict\n**${validation.verdict}**\n
## Scope Control (In/Out; Must/Should/Nice)\n${scope}\n
## What I Cut (and why)\n${cuts || '- No cuts recorded.'}\n
## Timeboxed Session Plan\n${session}\n
## UDL Implementation Table\n${udlRows}\n
## Hands-on Activities\n${activities}\n
## Assessment Strategy + Evidence Map\n${evidence}\n
## Materials/Setup/Accessibility\n${plan.materialsSetupAccessibility}\n
## Pitfalls, Supports, Reproducibility, Ethics\n- Pitfalls & Supports: ${plan.pitfallsSupports}\n- Reproducibility/Ethics/Privacy/FAIR: ${plan.ethicsPrivacyFair}\n- Reproducibility details: ${plan.reproducibility}\n
## Adaptation Paths (short workshop, semester, self-paced)\n${plan.adaptationPaths}\n`
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
