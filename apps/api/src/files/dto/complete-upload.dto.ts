/**
 * DTOs for completing file uploads
 */

import { ApiProperty } from '@nestjs/swagger';

export class CompleteUploadResponseDto {
  @ApiProperty({ description: 'File ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ description: 'Presigned download URL', example: 'https://s3.amazonaws.com/bucket/file?signature=...' })
  url!: string;
}

