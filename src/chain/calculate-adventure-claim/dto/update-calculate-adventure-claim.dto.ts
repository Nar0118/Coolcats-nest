import { PartialType } from '@nestjs/mapped-types';
import { CreateCalculateAdventureClaimDto } from './create-calculate-adventure-claim.dto';

export class UpdateCalculateAdventureClaimDto extends PartialType(
  CreateCalculateAdventureClaimDto,
) {}
