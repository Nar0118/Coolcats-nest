import { PartialType } from '@nestjs/mapped-types';
import { CreateListContractDto } from './create-list-contract.dto';

export class UpdateListContractDto extends PartialType(CreateListContractDto) {}
