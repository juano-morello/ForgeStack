export interface UsageHistoryDto {
  history: Array<{
    period: string;
    apiCalls: number;
    storageBytes: number;
    activeSeats: number;
  }>;
}

