import {
  defaultMatrix,
  isTeam,
  normalizeMatrix,
  type MenuKey,
  type PermissionLevel,
  type PermissionMatrix,
  type Team,
} from "@/domain/access";

const STORAGE_KEY = "thaiHomeAccess:v1";
const STORE_EVENT = "thai-home-access-change";

type AccessState = {
  currentTeam: Team | null;
  matrix: PermissionMatrix;
};

const signedOutState: AccessState = { currentTeam: null, matrix: defaultMatrix };

// snapshot ต้องเป็น reference เดิมทุกครั้งที่ค่าไม่เปลี่ยน
// ไม่งั้น useSyncExternalStore จะวนซ้ำไม่รู้จบ
let cachedRawValue: string | null = null;
let cachedStateValue: AccessState = signedOutState;

export function getAccessState(): AccessState {
  return readState();
}

export function getCurrentTeam(): Team | null {
  return readState().currentTeam;
}

export function getMatrix(): PermissionMatrix {
  return readState().matrix;
}

export function signIn(team: Team): void {
  writeState({ ...readState(), currentTeam: team });
}

export function signOut(): void {
  writeState({ ...readState(), currentTeam: null });
}

export function setPermission(team: Team, menu: MenuKey, level: PermissionLevel): void {
  const state = readState();
  writeState({
    ...state,
    matrix: {
      ...state.matrix,
      [team]: { ...state.matrix[team], [menu]: level },
    },
  });
}

export function resetMatrix(): void {
  writeState({ ...readState(), matrix: defaultMatrix });
}

export function subscribeToAccess(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", callback);
  window.addEventListener(STORE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORE_EVENT, callback);
  };
}

/** snapshot ฝั่งเซิร์ฟเวอร์ ยังอ่าน localStorage ไม่ได้จึงยังไม่รู้ว่าใคร login */
export function serverAccessState(): AccessState {
  return signedOutState;
}

function readState(): AccessState {
  if (typeof window === "undefined") return signedOutState;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === cachedRawValue) return cachedStateValue;
  if (!stored) {
    cachedRawValue = null;
    cachedStateValue = signedOutState;
    return cachedStateValue;
  }
  return parseState(stored);
}

function writeState(state: AccessState): void {
  const serialized = JSON.stringify(state);
  cachedRawValue = serialized;
  cachedStateValue = state;
  window.localStorage.setItem(STORAGE_KEY, serialized);
  window.dispatchEvent(new Event(STORE_EVENT));
}

function parseState(value: string): AccessState {
  try {
    const parsed = JSON.parse(value) as Partial<AccessState>;
    cachedRawValue = value;
    cachedStateValue = {
      currentTeam: isTeam(parsed.currentTeam) ? parsed.currentTeam : null,
      matrix: normalizeMatrix(parsed.matrix),
    };
    return cachedStateValue;
  } catch {
    cachedRawValue = value;
    cachedStateValue = signedOutState;
    return cachedStateValue;
  }
}
