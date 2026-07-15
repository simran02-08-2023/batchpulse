"use client";

import { useRouter } from "next/navigation";

export function AttendanceDatePicker({
  batchId,
  currentDate,
  maxDate,
}: {
  batchId: string;
  currentDate: string;
  maxDate: string;
}) {
  const router = useRouter();

  return (
    <label className="block max-w-xs">
      <span className="text-sm font-medium">Date</span>
      <input
        type="date"
        defaultValue={currentDate}
        max={maxDate}
        onChange={(event) => {
          const newDate = event.target.value;
          if (newDate) {
            router.push(`/attendance/${batchId}?date=${newDate}`);
          }
        }}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 outline-none focus:border-violet-400"
      />
    </label>
  );
}