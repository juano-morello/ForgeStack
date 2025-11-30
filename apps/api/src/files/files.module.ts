/**
 * Files Module
 * Provides file upload and management functionality
 */

import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FilesRepository } from './files.repository';
import { StorageService } from './storage.service';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [ActivitiesModule],
  controllers: [FilesController],
  providers: [FilesRepository, FilesService, StorageService],
  exports: [FilesService, FilesRepository, StorageService],
})
export class FilesModule {}

