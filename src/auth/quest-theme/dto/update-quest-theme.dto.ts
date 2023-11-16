import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestThemeDto } from './create-quest-theme.dto';

export class UpdateQuestThemeDto extends PartialType(CreateQuestThemeDto) {}
