import { PartialType } from '@nestjs/mapped-types';
import { CreateUserActivityDto } from './create-user-activity.dto';

export class UpdateUserActivityDto extends PartialType(CreateUserActivityDto) {}
