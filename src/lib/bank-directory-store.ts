import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { dataDir } from "./db";
import {
  bundesbankPage,
  currentDirectoryUrl,
  parseBankDirectory,
  searchBankDirectory,
} from "./bank-directory";
import type { DirectoryBank } from "./bank-directory";

type Directory = { checked: string; banks: DirectoryBank[]; local?: boolean };
const file = path.join(dataDir, "bundesbank-directory.json");
let cache: Directory | null = null;
let updating: Promise<Directory> | undefined;

async function fetchText(url: string, limit: number, encoding: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    redirect: "error",
    cache: "no-store",
  });
  if (!response.ok || !response.body)
    throw new Error("Bundesbank derzeit nicht erreichbar.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder(encoding, { fatal: true });
  let bytes = 0;
  let content = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return content + decoder.decode();
      bytes += value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new Error("Bundesbank-Datei ist zu groß.");
      }
      content += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

async function update() {
  const page = await fetchText(bundesbankPage, 2_000_000, "utf-8");
  const banks = parseBankDirectory(
    await fetchText(currentDirectoryUrl(page), 6_000_000, "windows-1252"),
  );
  return storeDirectory(banks, false);
}

async function storeDirectory(banks: DirectoryBank[], local: boolean) {
  const directory = { checked: new Date().toISOString(), banks, local };
  const temporary = file + "." + crypto.randomUUID();
  await writeFile(temporary, JSON.stringify(directory), {flag:"wx"});
  await rename(temporary, file);
  cache = directory;
  return directory;
}

export async function importBankDirectory(bytes: Uint8Array) {
  if (updating) await updating.catch(() => undefined);
  await storeDirectory(parseBankDirectory(new TextDecoder("windows-1252").decode(bytes)), true);
}

export async function bankDirectory(query: string, refresh: boolean) {
  cache ??= await readFile(file, "utf8")
    .then((content) => JSON.parse(content) as Directory)
    .catch(() => null);
  if (refresh && (!cache || Date.now() - Date.parse(cache.checked) > 3600000)) {
    updating ??= update().finally(() => {
      updating = undefined;
    });
    await updating;
  }
  return {
    checked: cache?.checked ?? null,
    local: cache?.local ?? false,
    banks: searchBankDirectory(query, cache?.banks ?? []),
  };
}
