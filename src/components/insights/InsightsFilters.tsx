import {
  bucketLabels,
  isDateOnly,
  rangePresetLabels,
  rangePresets,
  bucketSizeFor,
  type DateRange,
  type RangePreset,
} from "@/domain/reporting";
import { Input, Notice, SegmentedControl } from "../ui";
import { formatRange } from "./format";

const presetOptions = rangePresets.map((preset) => ({ value: preset, label: rangePresetLabels[preset] }));

/**
 * ตัวกรองช่วงเวลา (REQ-INSIGHT-002)
 *
 * `resolveRange` ถอยไปใช้ 30 วันหรือสลับวันให้เองแบบเงียบ ๆ ส่วนนี้จึงตรวจซ้ำ
 * แล้วบอกผู้ใช้ว่าตัวเลขที่เห็นมาจากช่วงไหน ไม่ให้อ่านผลของช่วงที่ไม่ได้ขอ
 */
export function InsightsFilters({
  preset,
  custom,
  range,
  asOf,
  onPresetChange,
  onCustomChange,
}: {
  preset: RangePreset;
  custom: DateRange;
  range: DateRange;
  asOf: string;
  onPresetChange: (next: RangePreset) => void;
  onCustomChange: (next: DateRange) => void;
}) {
  const incomplete = preset === "custom" && !(isDateOnly(custom.from) && isDateOnly(custom.to));
  const swapped = preset === "custom" && !incomplete && custom.from > custom.to;

  return (
    <div className="mb-6 grid gap-3">
      <SegmentedControl
        label="ช่วงเวลาของรายงาน"
        onChange={onPresetChange}
        options={presetOptions}
        value={preset}
      />

      {preset === "custom" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-bold tracking-wide text-muted">ตั้งแต่วันที่</span>
            <Input
              max={isDateOnly(custom.to) && custom.to < asOf ? custom.to : asOf}
              onChange={(event) => onCustomChange({ ...custom, from: event.target.value })}
              type="date"
              value={custom.from}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-bold tracking-wide text-muted">ถึงวันที่</span>
            <Input
              max={asOf}
              onChange={(event) => onCustomChange({ ...custom, to: event.target.value })}
              type="date"
              value={custom.to}
            />
          </label>
        </div>
      ) : null}

      {incomplete ? (
        <Notice>
          <strong className="font-bold">ยังกรอกช่วงวันที่ไม่ครบ</strong> — ตัวเลขด้านล่างจึงเป็นข้อมูลย้อนหลัง 30 วันไปก่อน
        </Notice>
      ) : null}
      {swapped ? (
        <Notice>
          <strong className="font-bold">วันเริ่มอยู่หลังวันสิ้นสุด</strong> — สลับให้แล้วเพื่อให้ช่วงถูกต้อง
        </Notice>
      ) : null}

      <p className="tnum text-sm text-muted">
        กำลังแสดง {formatRange(range)} · {bucketLabels[bucketSizeFor(range)]}
      </p>
    </div>
  );
}
