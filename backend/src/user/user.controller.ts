import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.userService.create(createUserDto, request.user);
  }

  @Get()
  findAll(@Request() request: AuthenticatedRequest) {
    return this.userService.findAll(request.user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.userService.findOne(id, request.user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.userService.update(id, updateUserDto, request.user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.userService.remove(id, request.user);
  }
}
