import { PartialType } from '@nestjs/mapped-types';
import { CreateStakePetDto } from './create-stake-pet.dto';

export class UpdateStakePetDto extends PartialType(CreateStakePetDto) {}
