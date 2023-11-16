import { PartialType } from '@nestjs/mapped-types';
import { CreateCalculateMilkClaimDto } from './create-calculate-milk-claim.dto';

export class UpdateCalculateMilkClaimDto extends PartialType(
  CreateCalculateMilkClaimDto,
) {}
