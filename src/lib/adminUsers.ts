import { Role, UtilisateurDTO } from '../types';

export type UserSortKey = 'login' | 'role' | 'status' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export const USER_PAGE_SIZE = 8;

const ROLE_ORDER: Record<Role, number> = {
  CLIENT: 1,
  BUREAU_ETUDE: 2,
  ADMIN: 3,
};

export function getApiMessage(error: unknown, fallback: string): string {
  const candidate = error as { response?: { data?: { message?: string } }; message?: string };
  return candidate?.response?.data?.message ?? candidate?.message ?? fallback;
}

export function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function roleBadgeClass(role: Role): string {
  if (role === 'ADMIN') return 'border-red-200 bg-red-50 text-red-700';
  if (role === 'BUREAU_ETUDE') return 'border-violet-200 bg-violet-50 text-violet-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function compareByLogin(a: UtilisateurDTO, b: UtilisateurDTO): number {
  return a.login.localeCompare(b.login, 'fr', { sensitivity: 'base' });
}

function compareByRole(a: UtilisateurDTO, b: UtilisateurDTO): number {
  return ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
}

function compareByStatus(a: UtilisateurDTO, b: UtilisateurDTO): number {
  return Number(a.enabled) - Number(b.enabled);
}

function compareByCreatedAt(a: UtilisateurDTO, b: UtilisateurDTO): number {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

const COMPARE_BY: Record<UserSortKey, (a: UtilisateurDTO, b: UtilisateurDTO) => number> = {
  login: compareByLogin,
  role: compareByRole,
  status: compareByStatus,
  createdAt: compareByCreatedAt,
};

export function sortUtilisateurs(
  utilisateurs: UtilisateurDTO[],
  sortKey: UserSortKey,
  direction: SortDirection,
): UtilisateurDTO[] {
  const factor = direction === 'asc' ? 1 : -1;
  const compareFn = COMPARE_BY[sortKey];
  return [...utilisateurs].sort((a, b) => compareFn(a, b) * factor);
}

export function paginateUtilisateurs(
  utilisateurs: UtilisateurDTO[],
  page: number,
  pageSize: number,
): { items: UtilisateurDTO[]; totalPages: number } {
  if (utilisateurs.length === 0) {
    return { items: [], totalPages: 1 };
  }

  const totalPages = Math.max(1, Math.ceil(utilisateurs.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  return {
    items: utilisateurs.slice(startIndex, startIndex + pageSize),
    totalPages,
  };
}


