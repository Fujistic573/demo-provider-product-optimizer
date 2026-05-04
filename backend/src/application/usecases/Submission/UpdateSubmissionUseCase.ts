import { SubmissionEntity } from '../../../domain/entities/Submission/SubmissionEntity';
import { UpdateSubmissionRequest } from '../../../presentation/requests/Submission/UpdateSubmissionRequest';
import { UpdateSubmissionResponse } from '../../../presentation/responses/Submission/UpdateSubmissionResponse';
import { ISubmissionRepository } from '../../../infrastructure/submissions/interfaces/ISubmissionRepository';

export class UpdateSubmissionUseCase {
  constructor(private repository: ISubmissionRepository) { }

  async execute(id: string, request: UpdateSubmissionRequest): Promise<UpdateSubmissionResponse> {
    // Check if submission exists
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new Error('Submission not found');
    }

    // Create updated entity using existing createdAt
    const updatedEntity = SubmissionEntity.update(id, request, existing.createdAt);

    // Save to repository (DatabaseSubmissionRepository handles update via ON DUPLICATE KEY)
    await this.repository.save(updatedEntity);

    return new UpdateSubmissionResponse(updatedEntity.toJSON());
  }
}
