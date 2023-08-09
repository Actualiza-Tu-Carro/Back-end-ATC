import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DireetionsService } from './directions.service';
import { CreateDireetionDto } from './dto/create-direetion.dto';
import { UpdateDireetionDto } from './dto/update-direetion.dto';

@Controller('direetions')
export class DireetionsController {
  constructor(private readonly direetionsService: DireetionsService) {}

  @Post()
  create(@Body() createDireetionDto: CreateDireetionDto) {
    return this.direetionsService.create(createDireetionDto);
  }

  @Get()
  findAll() {
    return this.direetionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.direetionsService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDireetionDto: UpdateDireetionDto) {
    return await this.direetionsService.update(id, updateDireetionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.direetionsService.remove(id);
  }
}
