import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { InternalsService } from './internals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

class ValidateTokenDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  rolId: string;
}

@Controller('api/internals')
export class InternalsController {
  constructor(private internalsService: InternalsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  validate(@Body() dto: ValidateTokenDto) {
    return this.internalsService.validateToken(dto.userId, dto.rolId);
  }
}
