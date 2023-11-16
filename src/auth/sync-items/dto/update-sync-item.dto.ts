import { PartialType } from '@nestjs/mapped-types';
import { CreateSyncItemDto } from './create-sync-item.dto';

export class UpdateSyncItemDto extends PartialType(CreateSyncItemDto) {}
