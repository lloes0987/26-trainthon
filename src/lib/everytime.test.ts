import { describe, expect, it } from "vitest";
import {
  applyTimetableToSlots,
  extractClassBlocksFromImageData,
  parseEverytimeHtml,
  parseEverytimeUrl,
  parseEverytimeXml,
} from "./everytime";

describe("parseEverytimeUrl", () => {
  it("accepts a public share link and returns the id", () => {
    expect(parseEverytimeUrl("https://everytime.kr/@de9YHaTAnl47JtxH0muz")).toBe(
      "de9YHaTAnl47JtxH0muz",
    );
  });

  it("accepts http and www variants", () => {
    expect(parseEverytimeUrl("http://www.everytime.kr/@abc123")).toBe("abc123");
  });

  it("accepts a link without a scheme", () => {
    expect(parseEverytimeUrl("everytime.kr/@abc123")).toBe("abc123");
  });

  it("extracts the share id from extra share text", () => {
    expect(
      parseEverytimeUrl("시간표 공유해요 https://everytime.kr/@abc123 확인"),
    ).toBe("abc123");
  });

  it("rejects other hosts", () => {
    expect(parseEverytimeUrl("https://example.com/@abc123")).toBeNull();
    expect(parseEverytimeUrl("https://everytime.kr/timetable")).toBeNull();
  });
});

describe("parseEverytimeXml", () => {
  it("converts Everytime day 0 Monday and 5-minute units", () => {
    const xml = `
      <response>
        <subject>
          <time>
            <data day="0" starttime="108" endtime="126" />
          </time>
        </subject>
      </response>
    `;
    expect(parseEverytimeXml(xml)).toEqual([
      { weekday: 1, start: "09:00", end: "10:30" },
    ]);
  });

  it("reads data tags that also have a place attribute", () => {
    const xml = `<data day="2" starttime="204" endtime="226" place="원흥관"/>`;
    expect(parseEverytimeXml(xml)).toEqual([
      { weekday: 3, start: "17:00", end: "18:50" },
    ]);
  });

  it("reads Korean time values when data tags are missing", () => {
    const xml = `<time value="수9.0-10.5/17:00-18:50,목9.0-10.5/17:00-18:50"></time>`;
    expect(parseEverytimeXml(xml)).toEqual([
      { weekday: 3, start: "17:00", end: "18:50" },
      { weekday: 4, start: "17:00", end: "18:50" },
    ]);
  });

  it("treats an empty friend response as no blocks", () => {
    expect(parseEverytimeXml(`<response>-1</response>`)).toEqual([]);
  });
});

describe("parseEverytimeHtml", () => {
  it("reads subject blocks with top/height and column day", () => {
    const html = `
      <div class="tablebody">
        <div class="cols">
          <div class="subject" style="top:0px;height:90px;"></div>
        </div>
        <div class="cols">
          <div class="subject" style="top:60px;height:60px;"></div>
        </div>
      </div>
    `;
    expect(parseEverytimeHtml(html)).toEqual([
      { weekday: 1, start: "09:00", end: "10:30" },
      { weekday: 2, start: "10:00", end: "11:00" },
    ]);
  });
});

describe("applyTimetableToSlots", () => {
  it("excludes only overlapping 30-minute slots on that weekday", () => {
    const slots = applyTimetableToSlots(
      ["2026-09-07", "2026-09-08"],
      "09:00",
      "12:00",
      [{ weekday: 1, start: "10:00", end: "11:30" }],
    );
    expect(slots.has("2026-09-07|09:00")).toBe(true);
    expect(slots.has("2026-09-07|09:30")).toBe(true);
    expect(slots.has("2026-09-07|10:00")).toBe(false);
    expect(slots.has("2026-09-07|10:30")).toBe(false);
    expect(slots.has("2026-09-07|11:00")).toBe(false);
    expect(slots.has("2026-09-07|11:30")).toBe(true);
    expect(slots.has("2026-09-08|10:00")).toBe(true);
  });

  it("keeps a Sunday with no classes fully free", () => {
    const slots = applyTimetableToSlots(
      ["2026-09-06"],
      "09:00",
      "10:00",
      [{ weekday: 1, start: "09:00", end: "10:00" }],
    );
    expect([...slots]).toEqual(["2026-09-06|09:00", "2026-09-06|09:30"]);
  });

  it("maps a colored Monday block inside the grid, not the header", () => {
    const width = 220;
    const height = 280;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
    for (let y = 0; y < 40; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4;
        data[i] = 20;
        data[i + 1] = 40;
        data[i + 2] = 90;
      }
    }
    const gridTop = 40;
    const gridBottom = 280;
    const gutter = Math.round(width * 0.12);
    const colWidth = (width - gutter) / 5;
    const y0 = gridTop + Math.round(((10 * 60 - 9 * 60) / (12 * 60)) * (gridBottom - gridTop));
    const y1 = gridTop + Math.round(((11.5 * 60 - 9 * 60) / (12 * 60)) * (gridBottom - gridTop));
    for (let y = y0; y < y1; y += 1) {
      for (let x = gutter + 8; x < gutter + colWidth - 8; x += 1) {
        const i = (y * width + x) * 4;
        data[i] = 80;
        data[i + 1] = 140;
        data[i + 2] = 255;
      }
    }
    const blocks = extractClassBlocksFromImageData(data, width, height);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0]?.weekday).toBe(1);
    expect(blocks[0]?.start).toBe("10:00");
    expect(blocks[0]?.end).toBe("11:30");
  });

  it("excludes a slot that overlaps a class by one minute", () => {
    const slots = applyTimetableToSlots(
      ["2026-09-07"],
      "09:00",
      "10:00",
      [{ weekday: 1, start: "09:30", end: "09:31" }],
    );
    expect(slots.has("2026-09-07|09:00")).toBe(true);
    expect(slots.has("2026-09-07|09:30")).toBe(false);
  });
});
