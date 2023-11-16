import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestIoDto } from './create-quest-io.dto';

export class UpdateQuestIoDto extends PartialType(CreateQuestIoDto) {}
