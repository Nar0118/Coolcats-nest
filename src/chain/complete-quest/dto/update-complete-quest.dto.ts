import { PartialType } from '@nestjs/mapped-types';
import { CreateCompleteQuestDto } from './create-complete-quest.dto';

export class UpdateCompleteQuestDto extends PartialType(
  CreateCompleteQuestDto,
) {}
