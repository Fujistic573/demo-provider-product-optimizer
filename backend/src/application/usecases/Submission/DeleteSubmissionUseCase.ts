import { ISubmissionRepository } from '../../../infrastructure/submissions/interfaces/ISubmissionRepository';

export class DeleteSubmissionUseCase {
  constructor(private repository: ISubmissionRepository) { }

  async execute(id: string): Promise<void> {
    const deleted = await this.repository.softDelete(id);

    if (!deleted) {
      throw new Error('Submission not found');
    }
  }
}
