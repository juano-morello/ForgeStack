export interface UsageLimitDto {
  id: string;
  metricType: string;
  limitValue: number;
  isHardLimit: boolean;
}

export interface UsageLimitsDto {
  limits: UsageLimitDto[];
}

