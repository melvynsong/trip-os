import {
  AI_ACTIVITY_TYPES,
  type AiGeneratedItinerary,
  type AiGeneratedDay,
  type AiGeneratedActivity,
  type AiTripDayContext,
} from "./itinerary";
import type { ActivityType } from "@/types/trip";

type NormalizationLogReason =
  | "EMPTY_TITLE"
  | "INVALID_TYPE"
  | "BAD_TIME"
  | "DUPLICATE_ACTIVITY"
  | "DUPLICATE_DAY"
  | "MISSING_DAY"
  | "EXTRA_DAY"
  | "TRUNCATED_ACTIVITIES"
  | "QUALITY_THRESHOLD";

type NormalizationLog = {
  reason: NormalizationLogReason;
  day_number: number;
  details?: string;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function normalizeText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeTime(value: unknown): string | null {
  const time = normalizeText(value);
  return TIME_PATTERN.test(time) ? time : null;
}

function normalizeType(value: unknown): ActivityType {
  const type = normalizeText(value).toLowerCase() as ActivityType;
  return AI_ACTIVITY_TYPES.includes(type) ? type : "other";
}

function deduplicateActivities(
  activities: AiGeneratedActivity[],
  day_number: number,
  logs: NormalizationLog[]
): AiGeneratedActivity[] {
  const seen = new Set<string>();
  const result: AiGeneratedActivity[] = [];

  for (const activity of activities) {
    const key = `${activity.title.toLowerCase().trim()}|${activity.activity_time ?? ""}`;

    if (seen.has(key)) {
      logs.push({
        reason: "DUPLICATE_ACTIVITY",
        day_number,
        details: activity.title,
      });
      continue;
    }

    seen.add(key);
    result.push(activity);
  }

  return result;
}

function flushLogs(logs: NormalizationLog[]) {
  for (const log of logs) {
    console.log("[ItineraryNormalizer]", log);
  }
}

export function normalizeGeneratedItinerary(
  raw: unknown,
  dbDays: AiTripDayContext[]
): { draft: AiGeneratedItinerary; logs: NormalizationLog[] } {
  const logs: NormalizationLog[] = [];

  // Validate root
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as any).days)) {
    throw new Error(
      "AI output is missing a valid days array. Please try again or rephrase your prompt."
    );
  }

  const inputDays = (raw as any).days;

  // Detect duplicate day_number
  const seenDayNumbers = new Set<number>();
  for (const item of inputDays) {
    if (typeof item?.day_number === "number") {
      if (seenDayNumbers.has(item.day_number)) {
        logs.push({
          reason: "DUPLICATE_DAY",
          day_number: item.day_number,
        });
        flushLogs(logs);
        throw new Error(
          "AI output contains duplicate day_number values."
        );
      }
      seenDayNumbers.add(item.day_number);
    }
  }

  // Map input days
  const inputDayMap = new Map<number, any>();
  for (const item of inputDays) {
    if (typeof item?.day_number === "number") {
      inputDayMap.set(item.day_number, item);
    }
  }

  let totalInputActivities = 0;
  let totalKeptActivities = 0;

  const days: AiGeneratedDay[] = dbDays.map((dbDay) => {
    const input = inputDayMap.get(dbDay.day_number);

    let title = dbDay.title || `Day ${dbDay.day_number}`;
    let activities: AiGeneratedActivity[] = [];

    if (input) {
      if (typeof input.title === "string" && input.title.trim()) {
        title = input.title.trim();
      }

      const rawActivities = Array.isArray(input.activities)
        ? input.activities
        : [];

      totalInputActivities += rawActivities.length;

      const normalized: AiGeneratedActivity[] = [];

      for (const act of rawActivities) {
        const actTitle = normalizeText(act?.title);

        if (!actTitle) {
          logs.push({
            reason: "EMPTY_TITLE",
            day_number: dbDay.day_number,
          });
          continue;
        }

        const actType = normalizeType(act?.type);

        if (actType === "other" && act?.type) {
          logs.push({
            reason: "INVALID_TYPE",
            day_number: dbDay.day_number,
            details: act?.type,
          });
        }

        const actTime = normalizeTime(act?.activity_time);

        if (act?.activity_time && actTime === null) {
          logs.push({
            reason: "BAD_TIME",
            day_number: dbDay.day_number,
            details: String(act?.activity_time),
          });
        }

        normalized.push({
          title: actTitle,
          activity_time: actTime,
          type: actType,
          notes:
            typeof act?.notes === "string" && act.notes.trim()
              ? act.notes.trim()
              : null,
        });
      }

      const deduped = deduplicateActivities(
        normalized,
        dbDay.day_number,
        logs
      );

      if (deduped.length > 12) {
        logs.push({
          reason: "TRUNCATED_ACTIVITIES",
          day_number: dbDay.day_number,
        });
      }

      activities = deduped.slice(0, 12);
      totalKeptActivities += activities.length;
    } else {
      logs.push({
        reason: "MISSING_DAY",
        day_number: dbDay.day_number,
      });
    }

    return {
      day_number: dbDay.day_number,
      title,
      activities,
    };
  });

  // Extra days
  for (const input of inputDays) {
    if (
      typeof input?.day_number === "number" &&
      !dbDays.some((d) => d.day_number === input.day_number)
    ) {
      logs.push({
        reason: "EXTRA_DAY",
        day_number: input.day_number,
      });
    }
  }

  // Quality threshold
  const dropRatio =
    totalInputActivities > 0
      ? (totalInputActivities - totalKeptActivities) /
        totalInputActivities
      : 0;

  if (dropRatio > 0.5) {
    logs.push({
      reason: "QUALITY_THRESHOLD",
      day_number: -1,
    });
    flushLogs(logs);
    throw new Error(
      "Too many activities were invalid. Please refine your prompt."
    );
  }

  flushLogs(logs);

  return {
    draft: { days },
    logs,
  };
}