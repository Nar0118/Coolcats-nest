import { PartialType } from '@nestjs/mapped-types';
import { CreatePetActivityDto } from './create-pet-activity.dto';

export class UpdatePetActivityDto extends PartialType(CreatePetActivityDto) {}
