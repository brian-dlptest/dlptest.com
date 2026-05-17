---
title: “The data protection platform race is on!”
slug: the-data-protection-platform-race-is-on
pubDate: 2024-10-17T19:04:34+00:00
description: “An analysis of the converging DSPM, endpoint DLP, and network security markets — who will build the next $1B data protection platform?”
categories: [“DLP”, “DSPM”, “Endpoint DLP”, “Guide”]
---

Throughout 2023 and early 2024, I spoke at conferences and ISSA chapter meetings about the “Evolution of Data Protection” ([a copy of that presentation is here](https://www.linkedin.com/in/brianhileman/overlay/1729115613939/single-media-viewer?type=DOCUMENT&profileId=ACoAAAOnGSkBZW4bfsvUpsT1RWxhNibP06X39jA&lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BjjtD0fbqRpqpJ1UwXyT9Ig%3D%3D)). I made two primary predictions about how the data protection landscape would transform over the next few years. What I didn’t know was that it would happen so quickly, so let’s break it down.

## Data Discovery Platforms, aka Data Security Posture Management (DSPM)

In the last five years, significant changes have required data discovery innovation. Ramping compliance standards, GDPR in 2018, and CCPA in 2020, then expanded to many states and countries from 2020. Migration to Cloud and SaaS was well underway, but in 2020, COVID-19 increased the adoption of more SaaS apps, including many that contain sensitive data. Management became challenging with sensitive data being moved into these SaaS apps and all the new settings.

These changes led to a space that needed innovation. Some innovative vendors in the data discovery field started building platforms combining DLP Discovery, Data Classification, Data Hygiene, Data Risk Assessments, Data Privacy, Data Governance, and Posture Management. In the Gartner Hype Cycle for Data Security in 2022, they came up with the name Data Security Posture Management (DSPM) for this new platform, which has stuck.

When I started researching and paying attention to the DSPM space in 2021, I was a subject matter expert (consulting engineer) at Palo Alto Networks covering their SaaS Security product. The new DSPM vendors were competitors; hence, it was vital for me to understand the growth in the space.

Fast forward to 2023; this slide shows how busy the field had gotten.

I predicted we would see 3 to 5 vendors come out on top, and the others would be acquired. In 2024, three vendors have raised over $100 million to date and appear to be leading the space: Cyera has raised $460M, BigID has raised $320M, and Securiti has raised $155M. Where things have picked up the pace is on the acquisition front.

- Dig Security was acquired by Palo Alto Networks in 2023 ≈$400M
- Eureka was acquired by Tenable in 2024
- Flow was acquired by CrowdSkrike in 2024 ≈$200M
- Laminar was acquired by Rubrik in 2023 ≈$250M
- Open Raven was acquired by Formstack in 2024
- Polar was acquired by IBM in 2023 ≈$60M
- Dasera was acquired by Netskope in 2024

This leads us to the race for the next big data protection platform.

## The next data protection platform

Let’s first call out the last champion of this space, Symantec DLP. From 2011 to 2017, I worked at a DLP consulting company, InteliSecure. At InteliSecure, we completed over 250 Symantec DLP implementations, including many at Fortune 500 organizations. Symantec DLP got up to $450M in annual revenue in 2019. Broadcom acquired Symantec at the end of 2019. Innovations slowed after the Broadcom acquisition, leaving the field open to start-ups, including DSPM.

This diagram gives you a breakdown of how I view the four pillars that make up data protection.

#### **Endpoint Platforms**

As we saw in the DSPM market, innovations have also been taking place with Endpoint Platforms. Disclaimer: I work for one of these vendors. The first main item is the functionality of Endpoint DLP and Insider Risk Management (IRM) in a single agent. Gartner hasn’t coined a name for this sector yet, but vendors are using terms like people-centric DLP, human-centric DLP, data detection and response, and next-gen DLP for such solutions.

#### **Discovery Platforms**

Already covered – this is now DSPM.

#### **Network Platforms**

The original solution for network DLP was using ICAP with a web proxy, but those days are over. If we approach this problem like in the past by being inline, the new kid on the block will be SSE and SASE vendors. Think of some of the largest cyber security companies: Palo Alto Networks, Zscaler, Fortinet, and Netskope. The challenge these vendors have is that their primary revenue source is network security, and data protection is an add-on.

Another solution that we have been seeing here is with enterprise browsers. While enterprise browsers still have network security as a component, some vendors have approached this with a browser extension that helps with network security and data protection.

#### **Email DLP**

For me, email DLP has been taken over mainly by Microsoft because it is built right into Office 365. Most organizations that need email DLP will use it to meet compliance requirements, and Microsoft is good in this space.

## **Who is the winner?**

If I am going to hedge my bets, here are two possible outcomes that I see for the next $500M ARR or even $1B ARR company with a primary business focus on data protection.

**1. DSPM + Endpoint + Enterprise Browser (Extension Based). **I haven’t seen any acquisitions or vendors taking on all three products yet, but I’m closely watching this one. The synergy between DSPM and Endpoint runs very deep. From a high level, you have something finding and classifying all the data at rest, and then the Endpoint takes over when controls are needed to prevent the data from leaving. The Enterprise Browser rounds out this platform to provide controls for unmanaged devices and even enhances the Endpoint agents.

**2. SASE + DSPM + Endpoint + A robust business focus on data security. **We are already seeing SASE vendors acquire DSPM solutions, and Fortinet bought an Endpoint solution. I will highlight that many SASE vendors surpass $1B ARR. As of now, I wouldn’t consider any of these vendors the next innovative data protection platform, but with strategic acquisitions and leadership that prioritizes data protection, this could change quickly.

Post on LinkedIn – [https://www.linkedin.com/pulse/data-protection-platform-race-brian-hileman-ummre/?trackingId=kfMkZRZtQXitmmZk2Echiw%3D%3D](https://www.linkedin.com/pulse/data-protection-platform-race-brian-hileman-ummre/?trackingId=kfMkZRZtQXitmmZk2Echiw%3D%3D)
