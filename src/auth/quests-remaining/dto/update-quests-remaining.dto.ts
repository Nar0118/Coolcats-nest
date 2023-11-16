import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestsRemainingDto } from './create-quests-remaining.dto';

export class UpdateQuestsRemainingDto extends PartialType(
  CreateQuestsRemainingDto,
) {}
