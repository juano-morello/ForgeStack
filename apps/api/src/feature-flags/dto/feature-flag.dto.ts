/**
 * Feature Flag DTOs
 */

export class FeatureFlagDto {
  id!: string;
  key!: string;
  name!: string;
  description!: string | null;
  type!: string;
  defaultValue!: boolean;
  plans!: string[] | null;
  percentage!: number | null;
  enabled!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class FeatureCheckDto {
  key!: string;
  enabled!: boolean;
}

export class FeatureStatusDto {
  key!: string;
  name!: string;
  description!: string | null;
  enabled!: boolean;
  requiredPlan?: string;
}

