import { Submission } from '../../../domain/entities/Submission/Submission';
import { SubmissionEntity } from '../../../domain/entities/Submission/SubmissionEntity';

export interface ISubmissionRepository {
  save(submission: SubmissionEntity): Promise<void>;
  findAll(): Promise<Submission[]>;
  findById(id: string): Promise<Submission | null>;
  findByEmail(email: string): Promise<Submission | null>;
  softDelete(id: string): Promise<boolean>;
  saveAll(submissions: Submission[]): Promise<void>;
}
