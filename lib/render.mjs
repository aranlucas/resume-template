// Nunjucks setup for the templates. Delimiters are changed so they don't clash
// with LaTeX braces: <% block %>, << variable >>, <# comment #>.

import { resolve } from "node:path";

import nunjucks from "nunjucks";

// ---------- LaTeX ----------

const escapeTex = (s) =>
  String(s)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/—/g, "---")
    .replace(/–/g, "--");

const escapeUrl = (url) => url.replace(/([%#])/g, "\\$1");

// ---------- Dates and URLs ----------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2023-10" → "Oct 2023", "2021" → "2021" (dates are "YYYY-MM" or "YYYY"; see resume.mjs). */
function formatDate(date) {
  const [year, month] = date.split("-");
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : year;
}

/**
 * { startDate, endDate } → "Oct 2023 – Aug 2026" (no endDate → "Present";
 * the same month twice → "Aug 2014").
 */
function formatRange({ startDate, endDate }) {
  if (startDate === endDate) return formatDate(startDate);
  return `${formatDate(startDate)} – ${endDate ? formatDate(endDate) : "Present"}`;
}

/** "https://www.example.com/" → "example.com"; "https://doi.org/10.1/x" → "doi:10.1/x". */
const displayUrl = (url) =>
  url
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "doi:")
    .replace(/^https?:\/\/(www\.)?/, "")
    .replace(/\/$/, "");

// ---------- Sections ----------

/**
 * Entries whose custom `section` field is `name`; with no name, entries
 * without one. Lets one JSON Resume array (e.g. work) feed several sections.
 */
const inSection = (items = [], name) => items.filter((item) => item.section === name);

/** Bolds `name` inside already-escaped text, e.g. the resume owner in an author list. */
const bold = (text, name) => (name ? text.replaceAll(escapeTex(name), `\\textbf{${escapeTex(name)}}`) : text);

// ---------- Internships ----------

const isInternship = (job) => /\bIntern$/.test(job.position);

/** Merges internships into one compact entry, e.g. "Amazon SDE Intern; BlackBerry SDE Intern". */
function condense(jobs) {
  const years = jobs.flatMap((job) => [job.startDate, job.endDate]).map((d) => d.slice(0, 4)).sort();
  const sentences = jobs.flatMap((job) => job.highlights).map((h) => h.replace(/\.$/, ""));
  return {
    name: "Earlier Experience",
    location: [...new Set(jobs.map((job) => job.location))].join(" / "),
    position: jobs
      .map((job) => `${job.name} ${job.position.replace("Software Development Engineer", "SDE")}`)
      .join("; "),
    dates: years[0] === years.at(-1) ? years[0] : `${years[0]} – ${years.at(-1)}`,
    highlight: `${sentences.map((h, i) => (i === 0 ? h : h[0].toLowerCase() + h.slice(1))).join("; ")}.`,
  };
}

// ---------- Environment ----------

const templates = resolve(import.meta.dirname, "../templates");

/**
 * A renderer over this package's templates/ plus `searchPaths`, which are
 * checked first, so a consumer can add its own templates (or override ours)
 * with the same filters and delimiters.
 */
export function createRenderer(searchPaths = []) {
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader([...searchPaths, templates]), {
    autoescape: false,
    throwOnUndefined: true,
    trimBlocks: true,
    lstripBlocks: true,
    tags: {
      blockStart: "<%",
      blockEnd: "%>",
      variableStart: "<<",
      variableEnd: ">>",
      commentStart: "<#",
      commentEnd: "#>",
    },
  });

  env.addFilter("tex", escapeTex);
  env.addFilter("url", escapeUrl);
  env.addFilter("date", formatDate);
  env.addFilter("dates", formatRange);
  env.addFilter("displayUrl", displayUrl);
  env.addFilter("condense", condense);
  env.addFilter("inSection", inSection);
  env.addFilter("bold", bold);
  env.addTest("internship", isInternship);

  return (template, data) => env.render(template, data).trimStart();
}
