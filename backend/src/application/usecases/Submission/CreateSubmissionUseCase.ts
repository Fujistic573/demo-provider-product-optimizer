import { SubmissionEntity } from '../../../domain/entities/Submission/SubmissionEntity';
import { CreateSubmissionRequest } from '../../../presentation/requests/Submission/CreateSubmissionRequest';
import { CreateSubmissionResponse } from '../../../presentation/responses/Submission/CreateSubmissionResponse';
import { ISubmissionRepository } from '../../../infrastructure/submissions/interfaces/ISubmissionRepository';

export class CreateSubmissionUseCase {
  constructor(private repository: ISubmissionRepository) { }

  async execute(request: CreateSubmissionRequest): Promise<CreateSubmissionResponse> {
    // Check for duplicate email
    const normalizedEmail = request.email.trim().toLowerCase();
    const existing = await this.repository.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error('A submission with this email already exists');
    }

    // Create entity with validation
    const submission = SubmissionEntity.create(request);

    // Save to repository
    await this.repository.save(submission);

    // Return response
    return new CreateSubmissionResponse(submission);
  }
}
