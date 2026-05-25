export interface LogEntry {
  timestamp: Date;
  level: string;
  context: string;
  message: string;
  pid?: number;
}

export interface LogsResponse {
  data: LogEntry[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
