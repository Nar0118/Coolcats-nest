import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestSelectionDto } from './create-quest-selection.dto';

export class UpdateQuestSelectionDto extends PartialType(
  CreateQuestSelectionDto,
) {}
