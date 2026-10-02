export type CreatePlan = {
  ready: boolean;
  questions: Array<{field:string;question:string;choices?:string[];details?:unknown}>;
  draftInput?: unknown;
  payload: Record<string,unknown>;
};
export function planCreate(input: Record<string,unknown>, preferences?: Record<string,unknown>): CreatePlan;
