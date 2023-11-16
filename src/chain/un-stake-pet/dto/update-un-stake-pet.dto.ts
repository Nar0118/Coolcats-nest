import { PartialType } from '@nestjs/mapped-types';
import { CreateUnStakePetDto } from './create-un-stake-pet.dto';

export class UpdateUnStakePetDto extends PartialType(CreateUnStakePetDto) {}
