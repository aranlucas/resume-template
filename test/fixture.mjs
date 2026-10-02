// Synthetic data only; this fixture does not represent an actual person.
export function fixture() {
  return {
    basics: {
      name: "Example Person",
      label: "Example Engineer",
      email: "example@example.com",
      phone: "555-0100",
      url: "https://example.com",
      summary: "Builds useful tools.",
      profiles: [],
    },
    work: [
      { name: "Current Company", position: "Engineering Intern", startDate: "2026-09" },
      { name: "Previous Company", position: "Engineering Intern", startDate: "2024", endDate: "2025-01" },
    ],
    projects: [{ name: "Example Project", url: "https://example.com/project", type: "Project" }],
    education: [{ institution: "Example University", studyType: "B.S.", area: "Engineering", endDate: "2025" }],
    skills: [{ name: "Tools", keywords: ["JavaScript"] }],
  };
}
