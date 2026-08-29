import { isTeam, type Team } from "./access";

export type DemoActivityType =
  | "assigned"
  | "sentToReview"
  | "changesRequested"
  | "bankHandoff"
  | "csvExported"
  | "integrationSimulated";

export type DemoActivity = {
  id: string;
  type: DemoActivityType;
  jobId: string | null;
  actor: Team;
  at: string;
  result: "success" | "failed";
  reference: string;
};

export const demoActivityLabels: Record<DemoActivityType, string> = {
  assigned: "มอบหมายงาน",
  sentToReview: "ส่งให้ทีม C ตรวจ",
  changesRequested: "ตีกลับให้แก้ไข",
  bankHandoff: "บันทึกการส่งธนาคาร",
  csvExported: "ส่งออก CSV",
  integrationSimulated: "จำลอง Bank API",
};

export const MAX_DEMO_ACTIVITIES = 200;

export function appendDemoActivity(
  activities: DemoActivity[],
  activity: DemoActivity,
  limit = MAX_DEMO_ACTIVITIES,
): DemoActivity[] {
  return [activity, ...activities.filter((item) => item.id !== activity.id)].slice(0, limit);
}

export function normalizeDemoActivities(value: unknown): DemoActivity[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => isDemoActivity(item) ? [item] : []).slice(0, MAX_DEMO_ACTIVITIES);
}

function isDemoActivity(value: unknown): value is DemoActivity {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const item = value as Partial<DemoActivity>;
  return (
    isActivityType(item.type) &&
    (item.jobId === null || typeof item.jobId === "string") &&
    isTeam(item.actor) &&
    typeof item.id === "string" && item.id !== "" &&
    typeof item.at === "string" && item.at !== "" &&
    (item.result === "success" || item.result === "failed") &&
    typeof item.reference === "string"
  );
}

function isActivityType(value: unknown): value is DemoActivityType {
  return typeof value === "string" && Object.hasOwn(demoActivityLabels, value);
}
