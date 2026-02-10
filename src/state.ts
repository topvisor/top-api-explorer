import type { RequestState } from './types';

const HASH_KEY = 'api-explorer';
const SPEC_URL_KEY = 'api-spec-url';
const API_KEY_STORAGE = 'top-ae-token';
const MASK = 'top-ae';

export const emptyRequestState = (): RequestState => ({
  operationId: '',
  pathParams: {},
  queryParams: {},
  headers: {},
  body: {},
  rawBody: '{}',
});

export function serializeState(state: RequestState): string {
  return encodeURIComponent(JSON.stringify(state));
}

export function parseStateFromHash(): RequestState | null {
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  const packed = params.get(HASH_KEY);
  if (!packed) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(packed)) as RequestState;
  } catch {
    return null;
  }
}

export function saveStateToHash(state: RequestState): void {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  params.set(HASH_KEY, serializeState(state));
  window.history.replaceState(null, '', `#${params.toString()}`);
}

export function parseSpecUrlFromHash(): string {
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  return params.get(SPEC_URL_KEY) ?? '';
}

export function saveSpecUrlToHash(specUrl: string): void {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (specUrl.trim()) {
    params.set(SPEC_URL_KEY, specUrl.trim());
  } else {
    params.delete(SPEC_URL_KEY);
  }
  window.history.replaceState(null, '', `#${params.toString()}`);
}

function xorCipher(value: string): string {
  return value
    .split('')
    .map((char, index) => String.fromCharCode(char.charCodeAt(0) ^ MASK.charCodeAt(index % MASK.length)))
    .join('');
}

export function saveApiKey(apiKey: string): void {
  localStorage.setItem(API_KEY_STORAGE, btoa(xorCipher(apiKey)));
}

export function readApiKey(): string {
  const packed = localStorage.getItem(API_KEY_STORAGE);
  if (!packed) return '';

  try {
    return xorCipher(atob(packed));
  } catch {
    return '';
  }
}
