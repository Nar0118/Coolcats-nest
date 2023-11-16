import { Module } from '@nestjs/common';
import { QuestThemeService } from './quest-theme.service';
import { QuestThemeController } from './quest-theme.controller';

@Module({
  controllers: [QuestThemeController],
  providers: [QuestThemeService],
})
export class QuestThemeModule {}
