// Kept in sync with package.json's version manually at each release —
// see docs/engineering/GIT_WORKFLOW_v1.1.md's Release Checklist.
//
// Single source of truth for "which build of the app produced this" — imported
// by /api/health and by financial-closing/'s ClosingSnapshot.pipelineVersion so
// a historical snapshot can be traced back to the platform version that computed it.
export const APP_VERSION = "0.5.1";
