---
title: "Ent Emerges From Stealth With $100 Million Seed for Intent-Aware Workspace Security"
slug: "ent-emerges-from-stealth-with-100-million-seed-round"
pubDate: 2026-06-16T09:00:00-04:00
categories: ["News", "data protection", "DLP", "Endpoint DLP", "Insider Risk Management", "AI Security"]
excerpt: "Ent emerged from stealth with a $100 million seed round led by Decibel to build an intent-aware workspace security platform: a lightweight endpoint agent that uses on-device AI to read human and AI-agent intent and intervene before data-loss or insider-risk incidents occur."
sourceUrl: "https://www.securityweek.com/endpoint-security-startup-ent-emerges-from-stealth-with-100-million-seed-round/"
---

**Ent**, an "intent-aware workspace security" startup, has emerged from stealth with **$100 million** in seed funding — reported as one of the largest seed rounds in cybersecurity history. The round was led by **Decibel**, with participation from **Sequoia**, **Crosspoint Capital Partners**, **Craft Ventures**, **Shield Capital**, **Felicis**, and the CIA's venture arm **In-Q-Tel**.

The San Francisco company was founded by **Elias Manousos** (CEO) and **Brandon Dixon** — the team behind **RiskIQ**, acquired by Microsoft in 2021, and subsequently behind **Microsoft Security Copilot**. Their thesis is that AI compresses the time between compromise and impact to the point where prevention, not after-the-fact detection, has to become the primary objective again.

Ent runs as a lightweight endpoint agent that brings small, on-device AI models to the device so reasoning happens locally, without a cloud round trip. The platform observes activity across applications, browsers, AI workflows, data movement, and local runtimes; evaluates the intent of both human users and AI agents at the moment of action; applies customer-defined policy; and triggers just-in-time interventions before an incident occurs. It is hosted in the customer's own cloud for data sovereignty and is generally available for Windows, macOS, Linux, and browser-extension deployments.

### Why This Belongs in the DLP Conversation

Ent's stated use cases read like a DLP and insider-risk brief: detect insider risk, govern AI usage, prevent data loss, stop last-mile threats, and investigate incidents with behavioral context. The scenarios it highlights — a user handing remote control of their machine to someone outside the company, or pasting sensitive data into an unsanctioned AI tool — are exactly the moment-of-action exfiltration cases that conventional endpoint, web, and SaaS DLP tend to catch late or not at all.

The architectural argument is also a DLP argument: EDR and SIEM collect at the process and file layer and respond after the action completes, while modern work — and the AI agents now acting on a user's behalf — happens across the browser, apps, and AI assistants. Ent is positioning a "workspace" control point that reads intent across humans and agents at the moment of decision, which puts it closer to endpoint DLP and insider-risk management than to generic AI policy tooling.

### Market Signal

A $100 million seed is an aggressive bar, and the founder pedigree plus the In-Q-Tel and Sequoia backing signal continued investor appetite for endpoint-resident, AI-native data and insider-risk controls — alongside recent activity such as Cyera's raise and the wave of agent-security startups. The usual caveats apply for DLP buyers evaluating it: a system that intervenes on *inferred* intent has to be right often enough not to block legitimate work and train users to ignore it, and the sub-second on-device inference claims are the company's own, without independent benchmarks yet. Ent says it is already deployed across Global 2000 customers in hospitality, financial services, and defense, and will show the platform at Black Hat USA 2026.
