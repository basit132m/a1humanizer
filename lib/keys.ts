import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface KeyEntry {
  key: string;
  label: string;
  createdAt: string;
  active: boolean;
}

interface KeysStore {
  keys: KeyEntry[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const KEYS_FILE = path.join(DATA_DIR, "keys.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): KeysStore {
  ensureDataDir();
  if (!fs.existsSync(KEYS_FILE)) {
    return { keys: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(KEYS_FILE, "utf-8")) as KeysStore;
  } catch {
    return { keys: [] };
  }
}

function writeStore(store: KeysStore) {
  ensureDataDir();
  fs.writeFileSync(KEYS_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export function isAdminKey(key: string): boolean {
  const adminKey = process.env.ADMIN_KEY;
  return !!adminKey && key.trim() === adminKey.trim();
}

export function isValidKey(key: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();

  // Admin key is always valid
  if (isAdminKey(trimmed)) return true;

  // Legacy env-based keys
  const envKeys = (process.env.ACCESS_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (envKeys.includes(trimmed)) return true;

  // File-based keys
  const store = readStore();
  return store.keys.some((k) => k.key === trimmed && k.active);
}

export function getAllKeys(): KeyEntry[] {
  return readStore().keys;
}

export function generateKey(label: string): KeyEntry {
  const store = readStore();
  const key = makeKey();
  const entry: KeyEntry = {
    key,
    label: label.trim() || "Unnamed",
    createdAt: new Date().toISOString(),
    active: true,
  };
  store.keys.push(entry);
  writeStore(store);
  return entry;
}

export function revokeKey(key: string): boolean {
  const store = readStore();
  const entry = store.keys.find((k) => k.key === key);
  if (!entry) return false;
  entry.active = false;
  writeStore(store);
  return true;
}

export function deleteKey(key: string): boolean {
  const store = readStore();
  const idx = store.keys.findIndex((k) => k.key === key);
  if (idx === -1) return false;
  store.keys.splice(idx, 1);
  writeStore(store);
  return true;
}

function makeKey(): string {
  // Format: A1H-XXXXXXXX-XXXXXXXX-XXXX  (readable, hard to guess)
  const hex = crypto.randomBytes(12).toString("hex").toUpperCase();
  return `A1H-${hex.slice(0, 8)}-${hex.slice(8, 16)}-${hex.slice(16)}`;
}
