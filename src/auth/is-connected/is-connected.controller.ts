import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { IsConnectedService } from './is-connected.service';
import { CreateIsConnectedDto } from './dto/create-is-connected.dto';
import { UpdateIsConnectedDto } from './dto/update-is-connected.dto';
import { IRateLimitRule, Util } from '../../util';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('auth/is-connected')
export class IsConnectedController {
  constructor(private readonly isConnectedService: IsConnectedService) {}

  @Post()
  create(@Body() createIsConnectedDto: CreateIsConnectedDto) {
    return this.isConnectedService.create(createIsConnectedDto);
  }

  @Get()
  async findAll(@Req() req) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.IS_CONNECTED,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.isConnectedService.findAll(req);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.isConnectedService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIsConnectedDto: UpdateIsConnectedDto,
  ) {
    return this.isConnectedService.update(+id, updateIsConnectedDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.isConnectedService.remove(+id);
  }
}
