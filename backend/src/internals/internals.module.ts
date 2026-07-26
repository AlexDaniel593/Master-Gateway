import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InternalsController } from './internals.controller';
import { InternalsService } from './internals.service';
import { Usuario } from '../users/entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  controllers: [InternalsController],
  providers: [InternalsService],
})
export class InternalsModule {}
