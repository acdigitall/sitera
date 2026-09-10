import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalDocumentEntity } from './legal-document.entity';
import { LegalService } from './legal.service';
import { LegalController } from './legal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LegalDocumentEntity])],
  controllers: [LegalController],
  providers: [LegalService],
  exports: [LegalService],
})
export class LegalModule {}
