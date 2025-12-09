// 原始 API 返回的代币数据结构
export interface AlphaTokenRaw {
  tokenId: string;
  chainId: string;
  chainIconUrl: string;
  chainName: string;
  contractAddress: string;
  name: string;
  symbol: string;
  iconUrl: string;
  price: string;
  percentChange24h: string;
  volume24h: string;
  marketCap: string;
  fdv: string;
  liquidity: string;
  totalSupply: string;
  circulatingSupply: string;
  holders: string;
  decimals: number;
  listingTime: number;
  priceHigh24h: string;
  priceLow24h: string;
  count24h: string; // 交易次数
  listingCex: boolean; // 是否已上线 CEX (如果是 true，表示不在 Alpha 监控范畴)
  hotTag?: number;
}

// API 响应包体结构
export interface ApiResponse {
  code: string;
  message: string | null;
  data: AlphaTokenRaw[];
}

// 历史数据点 (用于绘制 Sparkline 折线图)
export interface HistoryPoint {
  timestamp: number;
  price: number;
  holders: number;
}

// 扩展后的代币对象，包含解析后的数值类型，便于排序和计算
export interface AlphaToken extends AlphaTokenRaw {
  priceNum: number;
  holdersNum: number;
  marketCapNum: number;
  volume24hNum: number;
  change24hNum: number;
}

// 历史数据映射表: TokenID -> 历史记录数组
export type TokenHistoryMap = Record<string, HistoryPoint[]>;

// 排序字段类型定义
export type SortField = 'name' | 'price' | 'holders' | 'change24h' | 'marketCap' | 'volume24h' | 'listingTime' | 'liquidity';
// 排序方向
export type SortDirection = 'asc' | 'desc';