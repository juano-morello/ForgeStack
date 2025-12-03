export interface UsageSummaryDto {
  billingPeriod: {
    start: string;
    end: string;
  };
  plan: string;
  usage: {
    apiCalls: {
      used: number;
      limit: number | null;
      percentUsed: number;
      overage: number;
    };
    storage: {
      usedBytes: number;
      limitBytes: number | null;
      percentUsed: number;
      usedFormatted: string;
      limitFormatted: string | null;
    };
    seats: {
      active: number;
      limit: number | null;
      percentUsed: number;
    };
  };
}

