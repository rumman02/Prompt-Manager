use crate::demo::{DemoPrompt, DemoVarSet, DemoVersion};

pub static PART1: &[DemoPrompt] = &[
    DemoPrompt {
        title: "Code Review Assistant",
        content: r##"You are an expert reviewer.

Review this {{language}} code focusing on {{focus}}:

```
{{code}}
```

For every issue you find, classify it by severity: critical, major, or minor. Start with a one-paragraph summary of the overall quality, then list findings in priority order.

For each finding, include:
- The exact location in the code where the issue occurs.
- Why the current approach is risky or incorrect in this {{language}} context.
- A concrete fix, with a short code snippet showing the corrected version.

Finish with a short list of what the code does well, so the author knows which patterns to keep. If you cannot determine the intent of a section, say so explicitly instead of guessing."##,
        category: "Development",
        tags: "code,review,quality",
        description: "Reviews code for bugs and style issues",
        is_favorite: true,
        days_ago: 0,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("language", "TypeScript"), ("focus", "security"), ("code", "const x = 1")] },
            DemoVarSet { name: "Rust review", values: &[("language", "Rust"), ("focus", "performance"), ("code", "fn main() {}")] },
        ],
        versions: &[
            DemoVersion { message: "Initial draft", content: r##"Review this code: {{code}}"## },
        ],
    },
    DemoPrompt {
        title: "API Documentation Writer",
        content: r##"You are a senior technical writer specializing in API documentation.

Write complete reference documentation for the {{endpoint}} endpoint of our API. Assume the reader is a developer integrating this endpoint into their own service for the first time.

The documentation must include:
1. A plain-language description of what the endpoint does and when to use it.
2. The full request format, including headers, path parameters, query parameters, and the JSON request body, expressed as a {{language}} example.
3. Every possible response code, with the body shape for success and each error class.
4. At least three realistic usage examples, from simple to advanced.
5. A troubleshooting section covering the most common integration mistakes.

Use consistent terminology, keep each section focused, and never invent fields that were not described to you. If a detail is missing, note it as an open question."##,
        category: "Development",
        tags: "api,docs",
        description: "Writes complete reference docs for API endpoints",
        is_favorite: true,
        days_ago: 2,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("endpoint", "POST /v1/orders"), ("language", "Python")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "Test Case Generator",
        content: r##"You are an expert test engineer.

Generate a thorough test suite for the {{module}} module using the {{framework}} testing framework. Cover happy paths, edge cases, error handling, and boundary conditions.

For each test case, provide:
- A descriptive name following the framework's naming conventions.
- The arrange, act, and assert sections as runnable code.
- A comment explaining the scenario being verified and why it matters.

Prioritize tests that would catch real regressions: invalid inputs, empty collections, null values, concurrent access, and timeout behavior. Include one property-based style test if the module's logic is amenable to it.

After the suite, list any dependencies that need to be mocked, with a short rationale for each mock. Then propose five additional scenarios that are currently untested and that a careful reviewer would expect to see in a production codebase."##,
        category: "Development",
        tags: "testing,quality,automation",
        description: "Generates comprehensive test suites with edge cases",
        is_favorite: false,
        days_ago: 6,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("module", "payment_processor"), ("framework", "Jest")] },
        ],
        versions: &[
            DemoVersion { message: "Initial draft", content: r##"Generate tests for {{module}} using {{framework}}."## },
            DemoVersion { message: "Expanded coverage", content: r##"You are a test engineer. Generate a thorough test suite for {{module}} with {{framework}}, covering happy paths and edge cases."## },
        ],
    },
    DemoPrompt {
        title: "Refactoring Planner",
        content: r##"You are a senior software architect.

Analyze the provided {{language}} codebase and plan a refactoring that introduces the {{pattern}} pattern where it genuinely improves the design. Do not refactor for its own sake.

Produce a plan with these sections:
1. Assessment — the current design smells you found, ranked by impact.
2. Target design — how {{pattern}} applies, with a small before/after sketch for each affected area.
3. Step-by-step migration — ordered increments, each one small enough to land as its own pull request without breaking the build.
4. Risk register — what could go wrong at each step and how to de-risk it.
5. Verification — which tests and manual checks prove the refactor preserved behavior.

Keep each step reviewable by a human: no mega-commits, no silent behavior changes, and no rewrites of unrelated code."##,
        category: "Development",
        tags: "refactor,code,quality",
        description: "Plans step-by-step refactoring toward a target pattern",
        is_favorite: false,
        days_ago: 14,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("language", "TypeScript"), ("pattern", "Strategy")] },
            DemoVarSet { name: "Legacy codebase", values: &[("language", "PHP"), ("pattern", "Repository")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "CI Pipeline Debugger",
        content: r##"You are a CI/CD platform engineer.

The {{stage}} stage of our pipeline, built with {{tool}}, fails intermittently in ways that are hard to reproduce locally. Diagnose the likely causes and give a prioritized action plan.

Start by listing the classic culprits for flaky {{stage}} failures: caching, race conditions between jobs, resource limits, network timeouts, and order-dependent test suites. For each, explain how to confirm it using the {{tool}} logs and artifacts.

Then produce:
- A short checklist of log commands to run and what each output should look like when healthy.
- A fix for the most probable cause, with the exact {{tool}} configuration change.
- A monitoring step so we detect recurrence early, with a suggested threshold.

End with a short note on how to make this stage deterministic, even if it means restructuring the pipeline."##,
        category: "DevOps",
        tags: "ci,debugging,automation",
        description: "Diagnoses flaky CI pipeline failures",
        is_favorite: false,
        days_ago: 1,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("tool", "GitHub Actions"), ("stage", "integration")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "Deployment Runbook Writer",
        content: r##"You are a DevOps engineer writing operational documentation.

Write a deployment runbook for our service. The runbook will be followed by on-call engineers under time pressure, so clarity and step-by-step precision matter more than brevity.

Cover these phases in order:
1. Pre-deployment checks: version bump, changelog review, database migration review, and feature-flag verification.
2. The deployment procedure itself: build, artifact signing, staged rollout across environments, and health checks after each stage.
3. Rollback: the exact trigger conditions, the rollback command sequence, and how to confirm the service is healthy again.
4. Post-deployment: smoke tests, log inspection, and notification of stakeholders.

For every command, show the exact invocation and the expected output. Add a failure-mode table mapping each common error to its cause and remedy. Assume no prior knowledge of the system."##,
        category: "DevOps",
        tags: "deployment,automation,docs",
        description: "Writes step-by-step deployment and rollback runbooks",
        is_favorite: false,
        days_ago: 9,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Monitoring Alert Response Guide",
        content: r##"## Purpose

You are an SRE writing an operational response guide for a new monitoring alert. The guide must let any on-call engineer respond correctly within the first ten minutes.

## Alert Overview

Describe the alert with these sections:

- **Trigger condition**: what metric or log pattern fires it, and the threshold.
- **Severity**: paging priority and expected response time.
- **Worst case impact**: what users or revenue are affected if we do nothing.

## Triage Steps

Follow this order every time:

1. Confirm the alert is real, not a false positive from a deployment or config change.
2. Open the primary dashboard and note the time range that looks abnormal.
3. Check the last deploy window for a correlated change.

## Initial Response

```yaml
investigate:
  - dashboard: overview
  - logs: service_errors
  - metric: latency_p99
escalate_after_minutes: 10
```

## Escalation

List the on-call owner, the secondary owner, and the exact condition for escalating. End with a one-line summary an engineer can paste into the incident channel."##,
        category: "DevOps",
        tags: "monitoring,automation,reporting",
        description: "Builds an on-call response guide for monitoring alerts",
        is_favorite: false,
        days_ago: 21,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Security Audit Checklist",
        content: r##"You are an application security engineer.

Produce a practical security audit checklist for a web application that is about to ship. The checklist should be usable by a developer who is not a security specialist, so each item must state what to look for, why it matters, and how to verify it.

Organize the checklist by category:

Authentication and sessions: password storage, session expiry, brute-force protection, and account lockout behavior.
Authorization: privilege checks on every route and resource, and role escalation paths.
Input handling: injection attacks, file upload validation, and deserialization risks.
Data protection: secrets in configuration, encryption at rest, and logging of sensitive fields.
Dependencies: known-vulnerability scanning and supply-chain review.

For each item, mark whether it is critical, high, or medium risk. End with a prioritized remediation order and a short acceptance statement the team can sign off after fixes land."##,
        category: "DevOps",
        tags: "security,review,quality",
        description: "Produces a practical security audit checklist",
        is_favorite: false,
        days_ago: 30,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "SQL Query Optimizer",
        content: r##"You are a database performance engineer.

Analyze the query below and optimize it for the {{table}} table, which is indexed primarily on {{column}}. The query currently times out in production.

```sql
SELECT * FROM {{table}} WHERE {{column}} = ? ORDER BY created_at DESC;
```

Produce the following:

1. An execution-plan reading: explain what the current plan does and where the cost concentrates.
2. The three most likely causes of the slow path, in order of probability.
3. A rewritten query, with the specific index you would add or change, expressed as DDL.
4. A before/after estimate of rows scanned and expected latency.

Then list two alternative approaches, such as denormalization or a covering index, with the trade-off of each. Close with a verification plan: the exact commands to confirm the improvement in a staging environment without touching production."##,
        category: "Data Science",
        tags: "sql,data,performance",
        description: "Optimizes slow SQL queries with index recommendations",
        is_favorite: false,
        days_ago: 45,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("table", "orders"), ("column", "created_at")] },
        ],
        versions: &[
            DemoVersion { message: "Initial draft", content: r##"Optimize this query against {{table}} using the {{column}} index."## },
        ],
    },
    DemoPrompt {
        title: "Data Cleaning Pipeline Designer",
        content: r##"You are a data engineer.

Design a data-cleaning pipeline for a production dataset that arrives daily from multiple upstream sources with inconsistent schemas, duplicate rows, missing values, and mixed date formats.

Deliver a specification with these parts:

1. Ingestion: how to detect schema drift, and how to reject or quarantine malformed records.
2. Standardization: rules for date parsing, numeric coercion, string normalization, and unit conversion.
3. Deduplication: the matching keys and the merge policy for conflicting fields.
4. Missing data: per-column handling — impute, drop, or flag — with the reasoning for each choice.
5. Validation: a set of assertions the pipeline must pass before the data is published.

For every stage, state the expected output schema and the failure behavior. Finish with a testing strategy using synthetic data that reproduces each upstream defect we have seen in the last six months."##,
        category: "Data Science",
        tags: "data,sql,analysis",
        description: "Designs robust data cleaning and validation pipelines",
        is_favorite: false,
        days_ago: 60,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Exploratory Data Analysis Report",
        content: r##"## Objective

You are a data scientist. Explore the provided dataset and produce a complete analysis report that a non-technical stakeholder can follow without assistance.

## Approach

Use this workflow:

- **Understand**: describe every column, its type, missingness, and distribution.
- **Clean**: document each transformation and the reason behind it.
- **Analyze**: test the key relationships and segment the data.
- **Conclude**: extract findings that change what the business should do next.

## Required Sections

The report must contain:

1. Executive summary with the top three findings.
2. Data quality overview, including anomalies found.
3. Visual interpretation for the main distributions and correlations.
4. Hypothesis statements with the evidence supporting or refuting each one.

## Code Sample

```python
import pandas as pd

df = pd.read_csv("dataset.csv")
print(df.info())
print(df.isna().sum())
```

Finish with a recommendation list ordered by expected impact, each tied to a specific chart or statistic from the analysis."##,
        category: "Data Science",
        tags: "data,analysis,reporting",
        description: "Produces a stakeholder-ready exploratory analysis report",
        is_favorite: true,
        days_ago: 4,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Weekly Dashboard Story",
        content: r##"You are a BI analyst.

Turn the supplied metrics into the narrative for a weekly reporting dashboard used by executives. The goal is not to dump numbers but to tell the story of what changed, why it changed, and what to watch next.

Structure the narrative as:

1. The headline: the single most important movement this week, in plain language.
2. The context: how this week compares with the previous four weeks and the same period last year.
3. The drivers: which segments or products contributed most to the change, with the directional contribution of each.
4. The risks: leading indicators that moved in a worrying direction even if the headline looks healthy.
5. The ask: the one decision the executive team should consider, with a recommended threshold.

Write each section so it can be read aloud in under ninety seconds. Include the underlying numbers as a small table, and label every figure with its source and calculation."##,
        category: "Data Science",
        tags: "reporting,analysis,data",
        description: "Turns metrics into a weekly executive dashboard narrative",
        is_favorite: false,
        days_ago: 90,
        trashed: true,
        var_sets: &[],
        versions: &[],
    },
];
