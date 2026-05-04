import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { Submission, SubmissionStatus } from '../../../domain/entities/Submission/Submission';
import { SubmissionEntity } from '../../../domain/entities/Submission/SubmissionEntity';
import { ISubmissionRepository } from '../interfaces/ISubmissionRepository';

// Get DATA_FILE_PATH from environment variable, with fallback to default
const getDataFilePath = (): string => {
  const envPath = process.env.DATA_FILE_PATH;
  if (envPath) {
    // If it's an absolute path, use it directly
    if (path.isAbsolute(envPath)) {
      return envPath;
    }
    // If it's a relative path, resolve it relative to the backend directory
    return path.resolve(process.cwd(), envPath);
  }
  // Default fallback
  return path.join(__dirname, '../../../../data/submissions.json');
};

const DATA_FILE_PATH = getDataFilePath();

export class FileRepository implements ISubmissionRepository {

  private async ensureDataFile(): Promise<void> {
    try {
      await fs.access(DATA_FILE_PATH);
    } catch {
      // File doesn't exist, create it with empty array
      const dir = path.dirname(DATA_FILE_PATH);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  /**
   * Read all submissions from disk (including soft-deleted ones).
   */
  private async readAll(): Promise<Submission[]> {
    await this.ensureDataFile();

    try {
      const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
      const submissions: Submission[] = JSON.parse(data);
      // Ensure existing data has new fields with defaults
      return submissions.map(s => ({
        ...s,
        status: s.status || 'Open' as SubmissionStatus,
        deletedAt: s.deletedAt || null,
      }));
    } catch (error) {
      // If file is empty or invalid, return empty array
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to read submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async save(submission: SubmissionEntity): Promise<void> {
    const all = await this.readAll();
    all.push(submission.toJSON());

    await fs.writeFile(
      DATA_FILE_PATH,
      JSON.stringify(all, null, 2),
      'utf-8'
    );
  }

  /**
   * Return only non-deleted submissions.
   */
  async findAll(): Promise<Submission[]> {
    const all = await this.readAll();
    return all.filter(s => !s.deletedAt);
  }

  /**
   * Find a non-deleted submission by id.
   */
  async findById(id: string): Promise<Submission | null> {
    const all = await this.readAll();
    const submission = all.find(s => s.id === id && !s.deletedAt);
    return submission || null;
  }

  /**
   * Find a non-deleted submission by email.
   */
  async findByEmail(email: string): Promise<Submission | null> {
    const all = await this.readAll();
    const submission = all.find(s => s.email === email && !s.deletedAt);
    return submission || null;
  }

  /**
   * Soft-delete a submission by setting deletedAt.
   * Returns true if found and marked, false if not found.
   */
  async softDelete(id: string): Promise<boolean> {
    const all = await this.readAll();
    const index = all.findIndex(s => s.id === id && !s.deletedAt);

    if (index === -1) {
      return false;
    }

    all[index].deletedAt = new Date().toISOString();

    await fs.writeFile(
      DATA_FILE_PATH,
      JSON.stringify(all, null, 2),
      'utf-8'
    );

    return true;
  }

  async saveAll(submissions: Submission[]): Promise<void> {
    await this.ensureDataFile();

    await fs.writeFile(
      DATA_FILE_PATH,
      JSON.stringify(submissions, null, 2),
      'utf-8'
    );
  }
}
