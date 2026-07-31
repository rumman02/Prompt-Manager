use crate::demo::{DemoPrompt, DemoVarSet, DemoVersion};

pub static PART2: &[DemoPrompt] = &[
    DemoPrompt {
        title: "Blog Post Writer",
        content: r##"Write a blog post about {{topic}}.

Audience: {{audience}}
Tone: {{tone}}

Structure the post as follows:
1. A hook of two or three sentences that states the problem the reader is facing.
2. Three body sections, each with a subheading and two to three short paragraphs that build toward the core argument.
3. A closing call to action that invites the reader to apply the ideas.

Style rules:
- Write in the {{tone}} tone and address the {{audience}} directly throughout.
- Use short sentences and concrete examples over abstractions.
- End with a one-line summary that can double as a social share snippet.

Deliver a suggested title, a meta description under 160 characters, and the full post between 900 and 1,200 words."##,
        category: "Writing",
        tags: "blog,content,seo",
        description: "Generates structured blog posts",
        is_favorite: true,
        days_ago: 3,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("topic", "local first apps"), ("audience", "developers"), ("tone", "practical")] },
            DemoVarSet { name: "Executive", values: &[("topic", "AI adoption"), ("audience", "executives"), ("tone", "confident")] },
        ],
        versions: &[
            DemoVersion { message: "Initial draft", content: r##"Write a blog post about {{topic}}."## },
            DemoVersion { message: "Added structure", content: r##"Write a blog post about {{topic}} for {{audience}}."## },
        ],
    },
    DemoPrompt {
        title: "SEO Article Outline",
        content: r##"Create a detailed outline for a search-optimized article targeting {{keyword}}.

Audience: {{audience}}
Target length: {{word_count}} words

Requirements:
- Start with an H1 title that includes the primary keyword naturally.
- Break the article into an intro, five H2 sections, and a conclusion.
- Under each H2, list three to five bullet points covering the sub-topics.
- Include a frequently asked questions block at the end to capture featured snippets.
- Suggest two internal linking opportunities and a meta description under 160 characters.

Format the outline as nested markdown headings with bullets beneath each heading. Label each section with the approximate word count it should receive so the finished article stays close to {{word_count}} words total. Keep the outline scannable in under two minutes so the writer can begin immediately."##,
        category: "Writing",
        tags: "seo,content,editing",
        description: "Builds structured outlines for search articles",
        is_favorite: false,
        days_ago: 7,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("keyword", "tauri desktop apps"), ("audience", "rust developers"), ("word_count", "1500")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "Technical Tutorial Writer",
        content: r##"Write a hands-on technical tutorial that teaches one skill end to end.

## Structure

Start with a short "what you will build" paragraph, then follow this structure:

- ## Prerequisites: list the tools and versions required before starting.
- ## Step-by-step: walk through each step with exact commands and file contents.
- ## Common pitfalls: three mistakes beginners make and how to avoid them.
- ## Next steps: two ways to extend the project on your own.

## Writing rules

- Every command must live in a fenced code block with a language label:

```bash
npm install --save-dev typescript
```

- Every code block must be followed by a plain-language explanation of what it does.
- Keep each step under ten lines of prose so the reader never feels lost.
- Use "you" throughout and define any jargon inline the first time it appears.

## Output format

Return the tutorial as markdown with a table of contents, and end with a checklist the reader can tick off to confirm they finished the tutorial."##,
        category: "Writing",
        tags: "content,editing,tone",
        description: "Produces step-by-step developer tutorials",
        is_favorite: false,
        days_ago: 16,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Editing and Proofreading",
        content: r##"Act as a senior developmental editor. You will receive a draft text and must improve it without changing the author's voice or intent.

Process:
1. Read the draft completely once before making any edit.
2. Fix grammar, punctuation, and spelling errors silently.
3. Rewrite any sentence longer than 25 words into two clearer sentences.
4. Replace weak verbs and passive constructions with stronger active phrasing.
5. Flag jargon, clichés, and redundant phrases with a brief note explaining why.

Deliverables:
- A clean, corrected version of the full text.
- A list of the ten most impactful changes, showing the before and after of each.
- A short paragraph summarizing what changed and why.

Tone guidance: preserve the original register. If the draft is formal, keep it formal; if it is casual, keep it casual. Never inflate the length; cuts are welcome when they improve clarity."##,
        category: "Writing",
        tags: "editing,content,tone",
        description: "Deep editing and proofreading pass on drafts",
        is_favorite: false,
        days_ago: 33,
        trashed: false,
        var_sets: &[],
        versions: &[
            DemoVersion { message: "Initial version", content: r##"Proofread the given text and fix grammar errors."## },
        ],
    },
    DemoPrompt {
        title: "Email Newsletter Campaign",
        content: r##"Write a newsletter email promoting {{product}} to {{audience}}.

Goal: drive clicks to a landing page while keeping the email personal and skimmable.

Structure:
- Subject line under 50 characters that creates curiosity without clickbait.
- Preheader text under 90 characters that complements the subject.
- An opening line that references a shared context with {{audience}}.
- One benefit-led section covering what {{product}} does and the {{offer}} available now.
- A single primary call to action button labeled with an action verb.
- A P.S. line with a secondary offer or a deadline to create urgency.

Style:
- Write like a person, not a brand: contractions, short paragraphs, no corporate filler.
- Use at most two emoji, and only where they reinforce the message.
- Keep the body under 300 words so it renders well in every inbox.

Output the full email in plain text with the subject and preheader labeled."##,
        category: "Marketing",
        tags: "email,newsletter,campaign,copywriting",
        description: "Drafts high-converting newsletter campaigns",
        is_favorite: true,
        days_ago: 2,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Weekly Digest", values: &[("audience", "subscribers"), ("product", "prompt manager"), ("offer", "pro trial")] },
            DemoVarSet { name: "Launch", values: &[("audience", "beta testers"), ("product", "v2 release"), ("offer", "founder pricing")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "Social Media Ad Copy",
        content: r##"Create a scroll-stopping ad for {{product}} tailored to {{platform}}.

Audience: {{audience}}

Deliverables:
1. Three headline options, each under 90 characters, leading with the core benefit.
2. Three body copy variations of 10 to 40 words that speak to a specific pain point of {{audience}}.
3. One primary call to action phrased as a command, such as "Start free" or "Claim the spot".
4. A short hook that works as the first line of a video caption or image overlay.

Rules:
- Match the conventions of {{platform}}: character limits, hashtag suggestions, and vertical text formatting where relevant.
- One emoji maximum per variation; no emoji spam.
- Every variation must highlight the single most compelling feature of {{product}} without listing features.
- Keep the tone conversational and confident; avoid hype words like "revolutionary" and "game-changing".

Format each deliverable as a labeled block so the creative team can copy it directly."##,
        category: "Marketing",
        tags: "social,copywriting,headline,campaign",
        description: "Writes platform-specific ad variations",
        is_favorite: false,
        days_ago: 5,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("platform", "instagram"), ("product", "course platform"), ("audience", "creators")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "Product Launch Announcement",
        content: r##"Draft a product launch announcement that builds anticipation and drives sign-ups.

The announcement must cover:
- The problem that existed before this product.
- What the product does and who it is for, in plain language.
- The three features that matter most to the target user.
- Pricing or availability details, including any launch offer.
- A clear call to action that leads to a sign-up page.

Structure:
1. Headline under 70 characters, benefit-driven.
2. Opening paragraph: the story behind the launch in two or three sentences.
3. Feature section: three short paragraphs, one per feature, each with a real use case.
4. Availability block: dates, pricing, and what happens next.
5. Closing: a motivational line and the call to action.

Tone: optimistic and specific. Avoid superlatives and unsupported claims. Use concrete numbers wherever possible, for example "starts at $9 per month" rather than "affordable pricing"."##,
        category: "Marketing",
        tags: "campaign,newsletter,brand",
        description: "Announces launches with clear calls to action",
        is_favorite: false,
        days_ago: 11,
        trashed: false,
        var_sets: &[],
        versions: &[
            DemoVersion { message: "First draft", content: r##"Draft a product launch announcement with a headline, story, features, and call to action."## },
            DemoVersion { message: "Expanded structure", content: r##"Draft a product launch announcement covering the problem, the product, three key features, pricing, and a clear call to action."## },
        ],
    },
    DemoPrompt {
        title: "Cold Outreach Email",
        content: r##"Write a short cold outreach email to {{prospect_name}} at {{company}}.

Goal: earn a fifteen-minute conversation, not close a sale.

Constraints:
- Subject line under 40 characters, with no salesy words like "amazing" or "free".
- Body of exactly 120 to 150 words, four paragraphs maximum.
- First sentence: reference something specific about {{company}} to prove the email is personal.
- Second paragraph: introduce {{value_prop}} with one concrete proof point.
- Third paragraph: propose a specific, low-commitment next step with a date and time window.
- Final line: one short question that makes replying easy.

Voice: direct and respectful. No bold claims, no statistics you cannot back up, and no attachment. Write the email as plain text with the subject line labeled."##,
        category: "Marketing",
        tags: "email,copywriting,brand",
        description: "Crafts concise cold outreach emails",
        is_favorite: false,
        days_ago: 24,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("prospect_name", "Jordan"), ("company", "Northwind Labs"), ("value_prop", "cut onboarding time in half")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "Short Story Generator",
        content: r##"Write a complete short story in the {{genre}} genre.

Protagonist: {{protagonist}}
Setting: {{setting}}

Requirements:
- Length of 1,200 to 1,800 words.
- Open in medias res with the protagonist already in motion.
- Introduce a central conflict within the first two paragraphs that forces the protagonist to act.
- Include one secondary character who complicates the protagonist's goal.
- Use the setting to create atmosphere, but never stop the story for description.
- End with a resolution that changes the protagonist, not just the situation.

Craft notes:
- Vary sentence length; alternate short punchy lines with longer flowing ones.
- Show emotion through action and dialogue instead of telling.
- No genre-breaking twists: stay true to {{genre}} conventions.

After the story, add a one-paragraph author's note explaining the thematic intent and how the setting supports the conflict."##,
        category: "Creative Writing",
        tags: "story,fiction",
        description: "Generates complete short stories",
        is_favorite: true,
        days_ago: 0,
        trashed: false,
        var_sets: &[
            DemoVarSet { name: "Default", values: &[("genre", "cosy mystery"), ("protagonist", "retired librarian"), ("setting", "small coastal town")] },
        ],
        versions: &[],
    },
    DemoPrompt {
        title: "Script Dialogue Scene",
        content: r##"Write a script scene built entirely around dialogue between two characters who disagree about something important.

Formatting rules:
- Use standard screenplay format: scene heading, action lines in present tense, character names centered, dialogue below each name.
- No narration or internal monologue. Every beat of the story must come through what the characters say and do.
- Use subtext: characters should avoid stating their true feelings directly at least twice in the scene.
- Include three silent beats marked as "pause" to let tension breathe.
- Keep the scene between 400 and 600 words of dialogue.

Content requirements:
- Give each character a distinct voice: one formal and measured, the other loose and quick.
- The disagreement must start small and escalate through a misunderstanding, not through clashing principles.
- End on an ambiguous note that shifts the power balance between the two characters.

Add a brief stage direction note at the top describing the physical space in two sentences maximum."##,
        category: "Creative Writing",
        tags: "script,story,fiction",
        description: "Drafts tension-driven dialogue scenes",
        is_favorite: false,
        days_ago: 50,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Flash Fiction Prompt",
        content: r##"Write flash fiction of exactly 300 words. Every word counts, so the story must be tight.

## Constraints

- One scene, one point of view, one emotional shift.
- Start in the middle of an action, not at the beginning of a day.
- End on a final line that reframes everything before it.
- Use one recurring image that appears at least three times, meaning something different each time.

## Craft checklist

- [ ] First line hooks without explaining.
- [ ] Every sentence advances plot, character, or theme.
- [ ] No adjective that does not earn its place.
- [ ] Dialogue limited to two exchanges, each under three lines.

## Template

Follow this structural skeleton:

```text
Opening image -> small action -> escalation -> turn -> closing image
```

## Editing pass

After drafting, cut 10% of the words. Read the result aloud; if any sentence is skippable, delete it. Deliver the final 300-word story, a one-sentence logline, and the confirmed word count."##,
        category: "Creative Writing",
        tags: "fiction,story,editing",
        description: "Prompts tight 300-word flash fiction",
        is_favorite: false,
        days_ago: 70,
        trashed: false,
        var_sets: &[],
        versions: &[],
    },
    DemoPrompt {
        title: "Translation and Adaptation",
        content: r##"Act as a professional translator and localizer for marketing content.

You will receive a source text and must translate it into the requested target language while preserving intent, tone, and brand voice.

Process:
1. Read the full source text and identify cultural references, idioms, and humor that will not translate literally.
2. Translate the text in full, adapting idioms to natural equivalents in the target language rather than translating word for word.
3. Keep proper nouns, product names, and URLs unchanged unless the client specifies otherwise.
4. Respect length constraints: if the source has a character limit, the translation must fit within it.
5. Flag anything ambiguous with a note and propose two alternative phrasings.

Deliverables:
- The finished translation.
- A change log listing every adaptation with the original and the replacement.
- A confidence rating for the translation as a whole and per paragraph.

Rules: never invent meaning, never add information that is not in the source, and never flatten a playful voice into a neutral one. If the source tone is warm and direct, the translation must feel equally warm and direct to a native speaker."##,
        category: "Creative Writing",
        tags: "translation,content",
        description: "Localizes marketing copy across languages",
        is_favorite: false,
        days_ago: 120,
        trashed: true,
        var_sets: &[],
        versions: &[],
    },
];
