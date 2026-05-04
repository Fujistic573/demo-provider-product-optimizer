import { databaseClient } from '../../database/databaseClient';
import { SubmissionEntity } from '../../../domain/entities/Submission/SubmissionEntity';
import { Submission, SubmissionStatus } from '../../../domain/entities/Submission/Submission';
import { ISubmissionRepository } from '../interfaces/ISubmissionRepository';

/**
 * Database-backed implementation of ISubmissionRepository.
 * Uses MySQL via databaseClient, but keeps the same interface as the file repository.
 */
export class DatabaseSubmissionRepository implements ISubmissionRepository {
  private readonly tableName = 'submissions';

  /**
   * Save a submission into the database.
   */
  async save(submission: SubmissionEntity): Promise<void> {
    const data = submission.toJSON();
    const createdAtDate = new Date(data.createdAt);

    const pool = databaseClient.getPool();
    await pool.execute(
      `INSERT INTO ${this.tableName} (id, name, email, message, city, country, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         email = VALUES(email),
         message = VALUES(message),
         city = VALUES(city),
         country = VALUES(country),
         status = VALUES(status)`,
      [data.id, data.name, data.email, data.message, data.city || null, data.country || null, data.status, createdAtDate],
    );
  }

  /**
   * Return all non-deleted submissions from the database.
   */
  async findAll(): Promise<Submission[]> {
    const rows = await databaseClient.query<any>(
      `SELECT id, name, email, message, city, country, status, created_at AS createdAt
       FROM ${this.tableName}
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`,
    );

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      message: row.message,
      city: row.city || undefined,
      country: row.country || undefined,
      status: (row.status || 'Open') as SubmissionStatus,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
    }));
  }

  /**
   * Find a single non-deleted submission by its id.
   */
  async findById(id: string): Promise<Submission | null> {
    const rows = await databaseClient.query<any>(
      `SELECT id, name, email, message, city, country, status, created_at AS createdAt
       FROM ${this.tableName}
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
      [id],
    );

    if (!rows.length) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      message: row.message,
      city: row.city || undefined,
      country: row.country || undefined,
      status: (row.status || 'Open') as SubmissionStatus,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
    };
  }

  /**
   * Find a non-deleted submission by email address.
   */
  async findByEmail(email: string): Promise<Submission | null> {
    const rows = await databaseClient.query<any>(
      `SELECT id, name, email, message, city, country, status, created_at AS createdAt
       FROM ${this.tableName}
       WHERE email = ? AND deleted_at IS NULL
       LIMIT 1`,
      [email],
    );

    if (!rows.length) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      message: row.message,
      city: row.city || undefined,
      country: row.country || undefined,
      status: (row.status || 'Open') as SubmissionStatus,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
    };
  }

  /**
   * Soft-delete a submission by setting deleted_at.
   * Returns true if a row was updated, false if not found.
   */
  async softDelete(id: string): Promise<boolean> {
    const pool = databaseClient.getPool();
    const [result] = await pool.execute(
      `UPDATE ${this.tableName} SET deleted_at = NOW(6) WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return (result as any).affectedRows > 0;
  }

  /**
   * Replace all submissions with the provided list.
   * For compatibility with the file repository interface.
   */
  async saveAll(submissions: Submission[]): Promise<void> {
    // Simple strategy: delete all and re-insert.
    // This matches the semantics of overwriting the JSON file.
    await databaseClient.query(`DELETE FROM ${this.tableName}`);

    if (!submissions.length) {
      return;
    }

    const values: any[] = [];
    const placeholders = submissions
      .map((s) => {
        values.push(s.id, s.name, s.email, s.message, s.city || null, s.country || null, s.status || 'Open', new Date(s.createdAt), s.deletedAt ? new Date(s.deletedAt) : null);
        return '(?, ?, ?, ?, ?, ?, ?, ?, ?)';
      })
      .join(', ');

    await databaseClient.query(
      `
      INSERT INTO ${this.tableName} (id, name, email, message, city, country, status, created_at, deleted_at)
      VALUES ${placeholders}
      `,
      values,
    );
  }
}
