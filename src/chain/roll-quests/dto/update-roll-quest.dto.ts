import { PartialType } from '@nestjs/mapped-types';
import { CreateRollQuestDto } from './create-roll-quest.dto';

export class UpdateRollQuestDto extends PartialType(CreateRollQuestDto) {}
