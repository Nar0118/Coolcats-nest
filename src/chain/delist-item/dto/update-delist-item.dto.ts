import { PartialType } from '@nestjs/mapped-types';
import { CreateDelistItemDto } from './create-delist-item.dto';

export class UpdateDelistItemDto extends PartialType(CreateDelistItemDto) {}
