export function csvRows(input: string) {
  const text = input.replace(/^\uFEFF/, "");
  const first = text.split(/\r?\n/, 1)[0];
  const delimiter = [";", ",", "\t"].sort(
    (a, b) => first.split(b).length - first.split(a).length,
  )[0];
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (quoted || !field) quoted = !quoted;
      else throw new Error("Ungültige CSV-Anführungszeichen.");
    } else if (ch === delimiter && !quoted) {
      row.push(field);
      field = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
    if (field.length > 10000 || row.length > 100 || rows.length > 10000)
      throw new Error("Importdatei zu umfangreich.");
  }
  if (quoted) throw new Error("Nicht geschlossenes CSV-Feld.");
  row.push(field);
  if (row.some((v) => v.trim())) rows.push(row);
  if (!rows.length) throw new Error("Datei enthält keine Zeilen.");
  const headers = rows.shift()!.map((h) => h.trim());
  if (new Set(headers).size !== headers.length || headers.some((h) => !h))
    throw new Error("CSV-Spalten brauchen eindeutige Namen.");
  return { headers, rows };
}
