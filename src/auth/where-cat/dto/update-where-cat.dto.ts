import { PartialType } from '@nestjs/mapped-types';
import { CreateWhereCatDto } from './create-where-cat.dto';

export class UpdateWhereCatDto extends PartialType(CreateWhereCatDto) {}
