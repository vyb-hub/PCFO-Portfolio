# PCFO

Personal finance intelligence platform by Vybhav Sunil Kumar.

## Product and architecture

PCFO combines financial ingestion, structured transaction extraction, reconciliation and financial intelligence. Financial calculations are deterministic; AI provides classification, extraction and explanations. The financial-memory architecture supports context assembly for an AI coach with replaceable embedding and storage interfaces. The baseline uses development memory adapters; production vector retrieval is not claimed.

## Technology

Next.js, TypeScript, Prisma/PostgreSQL and AI-provider abstractions. Explore `src/lib/finance/` for domain layers, memory and coaching contracts, and `src/lib/agents/` for ingestion agents. See `package.json` for available build and test scripts.

## Portfolio scope

This is a source snapshot of the private repository's default branch. Private financial records, calibration observations, internal notes and Git history are excluded. The working project continues separately; this snapshot does not include uncommitted development.

Runtime services and environment variables must be configured independently. No hosted application or production readiness is implied.
