// Azure Table Storage client for applications

import { TableClient } from "@azure/data-tables";
import type { JobApplicationEntity, JobApplicationResponse } from "../types";

const TABLE_NAME = "applications";

function getTableClient(): TableClient {
  const connStr = process.env.AZURE_TABLE_STORAGE_CONNECTION_STRING;
  if (!connStr) throw new Error("AZURE_TABLE_STORAGE_CONNECTION_STRING is not set");
  return TableClient.fromConnectionString(connStr, TABLE_NAME);
}

export async function ensureTableExists(): Promise<void> {
  const connStr = process.env.AZURE_TABLE_STORAGE_CONNECTION_STRING;
  if (!connStr) return;
  const client = getTableClient();
  try {
    await client.createTable();
  } catch (err: unknown) {
    if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 409) {
      return; // table already exists
    }
    throw err;
  }
}

export async function createApplication(
  userId: string,
  entity: Omit<JobApplicationEntity, "partitionKey" | "rowKey" | "appliedDate">
): Promise<JobApplicationResponse> {
  return createApplicationWithDate(userId, entity, new Date().toISOString());
}

/** Create an application with a specific appliedDate (for seeding/test data). */
export async function createApplicationWithDate(
  userId: string,
  entity: Omit<JobApplicationEntity, "partitionKey" | "rowKey" | "appliedDate">,
  appliedDate: string
): Promise<JobApplicationResponse> {
  await ensureTableExists();
  const table = getTableClient();
  const rowKey = crypto.randomUUID();
  const row: JobApplicationEntity = {
    partitionKey: userId,
    rowKey,
    company: entity.company,
    role: entity.role,
    sourceUrl: entity.sourceUrl,
    status: entity.status,
    appliedDate,
  };
  await table.createEntity(row);
  return {
    rowKey: row.rowKey,
    company: row.company,
    role: row.role,
    sourceUrl: row.sourceUrl,
    status: row.status as JobApplicationResponse["status"],
    appliedDate: row.appliedDate,
  };
}

export async function updateApplicationStatus(
  userId: string,
  rowKey: string,
  status: string
): Promise<JobApplicationResponse | null> {
  await ensureTableExists();
  const table = getTableClient();
  const filter = `PartitionKey eq '${userId.replace(/'/g, "''")}' and RowKey eq '${rowKey.replace(/'/g, "''")}'`;
  const entities: JobApplicationEntity[] = [];
  for await (const entity of table.listEntities({ queryOptions: { filter } })) {
    entities.push(entity as unknown as JobApplicationEntity);
  }
  const existing = entities[0];
  if (!existing) return null;
  const updated: JobApplicationEntity = {
    ...existing,
    status,
  };
  await table.updateEntity(updated);
  return {
    rowKey: updated.rowKey,
    company: updated.company,
    role: updated.role,
    sourceUrl: updated.sourceUrl,
    status: updated.status as JobApplicationResponse["status"],
    appliedDate: updated.appliedDate,
  };
}

export async function listApplicationsByUser(userId: string): Promise<JobApplicationResponse[]> {
  await ensureTableExists();
  const table = getTableClient();
  const entities: JobApplicationEntity[] = [];
  const filter = `PartitionKey eq '${userId.replace(/'/g, "''")}'`;
  for await (const entity of table.listEntities({ queryOptions: { filter } })) {
    entities.push(entity as unknown as JobApplicationEntity);
  }
  entities.sort((a, b) => (b.appliedDate > a.appliedDate ? 1 : -1));
  return entities.map((e) => ({
    rowKey: e.rowKey,
    company: e.company,
    role: e.role,
    sourceUrl: e.sourceUrl,
    status: e.status as JobApplicationResponse["status"],
    appliedDate: e.appliedDate,
  }));
}
