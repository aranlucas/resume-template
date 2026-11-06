// Resume-specific grouping stays separate from the generic renderer used by custom templates.

export const isInternship = (job) => /\bIntern$/.test(job.position);

export const isCompletedInternship = (job) =>
  isInternship(job) && Boolean(job.startDate && job.endDate);

/** Merges internships into one compact entry, e.g. "Company A SDE Intern; Company B SDE Intern". */
export function condense(jobs) {
  const years = jobs
    .flatMap((job) => [job.startDate, job.endDate])
    .filter(Boolean)
    .map((d) => d.slice(0, 4))
    .toSorted();

  const sentences = jobs
    .flatMap((job) => job.highlights ?? [])
    .map((h) => h.trim().replace(/\.$/, ""))
    .filter(Boolean);

  const end = jobs.some((job) => !job.endDate) ? "Present" : years.at(-1);

  const highlight = sentences
    .map((h, i) => (i === 0 ? h : h[0].toLowerCase() + h.slice(1)))
    .join("; ");

  return {
    name: "Earlier Experience",
    location: [...new Set(jobs.map((job) => job.location).filter(Boolean))].join(" / "),
    position: jobs
      .map((job) =>
        `${job.name ?? ""} ${job.position.replace("Software Development Engineer", "SDE")}`.trim(),
      )
      .join("; "),
    dates: !years.length ? "" : years[0] === end ? years[0] : `${years[0]} – ${end}`,
    highlight: highlight ? `${highlight}.` : "",
  };
}
