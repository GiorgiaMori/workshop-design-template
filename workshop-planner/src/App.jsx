import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { samplePlan } from './data/samplePlan'
import { toJsonBlob, toMarkdown, downloadBlob } from './lib/exporters'
import { validatePlan } from './lib/validation'

const STORAGE_KEY = 'workshop-designer-plan-v1'

const steps = [
  'Goal & Audience',
  'Learning Objectives',
  'Scope Triage',
  'Timeboxed Session Plan',
  'UDL Implementation',
  'Hands-on Activities',
  'Assessment + Evidence',
  'Reproducibility/Ethics/Privacy/FAIR',
  'Review & Export',
]

const emptyPlan = {
  goal: '',
  audience: '',
  variability: '',
  durationMinutes: 120,
  coreConceptCount: 8,
  objectives: [{ id: 'OBJ-1', statement: '', measurableVerb: '', criterion: '' }],
  scopeItems: [{ id: 'SC-1', topic: '', bucket: 'Must', decision: 'In', reason: '' }],
  sessionPlan: [
    { id: 'TS-1', title: '', minutes: 15, category: 'must-know', phase: 'worked-example', objectiveRefs: 'OBJ-1' },
  ],
  udl: {
    engagementChoices: [''],
    representations: ['', ''],
    expressionOptions: ['', ''],
  },
  activities: [
    {
      id: 'ACT-1',
      title: '',
      objectiveRefs: 'OBJ-1',
      prompt: '',
      inputMaterials: '',
      expectedOutput: '',
      interpretationGuidance: '',
      extensionOption: '',
    },
  ],
  assessments: [{ id: 'AS-1', title: '', objectiveRefs: 'OBJ-1', evidence: '' }],
  jargon: [{ id: 'J-1', term: '', definition: '' }],
  reproducibility: '',
  ethicsPrivacyFair: '',
  materialsSetupAccessibility: '',
  pitfallsSupports: '',
  adaptationPaths: '',
}

const nextId = (prefix, items) => {
  const maxSuffix = items.reduce((max, item) => {
    const [, suffix = '0'] = (item.id || '').split('-')
    const value = Number.parseInt(suffix, 10)
    return Number.isNaN(value) ? max : Math.max(max, value)
  }, 0)
  return `${prefix}-${maxSuffix + 1}`
}

function App() {
  const [plan, setPlan] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return emptyPlan
    try {
      return JSON.parse(stored)
    } catch {
      return emptyPlan
    }
  })
  const [currentStep, setCurrentStep] = useState(0)
  const validation = useMemo(() => validatePlan(plan), [plan])
  const markdown = useMemo(() => toMarkdown(plan, validation), [plan, validation])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
  }, [plan])

  const updateList = (key, updateFn) => setPlan((prev) => ({ ...prev, [key]: updateFn(prev[key]) }))
  const updateUdl = (key, value) => setPlan((prev) => ({ ...prev, udl: { ...prev.udl, [key]: value } }))

  const addObjective = () =>
    updateList('objectives', (items) => [...items, { id: nextId('OBJ', items), statement: '', measurableVerb: '', criterion: '' }])
  const addScopeItem = () =>
    updateList('scopeItems', (items) => [...items, { id: nextId('SC', items), topic: '', bucket: 'Should', decision: 'In', reason: '' }])
  const addSessionEntry = () =>
    updateList('sessionPlan', (items) => [
      ...items,
      { id: nextId('TS', items), title: '', minutes: 15, category: 'other', phase: 'guided-practice', objectiveRefs: '' },
    ])
  const addActivity = () =>
    updateList('activities', (items) => [
      ...items,
      {
        id: nextId('ACT', items),
        title: '',
        objectiveRefs: '',
        prompt: '',
        inputMaterials: '',
        expectedOutput: '',
        interpretationGuidance: '',
        extensionOption: '',
      },
    ])
  const addAssessment = () =>
    updateList('assessments', (items) => [...items, { id: nextId('AS', items), title: '', objectiveRefs: '', evidence: '' }])
  const addJargon = () => updateList('jargon', (items) => [...items, { id: nextId('J', items), term: '', definition: '' }])

  const removeItem = (key, id) => updateList(key, (items) => (items.length > 1 ? items.filter((item) => item.id !== id) : items))

  const exportPlan = () => {
    downloadBlob(new Blob([markdown], { type: 'text/markdown' }), 'plan.md')
    downloadBlob(toJsonBlob(plan), 'plan.json')
  }

  return (
    <div className="app-shell">
      <header>
        <h1>Bioinformatics Workshop Designer</h1>
        <p>Build high-quality, inclusive 1–4 hour training plans with enforceable alignment, UDL, and feasibility checks.</p>
      </header>

      <nav aria-label="Wizard steps" className="stepper">
        {steps.map((step, index) => (
          <button key={step} className={index === currentStep ? 'active' : ''} onClick={() => setCurrentStep(index)}>
            {index + 1}. {step}
          </button>
        ))}
      </nav>

      <main>
        {currentStep === 0 && (
          <section>
            <h2>Goal & Audience</h2>
            <label>Training Goal<textarea value={plan.goal} onChange={(event) => setPlan((prev) => ({ ...prev, goal: event.target.value }))} /></label>
            <label>Learners<textarea value={plan.audience} onChange={(event) => setPlan((prev) => ({ ...prev, audience: event.target.value }))} /></label>
            <label>Learner Variability (UDL)<textarea value={plan.variability} onChange={(event) => setPlan((prev) => ({ ...prev, variability: event.target.value }))} /></label>
            <div className="row">
              <label>
                Workshop duration (minutes)
                <input
                  type="number"
                  min="60"
                  max="240"
                  value={plan.durationMinutes}
                  onChange={(event) => setPlan((prev) => ({ ...prev, durationMinutes: Number(event.target.value) || 0 }))}
                />
              </label>
              <label>
                New core concepts
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={plan.coreConceptCount}
                  onChange={(event) => setPlan((prev) => ({ ...prev, coreConceptCount: Number(event.target.value) || 0 }))}
                />
              </label>
            </div>
          </section>
        )}

        {currentStep === 1 && (
          <section>
            <h2>Learning Objectives</h2>
            {plan.objectives.map((objective, index) => (
              <article key={objective.id} className="card">
                <h3>{objective.id}</h3>
                <label>
                  Objective statement
                  <input
                    value={objective.statement}
                    onChange={(event) =>
                      updateList('objectives', (items) =>
                        items.map((item) => (item.id === objective.id ? { ...item, statement: event.target.value } : item)),
                      )
                    }
                  />
                </label>
                <div className="row">
                  <label>
                    Measurable verb
                    <input
                      value={objective.measurableVerb}
                      onChange={(event) =>
                        updateList('objectives', (items) =>
                          items.map((item) => (item.id === objective.id ? { ...item, measurableVerb: event.target.value } : item)),
                        )
                      }
                    />
                  </label>
                  <label>
                    Criterion / evidence
                    <input
                      value={objective.criterion}
                      onChange={(event) =>
                        updateList('objectives', (items) =>
                          items.map((item) => (item.id === objective.id ? { ...item, criterion: event.target.value } : item)),
                        )
                      }
                    />
                  </label>
                </div>
                {index > 0 && (
                  <button type="button" onClick={() => removeItem('objectives', objective.id)}>
                    Remove objective
                  </button>
                )}
              </article>
            ))}
            <button type="button" onClick={addObjective}>
              Add objective
            </button>
          </section>
        )}

        {currentStep === 2 && (
          <section>
            <h2>Scope Triage</h2>
            {plan.scopeItems.map((item, index) => (
              <article key={item.id} className="card">
                <h3>{item.id}</h3>
                <label>
                  Topic
                  <input
                    value={item.topic}
                    onChange={(event) =>
                      updateList('scopeItems', (items) =>
                        items.map((entry) => (entry.id === item.id ? { ...entry, topic: event.target.value } : entry)),
                      )
                    }
                  />
                </label>
                <div className="row">
                  <label>
                    Bucket
                    <select
                      value={item.bucket}
                      onChange={(event) =>
                        updateList('scopeItems', (items) =>
                          items.map((entry) => (entry.id === item.id ? { ...entry, bucket: event.target.value } : entry)),
                        )
                      }
                    >
                      <option>Must</option>
                      <option>Should</option>
                      <option>Nice</option>
                      <option>Instructor Background</option>
                    </select>
                  </label>
                  <label>
                    Decision
                    <select
                      value={item.decision}
                      onChange={(event) =>
                        updateList('scopeItems', (items) =>
                          items.map((entry) => (entry.id === item.id ? { ...entry, decision: event.target.value } : entry)),
                        )
                      }
                    >
                      <option>In</option>
                      <option>Out</option>
                    </select>
                  </label>
                </div>
                <label>
                  Reason
                  <input
                    value={item.reason}
                    onChange={(event) =>
                      updateList('scopeItems', (items) =>
                        items.map((entry) => (entry.id === item.id ? { ...entry, reason: event.target.value } : entry)),
                      )
                    }
                  />
                </label>
                {index > 0 && (
                  <button type="button" onClick={() => removeItem('scopeItems', item.id)}>
                    Remove scope item
                  </button>
                )}
              </article>
            ))}
            <button type="button" onClick={addScopeItem}>
              Add scope item
            </button>
          </section>
        )}

        {currentStep === 3 && (
          <section>
            <h2>Timeboxed Session Plan</h2>
            {plan.sessionPlan.map((entry, index) => (
              <article key={entry.id} className="card">
                <h3>{entry.id}</h3>
                <label>
                  Segment title
                  <input
                    value={entry.title}
                    onChange={(event) =>
                      updateList('sessionPlan', (items) =>
                        items.map((item) => (item.id === entry.id ? { ...item, title: event.target.value } : item)),
                      )
                    }
                  />
                </label>
                <div className="row">
                  <label>
                    Minutes
                    <input
                      type="number"
                      min="5"
                      value={entry.minutes}
                      onChange={(event) =>
                        updateList('sessionPlan', (items) =>
                          items.map((item) =>
                            item.id === entry.id ? { ...item, minutes: Number(event.target.value) || 0 } : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Category
                    <select
                      value={entry.category}
                      onChange={(event) =>
                        updateList('sessionPlan', (items) =>
                          items.map((item) => (item.id === entry.id ? { ...item, category: event.target.value } : item)),
                        )
                      }
                    >
                      <option value="must-know">Must-know</option>
                      <option value="guided-practice">Guided practice</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label>
                    Phase
                    <select
                      value={entry.phase}
                      onChange={(event) =>
                        updateList('sessionPlan', (items) =>
                          items.map((item) => (item.id === entry.id ? { ...item, phase: event.target.value } : item)),
                        )
                      }
                    >
                      <option value="intro">Intro</option>
                      <option value="worked-example">Worked example</option>
                      <option value="guided-practice">Guided practice</option>
                      <option value="independent-practice">Independent practice</option>
                      <option value="assessment">Assessment</option>
                      <option value="wrap">Wrap</option>
                    </select>
                  </label>
                </div>
                <label>
                  Objective IDs (comma separated)
                  <input
                    value={entry.objectiveRefs}
                    onChange={(event) =>
                      updateList('sessionPlan', (items) =>
                        items.map((item) => (item.id === entry.id ? { ...item, objectiveRefs: event.target.value } : item)),
                      )
                    }
                  />
                </label>
                {index > 0 && (
                  <button type="button" onClick={() => removeItem('sessionPlan', entry.id)}>
                    Remove segment
                  </button>
                )}
              </article>
            ))}
            <button type="button" onClick={addSessionEntry}>
              Add session segment
            </button>
          </section>
        )}

        {currentStep === 4 && (
          <section>
            <h2>UDL Implementation Table</h2>
            <fieldset>
              <legend>Engagement choices (minimum 1)</legend>
              {plan.udl.engagementChoices.map((value, index) => (
                <input
                  key={`engagement-${index}`}
                  value={value}
                  onChange={(event) =>
                    updateUdl(
                      'engagementChoices',
                      plan.udl.engagementChoices.map((entry, itemIndex) => (itemIndex === index ? event.target.value : entry)),
                    )
                  }
                />
              ))}
              <button type="button" onClick={() => updateUdl('engagementChoices', [...plan.udl.engagementChoices, ''])}>
                Add engagement choice
              </button>
            </fieldset>

            <fieldset>
              <legend>Representations (minimum 2)</legend>
              {plan.udl.representations.map((value, index) => (
                <input
                  key={`representation-${index}`}
                  value={value}
                  onChange={(event) =>
                    updateUdl(
                      'representations',
                      plan.udl.representations.map((entry, itemIndex) => (itemIndex === index ? event.target.value : entry)),
                    )
                  }
                />
              ))}
              <button type="button" onClick={() => updateUdl('representations', [...plan.udl.representations, ''])}>
                Add representation
              </button>
            </fieldset>

            <fieldset>
              <legend>Action/Expression options (minimum 2)</legend>
              {plan.udl.expressionOptions.map((value, index) => (
                <input
                  key={`expression-${index}`}
                  value={value}
                  onChange={(event) =>
                    updateUdl(
                      'expressionOptions',
                      plan.udl.expressionOptions.map((entry, itemIndex) => (itemIndex === index ? event.target.value : entry)),
                    )
                  }
                />
              ))}
              <button type="button" onClick={() => updateUdl('expressionOptions', [...plan.udl.expressionOptions, ''])}>
                Add expression option
              </button>
            </fieldset>
          </section>
        )}

        {currentStep === 5 && (
          <section>
            <h2>Hands-on Activities</h2>
            {plan.activities.map((activity, index) => (
              <article key={activity.id} className="card">
                <h3>{activity.id}</h3>
                <label>
                  Activity title
                  <input
                    value={activity.title}
                    onChange={(event) =>
                      updateList('activities', (items) =>
                        items.map((item) => (item.id === activity.id ? { ...item, title: event.target.value } : item)),
                      )
                    }
                  />
                </label>
                <label>
                  Objective IDs (comma separated)
                  <input
                    value={activity.objectiveRefs}
                    onChange={(event) =>
                      updateList('activities', (items) =>
                        items.map((item) => (item.id === activity.id ? { ...item, objectiveRefs: event.target.value } : item)),
                      )
                    }
                  />
                </label>
                {[
                  ['prompt', 'Prompt'],
                  ['inputMaterials', 'Input/materials'],
                  ['expectedOutput', 'Expected output'],
                  ['interpretationGuidance', 'Interpretation guidance'],
                  ['extensionOption', 'Extension option'],
                ].map(([field, label]) => (
                  <label key={field}>
                    {label}
                    <textarea
                      value={activity[field]}
                      onChange={(event) =>
                        updateList('activities', (items) =>
                          items.map((item) => (item.id === activity.id ? { ...item, [field]: event.target.value } : item)),
                        )
                      }
                    />
                  </label>
                ))}
                {index > 0 && (
                  <button type="button" onClick={() => removeItem('activities', activity.id)}>
                    Remove activity
                  </button>
                )}
              </article>
            ))}
            <button type="button" onClick={addActivity}>
              Add activity
            </button>
          </section>
        )}

        {currentStep === 6 && (
          <section>
            <h2>Assessment + Evidence Map</h2>
            {plan.assessments.map((assessment, index) => (
              <article key={assessment.id} className="card">
                <h3>{assessment.id}</h3>
                <label>
                  Assessment title
                  <input
                    value={assessment.title}
                    onChange={(event) =>
                      updateList('assessments', (items) =>
                        items.map((item) => (item.id === assessment.id ? { ...item, title: event.target.value } : item)),
                      )
                    }
                  />
                </label>
                <label>
                  Objective IDs (comma separated)
                  <input
                    value={assessment.objectiveRefs}
                    onChange={(event) =>
                      updateList('assessments', (items) =>
                        items.map((item) => (item.id === assessment.id ? { ...item, objectiveRefs: event.target.value } : item)),
                      )
                    }
                  />
                </label>
                <label>
                  Evidence
                  <textarea
                    value={assessment.evidence}
                    onChange={(event) =>
                      updateList('assessments', (items) =>
                        items.map((item) => (item.id === assessment.id ? { ...item, evidence: event.target.value } : item)),
                      )
                    }
                  />
                </label>
                {index > 0 && (
                  <button type="button" onClick={() => removeItem('assessments', assessment.id)}>
                    Remove assessment
                  </button>
                )}
              </article>
            ))}
            <button type="button" onClick={addAssessment}>
              Add assessment
            </button>
          </section>
        )}

        {currentStep === 7 && (
          <section>
            <h2>Reproducibility / Ethics / Privacy / FAIR</h2>
            <label>
              Reproducibility notes
              <textarea
                value={plan.reproducibility}
                onChange={(event) => setPlan((prev) => ({ ...prev, reproducibility: event.target.value }))}
              />
            </label>
            <label>
              Ethics / Privacy / FAIR
              <textarea
                value={plan.ethicsPrivacyFair}
                onChange={(event) => setPlan((prev) => ({ ...prev, ethicsPrivacyFair: event.target.value }))}
              />
            </label>
            <label>
              Materials / Setup / Accessibility
              <textarea
                value={plan.materialsSetupAccessibility}
                onChange={(event) => setPlan((prev) => ({ ...prev, materialsSetupAccessibility: event.target.value }))}
              />
            </label>
            <label>
              Pitfalls and supports
              <textarea
                value={plan.pitfallsSupports}
                onChange={(event) => setPlan((prev) => ({ ...prev, pitfallsSupports: event.target.value }))}
              />
            </label>
            <label>
              Adaptation paths
              <textarea
                value={plan.adaptationPaths}
                onChange={(event) => setPlan((prev) => ({ ...prev, adaptationPaths: event.target.value }))}
              />
            </label>

            <h3>Jargon first-use definitions</h3>
            {plan.jargon.map((item, index) => (
              <div key={item.id} className="card">
                <label>
                  Term
                  <input
                    value={item.term}
                    onChange={(event) =>
                      updateList('jargon', (items) =>
                        items.map((entry) => (entry.id === item.id ? { ...entry, term: event.target.value } : entry)),
                      )
                    }
                  />
                </label>
                <label>
                  Definition
                  <input
                    value={item.definition}
                    onChange={(event) =>
                      updateList('jargon', (items) =>
                        items.map((entry) => (entry.id === item.id ? { ...entry, definition: event.target.value } : entry)),
                      )
                    }
                  />
                </label>
                {index > 0 && (
                  <button type="button" onClick={() => removeItem('jargon', item.id)}>
                    Remove term
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addJargon}>
              Add jargon term
            </button>
          </section>
        )}

        {currentStep === 8 && (
          <section>
            <h2>Review & Export</h2>
            <p>
              <strong>Feasibility verdict:</strong> {validation.verdict}
            </p>
            <div className="status-grid">
              <article>
                <h3>Actionable errors ({validation.errors.length})</h3>
                <ul>
                  {validation.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </article>
              <article>
                <h3>Warnings ({validation.warnings.length})</h3>
                <ul>
                  {validation.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </article>
              <article>
                <h3>Scope surgery suggestions</h3>
                <ul>
                  {validation.suggestions.map((suggestion) => (
                    <li key={`${suggestion.topic}-${suggestion.action}`}>
                      <strong>{suggestion.action}:</strong> {suggestion.topic} — {suggestion.reason}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
            <div className="row">
              <button type="button" onClick={() => setPlan(samplePlan)}>
                Load sample 2-hour workshop
              </button>
              <button type="button" onClick={() => setPlan(emptyPlan)}>
                Reset draft
              </button>
              <button type="button" onClick={exportPlan} disabled={validation.errors.length > 0}>
                Export plan.md + plan.json
              </button>
            </div>
            <h3>Live preview</h3>
            <pre>{markdown}</pre>
          </section>
        )}
      </main>

      <footer className="row">
        <button type="button" onClick={() => setCurrentStep((value) => Math.max(value - 1, 0))}>
          Previous
        </button>
        <button type="button" onClick={() => setCurrentStep((value) => Math.min(value + 1, steps.length - 1))}>
          Next
        </button>
      </footer>
    </div>
  )
}

export default App
