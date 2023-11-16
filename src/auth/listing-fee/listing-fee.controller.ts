import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ListingFeeService } from './listing-fee.service';
import { CreateListingFeeDto } from './dto/create-listing-fee.dto';
import { UpdateListingFeeDto } from './dto/update-listing-fee.dto';
import { IRateLimitRule, Util } from '../../util';
import { Request } from 'express';
import { ERateLimitPageKey } from '../../utility/enums';

@Controller('auth/listing-fee')
export class ListingFeeController {
  constructor(private readonly listingFeeService: ListingFeeService) {}

  @Post()
  create(@Body() createListingFeeDto: CreateListingFeeDto) {
    return this.listingFeeService.create(createListingFeeDto);
  }

  @Get()
  async findAll(@Query() query, @Req() req: Request) {
    const rateLimited: IRateLimitRule = await Util.rateLimitPage(
      ERateLimitPageKey.LISTING_FEE,
      (req as any).clientIp,
    );
    if (rateLimited) {
      throw new HttpException('rate limited', 429);
    } else {
      return await this.listingFeeService.findAll(query);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingFeeService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateListingFeeDto: UpdateListingFeeDto,
  ) {
    return this.listingFeeService.update(+id, updateListingFeeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.listingFeeService.remove(+id);
  }
}
