export const PLAN_LIMITS={FREE:{formLimit:3,submissionLimit:100},PRO:{formLimit:Infinity,submissionLimit:Infinity},ENTERPRISE:{formLimit:Infinity,submissionLimit:Infinity}} as const;
export const RATE_LIMITS={submitWindowMs:60_000,submitMaxPerWindow:10,apiWindowMs:15*60_000,apiMaxPerWindow:200} as const;
export const PAGINATION={defaultLimit:20,maxLimit:100} as const;
