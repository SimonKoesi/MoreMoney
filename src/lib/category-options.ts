export const paymentCategories = [
  "Lebensmittel",
  "Wohnen",
  "Mobilität",
  "Gesundheit",
  "Versicherungen",
  "Freizeit",
  "Shopping",
  "Abos",
  "Gehalt",
  "Investments",
  "Steuern",
  "Sonstiges",
];
export const subscriptionCategories = [
  "Streaming",
  "Musik",
  "Software & Cloud",
  "Internet & Mobilfunk",
  "Versicherungen",
  "Fitness",
  "Bildung",
  "Mobilität",
  "Mitgliedschaften",
  "Sonstiges",
];
export function categoryOptions(defaults: string[], saved: string[]) {
  return [
    ...new Set([
      ...defaults,
      ...saved.map((value) => value.trim()).filter(Boolean),
    ]),
  ];
}
