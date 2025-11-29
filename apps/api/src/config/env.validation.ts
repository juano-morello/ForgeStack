/**
 * Environment variable validation using class-validator
 */

import { plainToInstance, Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 4000;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  API_PORT: number = 4000;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:3000';
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error) => {
      const constraints = error.constraints
        ? Object.values(error.constraints).join(', ')
        : 'Unknown error';
      return `${error.property}: ${constraints}`;
    });
    throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
  }

  return validatedConfig;
}

