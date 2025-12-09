import { ApiResponse, AlphaTokenRaw, AlphaToken } from '../types';

// Binance Alpha 代币列表 API 地址
const API_URL = 'https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list';

/**
 * 解析原始 API 数据为应用内部使用的格式
 * 将字符串类型的数值转换为 Number 类型，以便进行排序和图表绘制
 */
export const parseToken = (raw: AlphaTokenRaw): AlphaToken => {
  return {
    ...raw,
    priceNum: parseFloat(raw.price) || 0,        // 价格
    holdersNum: parseInt(raw.holders, 10) || 0,  // 持有人数
    marketCapNum: parseFloat(raw.marketCap) || 0,// 市值
    volume24hNum: parseFloat(raw.volume24h) || 0,// 24小时成交量
    change24hNum: parseFloat(raw.percentChange24h) || 0 // 24小时涨跌幅
  };
};

/**
 * 获取 Alpha 代币列表
 * 直接请求 Binance 接口并解析数据
 */
export const fetchAlphaTokens = async (): Promise<AlphaToken[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const json: ApiResponse = await response.json();
    if (json.data) {
      // 映射原始数据到强类型对象
      return json.data.map(parseToken);
    }
    throw new Error('No data in response');
  } catch (error) {
    console.error('Error fetching Alpha tokens:', error);
    throw error;
  }
};