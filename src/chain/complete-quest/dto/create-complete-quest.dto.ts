import { IsString } from 'class-validator';

export class CreateCompleteQuestDto {
  @IsString()
  questId: string;

  @IsString()
  petTokenId: string;

  @IsString()
  itemIds: string;
}
