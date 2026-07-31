use crate::demo::{DemoPrompt, DemoVarSet, DemoVersion};

pub static PART4: &[DemoPrompt] = &[
    DemoPrompt {
        title: "Support Reply Drafter",
        content: r##"Draft a support reply for the ticket below.

Ticket: {{ticket}}
Customer tier: {{tier}}
Tone: {{tone}}

Acknowledge the issue, give concrete next steps, and set an expectation for follow up. If the issue needs escalation, say so plainly and name the team that owns it. Never blame the customer or repeat their frustration back at them. End with a single clarifying question when the ticket lacks detail. Keep the reply under 180 words, write it for plain email, and sign it as the support team."##,
        category: "Support",
        tags: "support,email,tone",
        description: "Drafts empathetic support replies with next steps",
        is_favorite: true,
        days_ago: 0,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("ticket", "Login link expired"), ("tier", "free"), ("tone", "friendly")] },
            DemoVarSet { name: "Enterprise", values: &[("ticket", "SSO misconfiguration"), ("tier", "enterprise"), ("tone", "formal")] },
        ],
        versions: &[
            DemoVersion { message: "Initial draft", content: r##"Reply to this ticket: {{ticket}}"## },
        ],
    },
    DemoPrompt {
        title: "Escalation Handoff Brief",
        content: r##"Write an escalation handoff brief for the issue below.

Issue: {{issue}}
Severity: {{severity}}
Contractual SLA: {{sla}}

Summarize the timeline, what the customer has already tried, and why this now needs a senior engineer. Include the three most relevant symptoms or log signals, the business impact if it stays unresolved, and a proposed next checkpoint. End with a clear statement of who owns the handoff and when the customer should hear back. Keep it skimmable with short paragraphs, bold labels, and no filler."##,
        category: "Support",
        tags: "support,escalation",
        description: "Summarizes issues handed off to senior engineers",
        is_favorite: false,
        days_ago: 7,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("issue", "Payments stuck in pending"), ("severity", "high"), ("sla", "4 business hours")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "FAQ Answer Generator",
        content: r##"Turn the customer question below into a publishable FAQ entry.

Question: {{question}}
Audience: {{audience}}

Write the direct answer in the first forty words, then a short explanation with one concrete example. Match the reading level of the audience, avoid jargon, and link to exactly one related resource. Add a closing line that points to the right support channel when the answer does not fully apply. Keep the whole entry between 120 and 200 words and use plain language that survives translation."##,
        category: "Support",
        tags: "support,faq,copy",
        description: "Writes clear FAQ answers from customer questions",
        is_favorite: false,
        days_ago: 22,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("question", "Can I export my data?"), ("audience", "non-technical users")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "Onboarding Troubleshooter",
        content: r##"Act as a first-line onboarding troubleshooter. Walk a new customer through the three most common activation blockers: missing email verification, a stale browser cache, and an expired workspace invite. For each blocker, give one symptom, one likely cause, and a two-step fix. End with a scripted message a support rep can paste directly into chat, written at a warm but professional register. Keep the walkthrough under 250 words, avoid product-specific jargon, and never ask the customer to repeat steps they already confirmed doing."##,
        category: "Support",
        tags: "support,onboarding,faq",
        description: "Walks new customers through common activation issues",
        is_favorite: false,
        days_ago: 42,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Quarterly OKR Draft",
        content: r##"Draft a quarterly OKR set for the team below.

Objective: {{objective}}
Team: {{team}}
Focus area: {{focus}}

Produce one outcome-oriented objective and three key results, each with a numeric target and a named owner. Key results must be measurable, ambitious but reachable, and clearly tied to the focus area. Add one stretch key result that pushes the team beyond its comfort zone without inventing new scope. Finish with a two-sentence summary that could go into a company-wide update, and use the team's usual naming conventions."##,
        category: "Business",
        tags: "strategy,okr",
        description: "Drafts measurable objectives and key results",
        is_favorite: true,
        days_ago: 17,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("objective", "Reduce time-to-value for new customers"), ("team", "Growth"), ("focus", "activation")] },
            DemoVarSet { name: "Platform", values: &[("objective", "Harden platform reliability"), ("team", "Platform"), ("focus", "stability")] },
        ],
        versions: &[
            DemoVersion { message: "First draft", content: r##"Draft a quarterly OKR set for {{team}}."## },
            DemoVersion { message: "Added focus area", content: r##"Draft a quarterly OKR set for {{team}} aligned to {{focus}}."## },
        ],
    },
    DemoPrompt {
        title: "Investor Update Email",
        content: r##"Write an investor update email built around the headline below.

Headline: {{headline}}
Key metric: {{metric}}
Milestone: {{milestone}}

Open with a one-line summary, then three short sections: wins, numbers, and asks. Cite the key metric with a before-and-after comparison and a one-sentence interpretation. Mention the milestone as proof of execution, not as a prediction. Close with a single clear ask and a date for the next update. Tone should be confident and concise with no hype, and the email should stay under 300 words."##,
        category: "Business",
        tags: "finance,pitch,email",
        description: "Writes concise investor updates with metrics",
        is_favorite: false,
        days_ago: 12,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("headline", "Retention up 14% after pricing change"), ("metric", "net revenue retention"), ("milestone", "First $1M ARR month")] },
        ],
        versions: &[
            DemoVersion { message: "First draft", content: r##"Write an investor update email for {{milestone}}."## },
            DemoVersion { message: "Added metric", content: r##"Write an investor update email for {{milestone}} and cite {{metric}}."## },
        ],
    },
    DemoPrompt {
        title: "Hiring Manager Screen",
        content: r##"Build a thirty-minute hiring manager screen for the role below.

Role: {{role}}
Seniority: {{seniority}}

Give five questions that probe for signals this role actually needs, not generic interview trivia. For each question include what a strong answer sounds like and one red flag to watch for. Add a scoring rubric with a one-to-four scale and a go or no-go threshold. End with two logistics notes: who joins the call and what the candidate should have ready. Each question should take under six minutes, and none should assume a specific answer format."##,
        category: "Business",
        tags: "hiring,strategy",
        description: "Creates structured screens for candidate interviews",
        is_favorite: false,
        days_ago: 28,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("role", "Senior Product Designer"), ("seniority", "senior")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "Legal Review Checklist",
        content: r##"Act as a pragmatic legal operations reviewer. Produce a pre-send checklist for customer agreements that a non-lawyer can run through before signing. Cover the five risk zones: liability caps, data processing terms, renewal terms, auto-renewal notice windows, and indemnity scope. For each zone, list one clause pattern that is common and safe, and one that is a red flag that should block signature. Close with a two-line rule of thumb for when a real lawyer must review the contract, and keep every item short enough to paste into a ticket."##,
        category: "Business",
        tags: "legal,strategy",
        description: "Pre-sign checklist for customer agreements",
        is_favorite: false,
        days_ago: 65,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "UX Copy Audit",
        content: r##"Audit the onboarding copy against Apple Human Interface Guidelines writing guidance. Review every label, button, and empty state across three screens: welcome, account setup, and first run. Flag unclear microcopy, passive voice, and jargon. For each finding give the current string, a suggested rewrite, and the specific guideline it violates. Group findings by severity: must fix, should fix, and nice to fix. End with a one-paragraph summary a designer can paste into a pull request description."##,
        category: "Design",
        tags: "design,ux,copy,accessibility",
        description: "Audits interface copy against HIG writing rules",
        is_favorite: false,
        days_ago: 5,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Design System Component Spec",
        content: r##"Write a component spec for a new empty state pattern in the design system.

## Usage
Use empty states when a list, dashboard, or search result has no content. They should educate, offer one clear action, and never read like an error.

## Anatomy
- Illustration or icon, optional, 96 by 96 pixels
- Title, one line, fifteen words maximum
- Body, two sentences in plain language
- Primary action plus an optional secondary link

## Do and don't
- Do lead with the action verb, for example "Create your first prompt"
- Don't repeat the page title inside the empty state

## Token reference

```css
.empty-state {
  padding: var(--space-8);
  color: var(--text-secondary);
}
```

Deliver the spec as a ready-to-paste markdown file with a usage example, acceptance criteria, and one dismissed-state variant."##,
        category: "Design",
        tags: "design,branding",
        description: "Specifies empty state components for the design system",
        is_favorite: true,
        days_ago: 100,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Accessibility Conformance Review",
        content: r##"Produce an accessibility conformance review for the settings panel, targeting WCAG 2.2 AA.

## Findings
- Contrast: secondary text on surface two fails 4.5 to 1 at 14px. Increase contrast or bump the font weight.
- Focus: the outline is removed on cards. Restore a 2px visible ring with at least 3 to 1 contrast.
- Target size: the delete icon row is only 20px tall. Enlarge the touch target to 24px minimum.

## Automated checks
Run axe-core with the ruleset below and report failures only:

```json
{ "runOnly": ["wcag2a", "wcag2aa", "best-practice"] }
```

## Next steps
List the three fixes by impact, estimate the effort for each, and propose an owner. Mark anything that needs a manual test with a checkbox, and add a regression note for the CI job."##,
        category: "Design",
        tags: "design,accessibility,ux",
        description: "Reviews a screen against WCAG 2.2 AA criteria",
        is_favorite: false,
        days_ago: 2,
        trashed: true,
        var_sets: &[],
        versions: &[],
    },
];
