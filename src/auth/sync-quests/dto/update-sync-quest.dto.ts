import { PartialType } from '@nestjs/mapped-types';
import { CreateSyncQuestDto } from './create-sync-quest.dto';

export class UpdateSyncQuestDto extends PartialType(CreateSyncQuestDto) {}
