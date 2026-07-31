use crate::demo::{DemoPrompt, DemoVarSet, DemoVersion};

pub static PART3: &[DemoPrompt] = &[
    DemoPrompt {
        title: "Meeting Summarizer",
        content: r##"Summarize the meeting notes below into a clear, structured brief for the requested audience.

Notes:
{{notes}}

Audience: {{audience}}

Return the output in four sections:

1. Decisions made during the meeting, with the rationale where it was stated.
2. Action items, each with an owner name and a target date.
3. Open questions raised but not resolved during the discussion.
4. A one-paragraph executive summary of the whole conversation.

Write in plain, professional language. Do not invent details that are not present in the notes, and flag gaps explicitly when the material is incomplete."##,
        category: "Productivity",
        tags: "meeting,summary,notes",
        description: "Turns raw meeting notes into decisions and action items",
        is_favorite: true,
        days_ago: 1,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("notes", "Q3 planning sync"), ("audience", "engineering leads")] },
            DemoVarSet { name: "Client call", values: &[("notes", "Acme onboarding call"), ("audience", "account team")] },
        ],
        versions: &[
            DemoVersion { message: "Initial draft", content: r##"Summarize these notes: {{notes}}"## },
            DemoVersion { message: "Structured format", content: r##"Summarize these notes into decisions, action items, and open questions: {{notes}}"## },
        ],
    },
    DemoPrompt {
        title: "Retrospective Facilitation Guide",
        content: r##"Act as an experienced agile coach facilitating a sprint retrospective.

## Session Structure

Run the session in four timed blocks:

- **Gather data** — collect wins, struggles, and surprises from the team.
- **Generate insights** — group similar items and find root causes.
- **Decide actions** — pick up to three experiments for the next sprint.
- **Close** — summarize commitments and schedule the next session.

## Facilitation Rules

- Keep each block timeboxed; do not let discussion drift.
- Invite quiet members before letting talkers dominate.
- Capture everything verbatim, then group afterwards.

## Output Template

Return your facilitation notes using this structure:

```text
RETRO: <sprint name>
WIN: <what worked>
STRUGGLE: <what hurt>
ACTION: <owner> will <experiment> by <date>
NEXT: <one-line follow-up>
```

Stay neutral and non-judgmental in every framing of the feedback, and end with a one-paragraph summary the team can share with stakeholders."##,
        category: "Productivity",
        tags: "workflow,planning,checklist",
        description: "Facilitates structured sprint retrospectives with output templates",
        is_favorite: false,
        days_ago: 4,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Quarterly OKR Planner",
        content: r##"Help me draft quarterly OKRs for {{quarter}}.

Team focus areas:
{{focus_areas}}

Team capacity this quarter: {{team_capacity}}

For each focus area, produce the following:

1. One ambitious but realistic objective phrased as an outcome, not an activity.
2. Two or three key results with concrete, measurable targets.
3. A suggested owner for each key result.

Prefer a small number of high-impact objectives over a long list. Close with a short risk section covering the factors most likely to prevent the team from hitting its targets, and suggest one leading indicator for each objective to track progress early."##,
        category: "Productivity",
        tags: "planning,workflow",
        description: "Drafts quarterly objectives and key results with owners and risks",
        is_favorite: false,
        days_ago: 6,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("quarter", "Q4"), ("focus_areas", "performance, reliability, developer experience"), ("team_capacity", "3 engineers, 1 designer")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "Inbox Zero Workflow",
        content: r##"Act as a productivity consultant and design a sustainable inbox-zero workflow for a busy professional.

Cover these areas in your recommendations:

1. A daily triage schedule with a fixed time block and a hard stop.
2. A folder or label structure with no more than six categories.
3. Clear rules for delete, delegate, defer, and do-now decisions.
4. A weekly review ritual to clear the archive and update project lists.
5. Templates for common replies so recurring messages take seconds.

Keep the workflow simple enough to run in under thirty minutes a day, and explain how to handle the inevitable days when the inbox is overrun. End with a seven-day ramp-up plan to install the habit, including what to skip when time is short."##,
        category: "Productivity",
        tags: "workflow,checklist,planning",
        description: "Designs a sustainable inbox-zero routine with weekly review",
        is_favorite: false,
        days_ago: 8,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Lesson Plan Builder",
        content: r##"Design a complete lesson plan for the topic "{{topic}}".

Audience: {{grade_level}}
Class length: {{duration}}

Include the following sections:

- Learning objectives written as measurable, observable outcomes.
- A five-minute hook that activates prior knowledge.
- A guided practice activity with clear, sequential steps.
- An independent task students can complete without teacher help.
- Formative assessment questions to check understanding mid-lesson.
- Differentiation notes for struggling and advanced learners.

Use active verbs in every objective, align each activity to at least one objective, and keep the final plan to one printed page. Add a short materials list and a suggested pacing timeline in minutes."##,
        category: "Education",
        tags: "lesson,teaching,curriculum",
        description: "Builds complete lesson plans with objectives and assessments",
        is_favorite: false,
        days_ago: 10,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("topic", "photosynthesis"), ("grade_level", "grade 7 science"), ("duration", "45 minutes")] },
        ],
        versions: &[
            DemoVersion { message: "Quick outline", content: r##"Outline: draft a lesson plan for {{topic}}"## },
        ],
    },
    DemoPrompt {
        title: "Study Group Facilitator",
        content: r##"Act as a peer tutor who runs focused study group sessions for college students.

Structure every session in four phases:

1. Goal check — each member names one concept they want to master.
2. Explanation round — members take turns explaining a concept from the material.
3. Problem drills — work through three problems of increasing difficulty.
4. Summary — each member states the takeaway in their own words.

Your job is to keep explanations accurate, ask probing questions instead of giving answers, and make sure no member is left behind. Use the Socratic method when someone is stuck, and end each session with a five-question self-quiz for the group to complete before the next meeting. Track recurring misconceptions and revisit them in later sessions."##,
        category: "Education",
        tags: "study,teaching,quiz",
        description: "Runs structured study sessions with Socratic questioning",
        is_favorite: false,
        days_ago: 13,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Vocabulary Quiz Generator",
        content: r##"Generate a vocabulary quiz for the unit "{{unit_topic}}".

Words to cover: {{word_list}}
Student level: {{grade_level}}

Create the quiz with these parts:

- Ten matching items pairing each word with a short definition.
- Five fill-in-the-blank sentences that rely on context clues.
- Three multiple-choice questions testing nuance between synonyms.
- An answer key with one-sentence explanations per item.

Vary the difficulty so an average student finishes in twenty minutes. Include clear instructions at the top, number every question, and avoid reusing the same sentence pattern across items. Mark the two hardest items so the teacher can use them for enrichment."##,
        category: "Education",
        tags: "quiz,study,curriculum,lesson",
        description: "Creates tiered vocabulary quizzes with answer keys",
        is_favorite: true,
        days_ago: 18,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("unit_topic", "Unit 3: ecosystems"), ("word_list", "habitat, biome, predator, herbivore, decomposer"), ("grade_level", "grade 6")] },
            DemoVarSet { name: "Review version", values: &[("unit_topic", "Unit 3 review"), ("word_list", "mixed vocabulary from units 1-3"), ("grade_level", "grade 6")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "Curriculum Gap Analyzer",
        content: r##"Act as a curriculum specialist reviewing a course against its stated standards.

Given a syllabus and its learning objectives, identify gaps in three categories:

- **Coverage gaps** — standards with no corresponding lesson or assessment.
- **Depth gaps** — topics taught at a level below what the standard requires.
- **Assessment gaps** — objectives never measured by a graded task.

Produce a report with a table mapping each standard to lessons and assessments, a prioritized list of the five most critical gaps, and concrete suggestions for closing each one without expanding the total teaching hours. Write in plain language that a department head can act on immediately, and note which gaps can be closed by revising existing materials rather than creating new ones."##,
        category: "Education",
        tags: "curriculum,teaching,lesson",
        description: "Finds coverage, depth, and assessment gaps in a course",
        is_favorite: false,
        days_ago: 26,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Literature Review Synthesizer",
        content: r##"Synthesize the source notes below into the draft of a literature review on {{topic}}.

Source notes:
{{source_notes}}

Organize the review as follows:

1. A thesis paragraph stating the current state of the field.
2. Thematic sections that group sources by approach or finding.
3. A comparison table highlighting agreements and contradictions.
4. A research-gap paragraph pointing to open questions.

Every claim must cite the source it comes from using the bracketed IDs in the notes. Do not insert findings that the notes do not support, and explicitly flag studies whose conclusions conflict with one another. Keep the tone neutral and academic, and finish with a short annotated bibliography of the most influential sources."##,
        category: "Research",
        tags: "research,literature,synthesis,citation",
        description: "Synthesizes source notes into a structured literature review",
        is_favorite: true,
        days_ago: 38,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("topic", "retrieval-augmented generation"), ("source_notes", "[S1] RAG survey; [S2] dense retrieval; [S3] hallucination benchmarks")] },
        ],
        versions: &[
            DemoVersion { message: "First merge", content: r##"Merge the source notes into one narrative: {{source_notes}}"## },
        ],
    },
    DemoPrompt {
        title: "Interview Protocol Designer",
        content: r##"Design a rigorous semi-structured interview protocol for a qualitative research study.

## Protocol Requirements

Include these components in your design:

- A one-page study overview stating the research question and goals.
- An informed-consent script written at an eighth-grade reading level.
- Ten to twelve open-ended questions ordered from broad to specific.
- Follow-up probes for the three most important questions.
- A closing sequence that invites participant corrections and additional comments.

## Question Writing Rules

- Ask one idea per question; never double-barrel.
- Avoid leading language that signals a desired answer.
- Prefer "tell me about" over "did you" phrasing.

## Format

Return the protocol in this structure:

```text
TITLE: <study name>
RQ: <research question>
SAMPLE: <recruitment criteria>
Q1: <question>
PROBE: <follow-up>
```

Include guidance on piloting the protocol and revising questions based on the first two interviews."##,
        category: "Research",
        tags: "research,interview,survey",
        description: "Designs semi-structured interview protocols for qualitative studies",
        is_favorite: false,
        days_ago: 55,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Citation Consistency Checker",
        content: r##"Proofread the manuscript section below against the {{citation_style}} style guide.

Manuscript section:
{{manuscript_section}}

Check the text for each of these issues and report every occurrence:

- In-text citations that are missing, misplaced, or incorrectly formatted.
- Reference list entries whose fields do not match the cited works.
- Punctuation placement around direct quotes.
- Duplicate or conflicting citation keys used across the section.

Output a numbered list with the exact location, the current text, the corrected form, and the applicable rule for each issue. If the section is clean, state that clearly and do not invent problems. End with a summary of the most common citation mistakes found so the author can fix them globally."##,
        category: "Research",
        tags: "citation,literature,research",
        description: "Checks manuscripts for citation and reference formatting errors",
        is_favorite: false,
        days_ago: 80,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("manuscript_section", "Results and discussion with twelve citations"), ("citation_style", "APA 7")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "Academic Survey Question Bank",
        content: r##"Act as a survey methodologist building a question bank for a large-scale academic study.

Produce the following deliverables:

1. A bank of thirty closed-ended questions across five thematic domains.
2. At least six demographic questions following best practices for sensitive items.
3. A five-point Likert scale definition with anchor labels for every construct.
4. Skip logic rules that route respondents around irrelevant branches.
5. Two attention-check items to flag low-effort responses.

Every question must be neutral in wording, free of double negatives, and pretested for comprehension. Add a short note on sampling strategy and the expected completion time so the bank is ready for ethical review, and flag any item that risks social desirability bias."##,
        category: "Research",
        tags: "research,survey,study",
        description: "Builds a validated survey question bank for academic studies",
        is_favorite: false,
        days_ago: 150,
        trashed: true,
        var_sets: &[],
        versions: &[],
    },
];
