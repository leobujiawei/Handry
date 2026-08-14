export type TimelineEntry<State> = { before: State; after: State }
export type Timeline<State> = { past: TimelineEntry<State>[]; future: TimelineEntry<State>[] }

export function recordTimeline<State>(timeline: Timeline<State>, entry: TimelineEntry<State>, mergeLast: boolean): Timeline<State> {
  return { past: mergeLast && timeline.past.length ? [...timeline.past.slice(0, -1), entry] : [...timeline.past, entry], future: [] }
}

export function undoTimeline<State>(timeline: Timeline<State>): (Timeline<State> & { snapshot: State }) | null {
  const entry = timeline.past.at(-1)
  if (!entry) return null
  return { past: timeline.past.slice(0, -1), future: [entry, ...timeline.future], snapshot: entry.before }
}

export function redoTimeline<State>(timeline: Timeline<State>): (Timeline<State> & { snapshot: State }) | null {
  const entry = timeline.future[0]
  if (!entry) return null
  return { past: [...timeline.past, entry], future: timeline.future.slice(1), snapshot: entry.after }
}
