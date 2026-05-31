---
title: "Palo Alto Networks Adds Data-at-Rest Scanning to Endpoint DLP"
slug: "palo-alto-networks-adds-data-at-rest-scanning-to-endpoint-dlp"
pubDate: 2026-05-29T12:00:00+00:00
categories: ["News", "data protection", "DLP", "Endpoint DLP"]
excerpt: "Palo Alto Networks added early-access data-at-rest scanning for Endpoint DLP, letting Prisma Access Agent inspect managed Windows and macOS devices for sensitive files stored locally."
sourceUrl: "https://docs.paloaltonetworks.com/enterprise-dlp/release-notes/new-features-in-enterprise-dlp/new-features-in-the-enterprise-dlp-cloud-service/may-2026"
---

**Palo Alto Networks** added early-access **data-at-rest scanning** to Endpoint DLP, extending its Enterprise DLP coverage from data in motion into sensitive files already stored on managed laptops and desktops.

The feature uses the local detection engine in **Prisma Access Agent** to scan Windows and macOS endpoints for sensitive data that matches configured profiles. Administrators define target users, file types, and folder paths in Strata Cloud Manager; matching files can generate DLP incidents for investigation and remediation.

### Why Endpoint Data at Rest Matters

Traditional endpoint DLP programs often focus on movement: USB transfers, uploads, prints, copy/paste, or files leaving through sanctioned and unsanctioned apps. That still leaves a visibility gap around sensitive data that accumulates locally over time: exported customer lists, copied source files, downloaded reports, or test data that never should have lived on an endpoint.

Local scanning is also operationally important. Palo Alto's documentation says the Prisma Access Agent performs scans directly on the device, can operate when endpoints are offline, and queues incidents until connectivity returns. That puts the control closer to the data instead of depending on every risky file to traverse a network inspection point first.

### DLPTest Take

Endpoint data-at-rest scanning is not new as a concept, but its appearance inside Palo Alto's Prisma Access Agent path is notable because it ties discovery, endpoint telemetry, and centralized Enterprise DLP incidents into one management flow. For DLP teams, this is another sign that endpoint coverage is moving beyond blocking exfiltration events and toward continuous local data exposure management.

The early-access label matters. Buyers should validate detector depth, CPU and battery impact, incident volume, and remediation workflow before treating it as a full endpoint DSPM substitute. Still, this is the kind of product-level DLP expansion worth tracking.
