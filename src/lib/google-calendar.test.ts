import { describe, expect, it } from "vitest";
import {
  applyBusyIntervalsToSlots,
  parseFreeBusyResponse,
} from "./google-calendar";

describe("applyBusyIntervalsToSlots", () => {
  it("marks overlapping 30-minute slots busy and keeps the rest free", () => {
    const slots = applyBusyIntervalsToSlots(
      ["2026-09-10"],
      "09:00",
      "12:00",
      [
        {
          start: "2026-09-10T10:00:00+09:00",
          end: "2026-09-10T11:00:00+09:00",
        },
      ],
    );

    expect(slots.has("2026-09-10|09:00")).toBe(true);
    expect(slots.has("2026-09-10|09:30")).toBe(true);
    expect(slots.has("2026-09-10|10:00")).toBe(false);
    expect(slots.has("2026-09-10|10:30")).toBe(false);
    expect(slots.has("2026-09-10|11:00")).toBe(true);
    expect(slots.has("2026-09-10|11:30")).toBe(true);
  });

  it("keeps every slot free when there is no busy time", () => {
    const slots = applyBusyIntervalsToSlots(
      ["2026-09-10", "2026-09-11"],
      "09:00",
      "10:00",
      [],
    );

    expect([...slots]).toEqual([
      "2026-09-10|09:00",
      "2026-09-10|09:30",
      "2026-09-11|09:00",
      "2026-09-11|09:30",
    ]);
  });

  it("applies busy time only to the matching date", () => {
    const slots = applyBusyIntervalsToSlots(
      ["2026-09-10", "2026-09-11"],
      "09:00",
      "10:00",
      [
        {
          start: "2026-09-11T09:00:00+09:00",
          end: "2026-09-11T09:30:00+09:00",
        },
      ],
    );

    expect(slots.has("2026-09-10|09:00")).toBe(true);
    expect(slots.has("2026-09-11|09:00")).toBe(false);
    expect(slots.has("2026-09-11|09:30")).toBe(true);
  });
});

describe("parseFreeBusyResponse", () => {
  it("reads busy ranges from the primary calendar", () => {
    expect(
      parseFreeBusyResponse({
        calendars: {
          primary: {
            busy: [
              {
                start: "2026-09-10T10:00:00+09:00",
                end: "2026-09-10T11:00:00+09:00",
              },
            ],
          },
        },
      }),
    ).toEqual([
      {
        start: "2026-09-10T10:00:00+09:00",
        end: "2026-09-10T11:00:00+09:00",
      },
    ]);
  });

  it("returns an empty list when the payload has no busy blocks", () => {
    expect(parseFreeBusyResponse({ calendars: { primary: { busy: [] } } })).toEqual(
      [],
    );
    expect(parseFreeBusyResponse({})).toEqual([]);
  });
});
