import { analysisPeriod } from "./analysis-periods";
import { addMonths, berlinDay } from "./calendar";
import { money } from "./finance";
import type { IntelligenceState } from "./intelligence-state";

export const topics = [
  "overview",
  "spending",
  "subscriptions",
  "budget",
  "savings",
  "health",
  "wealth",
  "payments",
  "unknown",
] as const;
export type Topic = (typeof topics)[number];
export const reportKinds = [
  "week",
  "month",
  "closing",
  "quarter",
  "year",
] as const;
export const reportLabels = {
  week: "Wochenüberblick",
  month: "Monatsüberblick",
  closing: "Monatsabschluss",
  quarter: "Quartalsbericht",
  year: "Jahresübersicht",
};
export type ReportKind = (typeof reportKinds)[number];

export function reportQuery(kind: ReportKind, today = berlinDay()) {
  if (kind === "quarter") {
    const offset = (Number(today.slice(5, 7)) - 1) % 3;
    return {
      period: "custom",
      from: addMonths(today.slice(0, 7) + "-01", -offset),
      to: today,
    };
  }
  return { period: kind === "closing" ? "lastMonth" : kind };
}

export function localTopic(question: string): Topic {
  const q = question.toLocaleLowerCase("de");
  if (/vermögen|nettovermögen|liquidität/.test(q)) return "wealth";
  if (/score|health|gesundheit/.test(q)) return "health";
  if (/sparziel|spare |spartopf|sparen/.test(q)) return "savings";
  if (/abo|verträge|fixkosten/.test(q)) return "subscriptions";
  if (/budget|grenze/.test(q)) return "budget";
  if (/fällig|zahlungs|zahlung|rate|darlehen/.test(q)) return "payments";
  if (/ausgab|ausgegeb|kosten|kategorie/.test(q)) return "spending";
  if (/übersicht|einnahm|cashflow|überblick|finanzlage|monat|woche/.test(q))
    return "overview";
  return "unknown";
}

export function questionPeriod(question: string) {
  const q = question.toLocaleLowerCase("de");
  if (/letzten monat|vormonat/.test(q)) return "lastMonth";
  if (/letztes jahr|vorjahr/.test(q)) return "lastYear";
  if (/woche/.test(q)) return "week";
  if (/jahr/.test(q)) return "year";
  return "month";
}

type Section = { title: string; lines: string[]; route?: string };
const date = (day: string) => day.split("-").reverse().join(".");
const dateRange = (range: { from: string; to: string }) =>
  `${date(range.from)} – ${date(range.to)}`;
const scoreLabels: Record<string, string> = {
  liquidity: "Liquidität",
  cashflow: "Cashflow",
  debt: "Schulden",
  budget: "Budget",
  future: "Vorsorge",
  obligations: "Verpflichtungen",
};

export function financialSections(state: IntelligenceState) {
  const {
    analysis,
    health,
    savingsGoals,
    budgets,
    worth,
    worthHistory,
    subscriptions,
    upcoming,
    asOf,
  } = state;
  const recent = [...analysis.categories]
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const monthly = state.subscriptionMonthlyCents;
  const snapshot = worthHistory
    .filter((entry) => entry.day <= state.range.to)
    .at(-1);
  const before = worthHistory
    .filter((entry) => entry.day < state.range.from)
    .at(-1);
  const next = upcoming.slice(0, 5);
  const reportedWorth =
    state.range.to === asOf
      ? worth.netCents
      : snapshot
        ? Number(snapshot.netCents)
        : null;
  const worthDate = state.range.to === asOf ? asOf : snapshot?.day;
  const dataNotes = [
    ...(!analysis.totalTransactions
      ? ["Für diesen Zeitraum sind keine Buchungen erfasst."]
      : []),
    ...(analysis.excludedCurrencies.length
      ? [
          `Ohne passende Währungsbewertung: ${analysis.excludedCurrencies.join(", ")}.`,
        ]
      : []),
  ];
  return {
    overview: {
      title: "Einnahmen und Ausgaben",
      route: "#/analysis",
      lines: [
        dateRange(state.range),
        ...dataNotes,
        ...(analysis.totalTransactions
          ? [
              `Einnahmen ${money(analysis.incomeCents)}`,
              `Ausgaben ${money(analysis.expenseCents)}`,
              `Saldo ${money(analysis.surplusCents)}`,
              `Sparquote ${analysis.savingsRateBps === null ? "offen" : `${analysis.savingsRateBps / 100} %`}`,
            ]
          : []),
      ],
    },
    spending: {
      title: "Größte Ausgabenkategorien",
      route: "#/analysis",
      lines: [
        dateRange(state.range),
        ...dataNotes,
        ...(recent.length
          ? recent.map((row) => `${row.name} · ${money(row.value)}`)
          : ["Keine bewerteten Ausgabenkategorien."]),
        ...(analysis.expenseChangePercent === null
          ? []
          : [
              `Ausgaben gegenüber Vergleichszeitraum ${analysis.expenseChangePercent} %`,
            ]),
      ],
    },
    subscriptions: {
      title: "Abonnements",
      route: "#/subscriptions",
      lines: [
        `Stand ${date(asOf)}`,
        ...(subscriptions.length
          ? [
              `${subscriptions.filter((row) => row.status === "active").length} aktive Verträge`,
              `${money(monthly)} monatlicher EUR-Planwert`,
            ]
          : ["Keine Verträge erfasst."]),
      ],
    },
    budget: {
      title: "Ausgabenbudgets",
      route: "#/analysis",
      lines: [
        `Aktuelle Budgets am ${date(asOf)}`,
        ...(budgets.length
          ? budgets
              .slice(0, 8)
              .map(
                (row) =>
                  `${row.name} · ${money(row.spentCents)} von ${money(row.limitCents)}`,
              )
          : ["Keine Ausgabenbudgets erfasst."]),
      ],
    },
    savings: {
      title: "Sparziele",
      route: "#/goals",
      lines: [
        `Stand ${date(asOf)}`,
        ...(savingsGoals.some((row) => row.status !== "archived")
          ? savingsGoals
              .filter((row) => row.status !== "archived")
              .slice(0, 8)
              .map(
                (row) =>
                  `${row.name} · ${money(row.savedCents, row.currency)} von ${money(row.targetCents, row.currency)}`,
              )
          : ["Keine Sparziele erfasst."]),
      ],
    },
    health: {
      title: "Financial Health",
      route: "#/health",
      lines: [
        `Modellstand ${date(asOf)}`,
        health.score === null
          ? "Score wegen fehlender Daten offen."
          : `Score ${health.score} / 100`,
        `Datenabdeckung ${health.coverage} %`,
        ...health.details
          .filter((row) => row.displayScore !== null)
          .slice(0, 6)
          .map(
            (row) => `${scoreLabels[row.category]} · ${row.displayScore} / 100`,
          ),
      ],
    },
    wealth: {
      title: "Nettovermögen",
      route: "#/worth",
      lines: [
        ...(reportedWorth === null
          ? ["Kein Vermögensstand für diesen Zeitraum verfügbar."]
          : [`${money(reportedWorth)} · Stand ${date(worthDate!)}`]),
        ...(before && reportedWorth !== null
          ? [
              `Veränderung seit ${date(before.day)} · ${money(reportedWorth - Number(before.netCents))}`,
            ]
          : ["Kein früherer Vergleichsstand verfügbar."]),
        ...(worth.excludedCurrencies.length
          ? [`Aktuell ohne Bewertung: ${worth.excludedCurrencies.join(", ")}`]
          : []),
      ],
    },
    payments: {
      title: "Kommende Zahlungen",
      route: "#/installments",
      lines: [
        ...(next.length
          ? next.map(
              (row) =>
                `${date(row.date)} · ${row.name} · ${money(row.amountCents, row.currency)}`,
            )
          : ["Keine offenen Termine in der erfassten Vorschau."]),
      ],
    },
    unknown: {
      title: "Thema wählen",
      lines: [
        "Fragen zu Einnahmen, Ausgaben, Budgets, Abos, Sparzielen, Fälligkeiten, Vermögen und Financial Health werden unterstützt.",
      ],
    },
  } satisfies Record<Topic, Section>;
}

export function compileReport(kind: ReportKind, state: IntelligenceState) {
  const sections = financialSections(state);
  const notices = state.warnings
    .slice()
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);
  const positive = [
    ...(state.analysis.totalTransactions && state.analysis.surplusCents > 0
      ? ["Die erfassten Einnahmen übersteigen die bewerteten Ausgaben."]
      : []),
    ...(state.analysis.expenseChangePercent !== null &&
    state.analysis.expenseChangePercent < 0
      ? [
          "Die bewerteten Ausgaben sind gegenüber dem Vergleichszeitraum gesunken.",
        ]
      : []),
  ];
  return {
    title: reportLabels[kind],
    period: dateRange(state.range),
    sections: [
      sections.overview,
      sections.spending,
      sections.wealth,
      sections.budget,
      sections.savings,
      sections.health,
      sections.subscriptions,
      {
        title: "Hinweise",
        lines: notices.length
          ? notices.map((row) => row.description)
          : ["Keine regelbasierten Hinweise im aktuellen Datenstand."],
      },
      {
        title: "Positive Entwicklungen",
        lines: positive.length
          ? positive
          : ["Keine positiven Veränderungen aus dieser Auswertung ableitbar."],
      },
      {
        title: "Nächste Schritte",
        lines: [
          ...(!state.quality.fresh
            ? ["Datenabdeckung im Bereich Financial Health prüfen."]
            : []),
          ...(notices.length
            ? ["Priorisierte Hinweise im Benachrichtigungscenter prüfen."]
            : []),
          ...(!state.analysis.totalTransactions
            ? ["Buchungen für den Zeitraum ergänzen."]
            : [
                "Kategorien und erfasste Buchungen auf Vollständigkeit prüfen.",
              ]),
        ],
      },
    ] as Section[],
  };
}
export type Report = ReturnType<typeof compileReport>;
export const reportText = (report: Report) =>
  [
    report.title,
    report.period,
    ...report.sections.flatMap((section) => [
      "",
      section.title,
      ...section.lines,
    ]),
  ].join("\n");
export const reportRange = (kind: ReportKind, today = berlinDay()) => {
  const query = reportQuery(kind, today);
  return analysisPeriod(query.period, query.from, query.to, today);
};
