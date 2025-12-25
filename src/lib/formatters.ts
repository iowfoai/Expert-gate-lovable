// Utility functions for formatting database values to display-friendly strings

export const formatOccupation = (occupation: string): string => {
  const labels: Record<string, string> = {
    industry_professional: "Industry Professional",
    researcher: "Researcher",
    professor: "Professor",
    consultant: "Consultant",
    engineer: "Engineer",
    scientist: "Scientist",
    analyst: "Analyst",
    developer: "Developer",
    manager: "Manager",
    director: "Director",
    executive: "Executive",
    entrepreneur: "Entrepreneur",
    student: "Student",
    postdoc: "Postdoctoral Researcher",
    phd_candidate: "PhD Candidate",
    masters_student: "Master's Student",
    bachelors_student: "Bachelor's Student",
  };
  return labels[occupation] || occupation.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export const formatOccupations = (occupations: string[] | null): string => {
  if (!occupations || occupations.length === 0) return '';
  return occupations.map(formatOccupation).join(', ');
};

export const getEducationLabel = (level: string | null): string | null => {
  const labels: Record<string, string> = {
    bachelors: "Bachelor's",
    masters: "Master's",
    phd: "PhD",
    postdoc: "Postdoctoral",
    professor: "Professor",
    industry_professional: "Industry Professional"
  };
  return level ? labels[level] || level : null;
};

export const getEducationLabelFull = (level: string | null): string | null => {
  const labels: Record<string, string> = {
    bachelors: "Bachelor's Degree",
    masters: "Master's Degree",
    phd: "PhD",
    postdoc: "Postdoctoral Researcher",
    professor: "Professor",
    industry_professional: "Industry Professional"
  };
  return level ? labels[level] || level : null;
};
