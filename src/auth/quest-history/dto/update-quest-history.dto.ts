import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestHistoryDto } from './create-quest-history.dto';

export class UpdateQuestHistoryDto extends PartialType(CreateQuestHistoryDto) {}
