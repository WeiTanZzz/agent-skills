# Architecture Review Checklist

Use this when evaluating an existing architecture. Work through each section, marking ✅ (good), ⚠️ (concern), ❌ (gap), or N/A.

For each ⚠️ or ❌, add a brief note and a recommendation.

---

## 1. Data Flow Clarity
- [ ] Is the data flow documented end-to-end (source → processing → storage → consumption)?
- [ ] Are all data sources and sinks identified?
- [ ] Are async vs sync paths clearly distinguished?
- [ ] Is there a clear owner for each data domain?

## 2. Tech Stack
- [ ] Is the tech stack appropriate for the scale and team?
- [ ] Are there redundant technologies doing the same job (e.g. two ORMs, two caches)?
- [ ] Are all dependencies actively maintained?
- [ ] Is the stack consistent across services, or fragmented without reason?
- [ ] Are there any known EOL / deprecated components?

## 3. Data Storage
- [ ] Is the right database type chosen for each use case (relational, document, time-series, etc.)?
- [ ] Are indexes defined and reviewed for query patterns?
- [ ] Is there a data retention and archival policy?
- [ ] Is schema migration handled safely (backward-compatible changes)?
- [ ] Are large objects (blobs, files) stored separately from transactional data?

## 4. Scalability
- [ ] Can each component scale independently?
- [ ] Are stateless services separated from stateful ones?
- [ ] Is there a load testing / capacity planning process?
- [ ] Are there known bottlenecks? Are they documented and mitigated?
- [ ] Does the system handle traffic spikes gracefully (autoscaling, circuit breakers, rate limiting)?

## 5. Reliability & Resilience
- [ ] Are there single points of failure? If so, are they accepted trade-offs?
- [ ] Is there multi-AZ or multi-region deployment for critical components?
- [ ] Are circuit breakers / retries / timeouts in place for all external calls?
- [ ] Is there a documented RTO and RPO? Are they achievable with the current setup?
- [ ] Is backup and restore tested regularly?

## 6. Middleware & Async
- [ ] Is a message broker used where appropriate (decoupling, buffering, fan-out)?
- [ ] Are consumers idempotent (safe to reprocess messages)?
- [ ] Is consumer lag monitored and alerted on?
- [ ] Is the delivery guarantee (at-least-once / exactly-once) appropriate for each use case?
- [ ] Are dead-letter queues (DLQ) in place for failed messages?

## 7. Observability
- [ ] Are the three pillars covered: metrics, logs, traces?
- [ ] Are logs structured (JSON) with consistent fields (trace_id, service, level)?
- [ ] Is distributed tracing propagated across all service boundaries?
- [ ] Are SLOs defined and tracked?
- [ ] Are alerts actionable (low noise, clear runbooks)?
- [ ] Is there a dashboard for business-level metrics, not just technical ones?

## 8. Security
- [ ] Is authentication in place for all entry points (user-facing and service-to-service)?
- [ ] Is authorization enforced at the service layer (not just the gateway)?
- [ ] Are secrets managed securely (never in code or plain env vars)?
- [ ] Is all data encrypted in transit (TLS) and at rest?
- [ ] Is PII identified and handled appropriately (masking, tokenization, access control)?
- [ ] Is there a dependency vulnerability scanning process in CI?
- [ ] Is network segmentation in place (services can't freely talk to each other)?

## 9. API Design
- [ ] Are APIs versioned?
- [ ] Is there a consistent error response format?
- [ ] Are APIs documented (OpenAPI / Protobuf IDL)?
- [ ] Is rate limiting / throttling applied to external-facing APIs?
- [ ] Are breaking changes communicated with a deprecation policy?

## 10. Deployment & Operations
- [ ] Is there a CI/CD pipeline for all services?
- [ ] Is infrastructure managed as code (Terraform, Pulumi, CDK)?
- [ ] Is the deployment strategy safe (blue/green, canary, rolling)?
- [ ] Can individual services be deployed independently?
- [ ] Is there a feature flag system for risky releases?
- [ ] Is there a runbook for common operational tasks and incidents?

## 11. Cost
- [ ] Are there obvious cost inefficiencies (over-provisioned instances, unused resources)?
- [ ] Is there tagging / cost attribution per team or service?
- [ ] Are expensive operations (e.g. full table scans, large transfers) identified and optimized?

---

## Review Summary

After completing the checklist, produce a summary:

### Strengths
> What the architecture does well.

### Top Risks
> The most critical ⚠️ / ❌ items, ranked by impact.

### Recommended Actions
| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| P1 | | | |
| P2 | | | |
| P3 | | | |
