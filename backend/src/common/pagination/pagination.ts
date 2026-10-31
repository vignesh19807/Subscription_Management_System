import { PaginationMeta } from "../types/api.types.js";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export function parsePagination(
  query: Record<string, unknown>,
  defaultLimit = 20,
  maxLimit = 100,
): PaginationParams {
  const rawPage = Number(query["page"]);
  const rawLimit = Number(query["limit"]);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  let limit =
    Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit;

  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit,
  };
}

export function buildPaginationMeta(
  totalRecords: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  return {
    page,
    limit,
    totalRecords,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
