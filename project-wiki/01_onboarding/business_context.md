---
id: ONBOARDING-CORE-BUSINESS-CONTEXT
title: Project Wiki Business Context
doc_type: overview
domain: core
status: proposed
version: 0.1
owner: ai-primary
reviewers:
  - project-maintainer
last_updated: 2026-04-08
source_of_truth: false
canonical: false
related_docs:
  - ONBOARDING-CORE-PROJECT-OVERVIEW
  - REQ-CORE-BUSINESS-RULES
  - REQ-CORE-PRODUCT-SCOPE
  - REQ-CORE-NON-FUNCTIONAL
tags:
  - project-wiki
  - onboarding
  - context
summary: Reader-facing explanation of why the wiki exists and the operational value it is expected to provide.
---

# Project Wiki Business Context

## Why This System Exists

The wiki exists to reduce repeated clarification work. Without a durable project memory layer, teams and AI agents have to rediscover business rules, re-ask scope questions, and infer intent from scattered artifacts.

## Problems It Addresses

- onboarding is slower when durable context is spread across chat history, code, and ad hoc notes
- feature clarification is risky when intended behavior is not easy to find
- change analysis becomes less safe when canonical docs, assumptions, and open questions are mixed together
- documentation drift is harder to detect when there is no stable navigation model

## Expected Value

- faster onboarding for new contributors
- safer feature updates because impacted rules and flows are easier to find
- clearer distinction between confirmed truth, inferred detail, and unresolved questions
- better handoff quality between humans and AI agents

## Current Scope Note

This benefit is partly implemented now through the wiki foundation, starter support docs, and reusable templates. Formal verification surfaces and validator automation are planned in later slices.

## Related Reading

- [Project Overview](project_overview.md)
- [Business Rules](../02_requirements/confirmed/business_rules.md)
- [Product Scope](../02_requirements/confirmed/product_scope.md)
- [Non-Functional Requirements](../02_requirements/confirmed/non_functional_requirements.md)
