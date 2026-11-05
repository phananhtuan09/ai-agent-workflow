# Glossary

Store accepted project-specific vocabulary here.
This location answers what a term is.
Behavior rules belong in `../product/`.
Rationale and trade-offs belong in `../decisions/`.
Current-state facts inferred from code belong in `../observed/`.
Create a context file only after the human has explicitly confirmed at least one term in that context.

## Contexts

No context glossary exists yet.

## Admission

Create `docs/glossary/<context>.md` only when the first term in that context is accepted.
In that same change, replace the empty Contexts note above with a bullet per context file:

- `<context>.md`: <one line describing the context>

A term is accepted only when the human explicitly confirms it.
Record that term before the next question round.
Do not hold confirmed terms until the end of the task.
A term inferred from code, tests, history, or runtime behavior is not glossary content.
Record that kind of fact in `../observed/` when future work needs it, or leave the uncertainty as an open question there.
Update the context file that already owns the topic before creating another file.
Use a lowercase kebab-case context filename, such as `ordering.md`.
`README.md` is this contract and is not a context glossary.

## Document format

Use this structure:

```md
# <Context name>

Status: Active | Superseded
Scope: <who uses this vocabulary and where the context stops>
Superseded by: <relative link; include only when the whole context is superseded>

<One or two sentences describing what this context is.>

## Terms

**Term**:
<One or two sentences defining what the term is.>
_Avoid_: <discouraged synonyms>
Status: Active | Superseded
Superseded by: <**Replacement** or a relative link; include only when this term is superseded>

References:

- Human request, YYYY-MM-DD: <one-line summary of the confirmation>
```

`Status` and `Scope` are required on the context.
Each term requires a definition, `Status`, and `References`.
`References` must cite the confirming human request.
Include `_Avoid_` when a discouraged synonym exists.
Omit `_Avoid_` when the term has no discouraged synonym.
Include `Superseded by` only when that term or the whole context is superseded.
A `###` group heading inside `Terms` is allowed when one file holds more than one natural cluster.
A single cluster stays a flat list.

## Writing rules

Define what the term is.
Leave what the system does with the term to `../product/`, and leave how it is stored or called in code out of the glossary.
Keep each definition to one or two sentences.
Include only terms specific to this project.
Leave general programming concepts and general workflow concepts out.
When several words name one concept, keep one canonical term and list the others under `_Avoid_`.
Write definitions, context descriptions, and `_Avoid_` notes in English.
Keep a canonical term in the form the human confirmed.
When that form is not English, give the English meaning in the definition.
Mark a replaced term `Superseded` and name the replacement in the same edit that adds the replacement.
Keep the old term in the file so the history stays visible.
Do not record a term the human has not confirmed.
Do not change a glossary entry so that it matches code the human did not accept.
Report that disagreement as drift.
