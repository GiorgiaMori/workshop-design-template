import { useMemo, useState } from 'react'
import './App.css'
import {
  EMPTY_DRAFT,
  OPENING_LINE,
  buildExportText,
  buildPromptExportText,
  createModule,
  createWorkflowStep,
  generateCoachFeedback,
  getCoachPrompt,
} from './lib/coach'

const REQUEST_OPTIONS = [
  'Feedback on my draft',
  'I want you to draft outcomes/objectives/exercises for me',
]

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 200)
}

function App() {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [copyState, setCopyState] = useState('')
  const feedback = useMemo(() => generateCoachFeedback(draft), [draft])
  const coachPrompt = useMemo(() => getCoachPrompt(), [])

  const updateWorkflowStep = (id, field, value) => {
    setDraft((prev) => ({
      ...prev,
      workflowSteps: prev.workflowSteps.map((step) => (step.id === id ? { ...step, [field]: value } : step)),
    }))
  }

  const updateModule = (id, field, value) => {
    setDraft((prev) => ({
      ...prev,
      modules: prev.modules.map((module) => (module.id === id ? { ...module, [field]: value } : module)),
    }))
  }

  const copyPrompt = () => {
    navigator.clipboard
      .writeText(coachPrompt)
      .then(() => setCopyState('Prompt copied to clipboard.'))
      .catch((error) => {
        setCopyState(`Copy failed: ${error.message}`)
      })
  }

  return (
    <div className="app-shell">
      <header>
        <h1>Bioinformatics Training Feedback Coach</h1>
        <p>{OPENING_LINE}</p>
      </header>

      <main>
        <section>
          <h2>1) Use this coach prompt in your AI setup</h2>
          <p>This prompt enforces feedback-only coaching and blocks design outsourcing.</p>
          <div className="row">
            <button type="button" onClick={copyPrompt}>
              Copy prompt
            </button>
            <button type="button" onClick={() => downloadTextFile('bioinformatics-feedback-coach-prompt.md', buildPromptExportText())}>
              Download prompt
            </button>
          </div>
          {copyState ? <p className="notice">{copyState}</p> : null}
          <details>
            <summary>View prompt</summary>
            <pre>{coachPrompt}</pre>
          </details>
        </section>

        <section>
          <h2>2) Draft intake</h2>
          <label>
            Request type
            <select
              value={draft.requestType}
              onChange={(event) => setDraft((prev) => ({ ...prev, requestType: event.target.value }))}
            >
              {REQUEST_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Training topic and learner context
            <textarea
              value={draft.context}
              onChange={(event) => setDraft((prev) => ({ ...prev, context: event.target.value }))}
              placeholder="Topic, learner background, technical assumptions."
            />
          </label>
          <div className="row">
            <label>
              Duration (hours)
              <input
                type="number"
                min="1"
                max="20"
                value={draft.durationHours}
                onChange={(event) => setDraft((prev) => ({ ...prev, durationHours: Number(event.target.value) || 0 }))}
              />
            </label>
            <label>
              Delivery format
              <input
                value={draft.deliveryFormat}
                onChange={(event) => setDraft((prev) => ({ ...prev, deliveryFormat: event.target.value }))}
                placeholder="e.g. 2 half-days online with live coding"
              />
            </label>
          </div>
          <label>
            Draft learning outcomes notes
            <textarea
              value={draft.outcomesDraft}
              onChange={(event) => setDraft((prev) => ({ ...prev, outcomesDraft: event.target.value }))}
            />
          </label>
          <label>
            Draft learning objectives notes
            <textarea
              value={draft.objectivesDraft}
              onChange={(event) => setDraft((prev) => ({ ...prev, objectivesDraft: event.target.value }))}
            />
          </label>
          <label>
            Draft exercises notes
            <textarea
              value={draft.exercisesDraft}
              onChange={(event) => setDraft((prev) => ({ ...prev, exercisesDraft: event.target.value }))}
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.scriptsTestedOnSampleData}
              onChange={(event) => setDraft((prev) => ({ ...prev, scriptsTestedOnSampleData: event.target.checked }))}
            />
            Scripts/workflow have been tested on sample data
          </label>
        </section>

        <section>
          <h2>3) Workflow triage (required when scripts are tested)</h2>
          {draft.workflowSteps.map((step, index) => (
            <article key={step.id} className="card">
              <h3>
                Step {index + 1} ({step.id})
              </h3>
              <label>
                Workflow step name
                <input value={step.name} onChange={(event) => updateWorkflowStep(step.id, 'name', event.target.value)} />
              </label>
              <label>
                Proposed classification
                <select
                  value={step.classification}
                  onChange={(event) => updateWorkflowStep(step.id, 'classification', event.target.value)}
                >
                  <option>Core live</option>
                  <option>Demo-only</option>
                  <option>Optional</option>
                  <option>Post-course</option>
                </select>
              </label>
              <div className="grid-two">
                <label>
                  Learning value justification
                  <textarea
                    value={step.learningValue}
                    onChange={(event) => updateWorkflowStep(step.id, 'learningValue', event.target.value)}
                  />
                </label>
                <label>
                  Dependency criticality
                  <textarea
                    value={step.dependencyCriticality}
                    onChange={(event) => updateWorkflowStep(step.id, 'dependencyCriticality', event.target.value)}
                  />
                </label>
                <label>
                  Runtime feasibility
                  <textarea
                    value={step.runtimeFeasibility}
                    onChange={(event) => updateWorkflowStep(step.id, 'runtimeFeasibility', event.target.value)}
                  />
                </label>
                <label>
                  Failure resilience
                  <textarea
                    value={step.failureResilience}
                    onChange={(event) => updateWorkflowStep(step.id, 'failureResilience', event.target.value)}
                  />
                </label>
              </div>
              <label>
                Explicit cut point if behind schedule
                <input value={step.cutPoint} onChange={(event) => updateWorkflowStep(step.id, 'cutPoint', event.target.value)} />
              </label>
              {draft.workflowSteps.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, workflowSteps: prev.workflowSteps.filter((entry) => entry.id !== step.id) }))
                  }
                >
                  Remove step
                </button>
              ) : null}
            </article>
          ))}
          <button
            type="button"
            onClick={() => setDraft((prev) => ({ ...prev, workflowSteps: [...prev.workflowSteps, createWorkflowStep(prev.workflowSteps)] }))}
          >
            Add workflow step
          </button>
        </section>

        <section>
          <h2>4) UDL and inclusion guardrails</h2>
          {draft.modules.map((module, index) => (
            <article key={module.id} className="card">
              <h3>
                Module {index + 1} ({module.id})
              </h3>
              <label>
                Module or exercise name
                <input value={module.name} onChange={(event) => updateModule(module.id, 'name', event.target.value)} />
              </label>
              <label>
                Engagement routes (one per line)
                <textarea
                  value={module.engagementRoutes}
                  onChange={(event) => updateModule(module.id, 'engagementRoutes', event.target.value)}
                  placeholder="Choice, relevance, participation options"
                />
              </label>
              <label>
                Representations (one per line; include text/visual/code walkthrough where possible)
                <textarea
                  value={module.representations}
                  onChange={(event) => updateModule(module.id, 'representations', event.target.value)}
                />
              </label>
              <div className="row checkbox-row">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={module.expressionRun}
                    onChange={(event) => updateModule(module.id, 'expressionRun', event.target.checked)}
                  />
                  Learners run
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={module.expressionExplain}
                    onChange={(event) => updateModule(module.id, 'expressionExplain', event.target.checked)}
                  />
                  Learners explain
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={module.expressionInterpret}
                    onChange={(event) => updateModule(module.id, 'expressionInterpret', event.target.checked)}
                  />
                  Learners interpret
                </label>
              </div>
              <label>
                Accessibility and low-bandwidth fallback
                <textarea
                  value={module.accessibilityFallback}
                  onChange={(event) => updateModule(module.id, 'accessibilityFallback', event.target.value)}
                />
              </label>
              {draft.modules.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, modules: prev.modules.filter((entry) => entry.id !== module.id) }))}
                >
                  Remove module
                </button>
              ) : null}
            </article>
          ))}
          <button type="button" onClick={() => setDraft((prev) => ({ ...prev, modules: [...prev.modules, createModule(prev.modules)] }))}>
            Add module
          </button>
        </section>

        <section>
          <h2>5) Coach output (mandatory structure)</h2>
          {feedback.refusal ? (
            <article className="warning">
              <p>
                <strong>{feedback.refusal}</strong>
              </p>
              <p>{feedback.redirection}</p>
              <h3>Compact critique checklist</h3>
              <ul>
                {feedback.compactChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ) : null}

          <article className="card output">
            <h3>A) What&apos;s working</h3>
            <ul>
              {feedback.whatsWorking.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>B) Top risks (prioritized)</h3>
            <ol>
              {feedback.topRisks.map((item) => (
                <li key={`${item.title}-${item.priority}`}>
                  <strong>{item.title}</strong> ({item.priority}) — {item.reason}
                </li>
              ))}
            </ol>

            <h3>C) Questions the trainer must answer next (max 5)</h3>
            <ol>
              {feedback.questions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>

            <h3>D) Suggested revisions as instructions (not rewritten content)</h3>
            <ul>
              {feedback.suggestedRevisions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>E) 6-hour feasibility verdict</h3>
            <p>
              <strong>
                {feedback.feasibilityVerdict} — {feedback.feasibilityReason}
              </strong>
            </p>
          </article>
          <div className="row">
            <button type="button" onClick={() => downloadTextFile('feedback-coach-report.md', buildExportText(draft, feedback))}>
              Download feedback report
            </button>
            <button type="button" onClick={() => setDraft(EMPTY_DRAFT)}>
              Reset draft
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
