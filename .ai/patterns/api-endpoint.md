# Pattern: Creating API Endpoints

> Step-by-step guide for creating new NestJS API endpoints in ForgeStack.

## Overview

ForgeStack uses a layered architecture:
- **Controller** → HTTP handling, validation, Swagger docs
- **Service** → Business logic, orchestration
- **Repository** → Database access with RLS

## File Structure

```
apps/api/src/{module}/
├── {module}.controller.ts
├── {module}.controller.spec.ts
├── {module}.service.ts
├── {module}.service.spec.ts
├── {module}.repository.ts
├── {module}.repository.spec.ts
├── {module}.module.ts
└── dto/
    ├── index.ts
    ├── create-{module}.dto.ts
    ├── update-{module}.dto.ts
    └── {module}-response.dto.ts
```

## Step 1: Create DTOs

```typescript
// dto/create-task.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title', example: 'Review PR' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Task description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ['todo', 'in_progress', 'done'], default: 'todo' })
  @IsEnum(['todo', 'in_progress', 'done'])
  @IsOptional()
  status?: 'todo' | 'in_progress' | 'done';
}

// dto/task-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;
}
```

## Step 2: Create Repository

```typescript
// tasks.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@forgestack/db';
import { withTenantContext, type TenantContext, type DbInstance } from '@forgestack/db';
import { tasks } from '@forgestack/db';
import { desc, eq } from 'drizzle-orm';
import type { CreateTaskDto } from './dto';

@Injectable()
export class TasksRepository {
  constructor(@InjectDatabase() private readonly db: DbInstance) {}

  async findAll(ctx: TenantContext) {
    return withTenantContext(ctx, async (tx) => {
      return tx.select().from(tasks).orderBy(desc(tasks.createdAt));
    });
  }

  async findById(ctx: TenantContext, id: string) {
    return withTenantContext(ctx, async (tx) => {
      const [task] = await tx.select().from(tasks).where(eq(tasks.id, id));
      return task ?? null;
    });
  }

  async create(ctx: TenantContext, dto: CreateTaskDto) {
    return withTenantContext(ctx, async (tx) => {
      const [task] = await tx.insert(tasks).values({
        ...dto,
        orgId: ctx.orgId,
      }).returning();
      return task;
    });
  }

  async delete(ctx: TenantContext, id: string) {
    return withTenantContext(ctx, async (tx) => {
      const [deleted] = await tx.delete(tasks).where(eq(tasks.id, id)).returning();
      return deleted ?? null;
    });
  }
}
```

## Step 3: Create Service

```typescript
// tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import type { TenantContext } from '@forgestack/db';
import { TasksRepository } from './tasks.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { QueueService } from '../queue/queue.service';
import { QUEUE_NAMES } from '@forgestack/shared';
import type { CreateTaskDto } from './dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly queueService: QueueService,
  ) {}

  async findAll(ctx: TenantContext) {
    return this.tasksRepository.findAll(ctx);
  }

  async findById(ctx: TenantContext, id: string) {
    const task = await this.tasksRepository.findById(ctx, id);
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  async create(ctx: TenantContext, dto: CreateTaskDto) {
    const task = await this.tasksRepository.create(ctx, dto);

    // Audit log
    await this.auditLogsService.log(
      { orgId: ctx.orgId, actorId: ctx.userId, actorType: 'user' },
      {
        action: 'task.created',
        resourceType: 'task',
        resourceId: task.id,
        resourceName: task.title,
      }
    );

    // Activity feed (async via worker)
    await this.queueService.add(QUEUE_NAMES.ACTIVITIES, {
      type: 'task.created',
      orgId: ctx.orgId,
      userId: ctx.userId,
      taskId: task.id,
    });

    return task;
  }
}
```

## Step 4: Create Controller

```typescript
// tasks.controller.ts
import { Controller, Get, Post, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { RequirePermission } from '../core/decorators/require-permission.decorator';
import type { TenantContext } from '@forgestack/db';
import { TasksService } from './tasks.service';
import { CreateTaskDto, TaskResponseDto } from './dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @RequirePermission('task', 'read')
  @ApiOperation({ summary: 'List all tasks' })
  @ApiResponse({ status: 200, type: [TaskResponseDto] })
  async findAll(@CurrentTenant() ctx: TenantContext): Promise<TaskResponseDto[]> {
    return this.tasksService.findAll(ctx);
  }

  @Get(':id')
  @RequirePermission('task', 'read')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async findById(
    @CurrentTenant() ctx: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.findById(ctx, id);
  }

  @Post()
  @RequirePermission('task', 'create')
  @ApiOperation({ summary: 'Create a task' })
  @ApiResponse({ status: 201, type: TaskResponseDto })
  async create(
    @CurrentTenant() ctx: TenantContext,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(ctx, dto);
  }
}
```

## Step 5: Create Module

```typescript
// tasks.module.ts
import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';

@Module({
  controllers: [TasksController],
  providers: [TasksService, TasksRepository],
  exports: [TasksService],
})
export class TasksModule {}
```

## Step 6: Register in App Module

```typescript
// app.module.ts
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    // ... existing modules
    TasksModule,
  ],
})
export class AppModule {}
```

## Required Tests

See `.ai/patterns/testing-backend.md` for test patterns (to be created).

