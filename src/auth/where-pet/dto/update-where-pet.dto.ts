import { PartialType } from '@nestjs/mapped-types';
import { CreateWherePetDto } from './create-where-pet.dto';

export class UpdateWherePetDto extends PartialType(CreateWherePetDto) {}
