"use client";
import { useState } from "react";
import { type MetricsRange, metricsByRange } from "../../data/metrics";

export function useMetrics(initial: MetricsRange = "7") {
  const [range, setRange] = useState<MetricsRange>(initial);
  return { range, setRange, data: metricsByRange[range] };
}
