---
id: lesson-epi-001
title: Epidemiologic measures and diagnostic test performance
track: VMLE
year: 4
vmleSubject: Veterinary Microbiology and Public Health
competencyIds:
  ['Veterinary Microbiology and Public Health:G.3', 'Veterinary Microbiology and Public Health:G.1']
objectives:
  - Calculate prevalence, incidence, case fatality rate and mortality rates
  - Compute relative risk, odds ratio and attributable risk from a 2 x 2 table
  - Compute sensitivity, specificity, PPV and NPV and explain how prevalence affects them
diagram: ../diagrams/diagnostic_2x2.svg
sources: ['author-draft']
status: unverified
verifyAgainst: 'Any veterinary epidemiology text or your biostatistics course notes; recompute the worked examples yourself'
---

## Overview

Epidemiology measures disease frequency, compares groups, and judges how good a test is. Most items are short calculations.

## Key terms

prevalence, incidence, at-risk population, case fatality rate, crude mortality rate, relative risk, odds ratio, attributable risk, sensitivity, specificity, PPV, NPV, 2 x 2 table

## Content

**Frequency**

- Prevalence = existing cases / total population at a point (or period) in time.
- Incidence (cumulative) = new cases during a period / animals at risk at the start.
- Case fatality rate = deaths from the disease / animals with the disease x 100.
- Crude mortality rate = all deaths / total population (per time period).
- Cause-specific mortality = deaths from one disease / total population.

**Association (2 x 2: exposed/unexposed by diseased/not)**

|           | Diseased | Not diseased |
| --------- | -------- | ------------ |
| Exposed   | a        | b            |
| Unexposed | c        | d            |

- Relative risk (cohort) = [a/(a+b)] / [c/(c+d)]
- Odds ratio (case-control) = (a x d) / (b x c)
- Attributable risk = incidence in exposed minus incidence in unexposed

**Diagnostic test (see diagram):** Se = TP/(TP+FN); Sp = TN/(TN+FP); PPV = TP/(TP+FP); NPV = TN/(TN+FN). Se and Sp are properties of the test; PPV and NPV rise or fall with prevalence.

**Worked example 1 (test).** 200 animals, 80 diseased. TP = 72, FN = 8, FP = 12, TN = 108.
Se = 72/80 = 90%; Sp = 108/120 = 90%; PPV = 72/84 = 85.7%; NPV = 108/116 = 93.1%; true prevalence = 80/200 = 40%; apparent prevalence = 84/200 = 42%.

**Worked example 2 (cohort).** Exposed 100 animals, 30 sick. Unexposed 100 animals, 10 sick.
Risk exposed = 0.30; unexposed = 0.10. RR = 3.0. AR = 0.20. OR = (30 x 90)/(70 x 10) = 3.86.

**Worked example 3.** 150 cases, 12 died: CFR = 8%. In a population of 2,000, 12 deaths from the disease: cause-specific mortality = 6 per 1,000.

## High-yield

- Prevalence = all cases; incidence = new cases.
- RR for cohort, OR for case-control.
- Lower prevalence lowers PPV even when Se and Sp stay the same.
- Highly sensitive test = good to rule OUT (few false negatives); highly specific test = good to rule IN.

## Mnemonic

**SnNout / SpPin:** Sensitive test, Negative result rules OUT; Specific test, Positive result rules IN.

## Check questions

epi-001 to epi-007
