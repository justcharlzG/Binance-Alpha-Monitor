import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Search, ArrowUp, ArrowDown, TrendingUp, BarChart2, Clock, Info, Eye, ChevronDown } from 'lucide-react';
import { AlphaToken, TokenHistoryMap, SortField, SortDirection, HistoryPoint } from './types';
import { fetchAlphaTokens } from './services/api';
import Sparkline from './components/Sparkline';
import TokenDetailModal from './components/TokenDetailModal';

// 可用列的配置 (用于自定义表头)
const AVAILABLE_COLUMNS = [
  { id: 'price', label: 'Price (价格)' },
  { id: 'priceTrend', label: 'Price Trend (价格趋势)' },
  { id: 'holders', label: 'Holders (持有人)' },
  { id: 'holdersTrend', label: 'Holders Trend (持有人趋势)' },
  { id: 'change24h', label: '24h Change (24h涨跌)' },
  { id: 'marketCap', label: 'Market Cap (市值)' },
  { id: 'volume24h', label: '24h Volume (24h交易量)' },
  { id: 'liquidity', label: 'Liquidity (流动性)' },
  { id: 'listingTime', label: 'Listing Time (上线时间)' },
];

export default function App() {
  // --- 状态定义 ---
  const [tokens, setTokens] = useState<AlphaToken[]>([]); // 当前代币列表
  const [history, setHistory] = useState<TokenHistoryMap>({}); // 历史数据 (用于图表)
  const [loading, setLoading] = useState<boolean>(true); // 加载状态
  const [error, setError] = useState<string | null>(null); // 错误信息
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date()); // 最后更新时间
  const [selectedToken, setSelectedToken] = useState<AlphaToken | null>(null); // 当前选中的代币(用于模态框)
  const [searchTerm, setSearchTerm] = useState<string>(''); // 搜索关键词
  
  // --- 设置相关状态 ---
  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(5 * 60 * 1000); // 默认刷新间隔 5分钟
  // 默认显示的列
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(['price', 'priceTrend', 'holders', 'holdersTrend', 'change24h', 'marketCap']));
  const [showColumnSelector, setShowColumnSelector] = useState(false); // 是否显示列选择器
  const [showIntervalSelector, setShowIntervalSelector] = useState(false); // 是否显示刷新频率选择器

  // --- 排序状态 ---
  const [sortField, setSortField] = useState<SortField>('marketCap'); // 默认按市值排序
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // 默认降序

  // --- 数据加载核心逻辑 ---
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const newTokens = await fetchAlphaTokens();
      const now = Date.now();
      const retentionCutoff = now - (48 * 60 * 60 * 1000); // 48小时前的时间戳
      
      // 过滤掉已经在 CEX 上线的代币 ("listingCex": true 表示不在 Alpha 观察池了)
      const activeTokens = newTokens.filter(t => !t.listingCex);
      
      setTokens(activeTokens);
      setLastUpdated(new Date());

      // 更新历史数据状态
      setHistory(prevHistory => {
        const nextHistory = { ...prevHistory };
        
        activeTokens.forEach(token => {
          // 创建当前时间的数据点
          const point: HistoryPoint = {
            timestamp: now,
            price: token.priceNum,
            holders: token.holdersNum
          };

          const existing = nextHistory[token.tokenId] || [];
          // 数据保留策略：只保留最近 48 小时的数据
          const retainedHistory = existing.filter(h => h.timestamp > retentionCutoff);
          
          nextHistory[token.tokenId] = [...retainedHistory, point];
        });
        return nextHistory;
      });

    } catch (err: any) {
      console.error("Failed to fetch tokens", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- 副作用 (Effect) ---
  
  // 组件挂载时首次加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 设置定时器，按选定的时间间隔刷新数据
  useEffect(() => {
    const intervalId = setInterval(() => loadData(), refreshIntervalMs);
    return () => clearInterval(intervalId);
  }, [loadData, refreshIntervalMs]);

  // --- 交互处理函数 ---

  // 处理排序点击
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 如果点击相同字段，切换升/降序
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 点击新字段，默认降序 (通常数值越大越好)
      setSortField(field);
      setSortDirection('desc'); 
    }
  };

  // 切换列的显示/隐藏
  const toggleColumn = (columnId: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  // --- 数据处理 (Filtering & Sorting) ---
  const filteredAndSortedTokens = useMemo(() => {
    let result = [...tokens];
    
    // 搜索过滤
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(lower) || t.symbol.toLowerCase().includes(lower));
    }

    // 排序逻辑
    result.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch(sortField) {
        case 'name': valA = a.name; valB = b.name; break;
        case 'price': valA = a.priceNum; valB = b.priceNum; break;
        case 'holders': valA = a.holdersNum; valB = b.holdersNum; break;
        case 'change24h': valA = a.change24hNum; valB = b.change24hNum; break;
        case 'marketCap': valA = a.marketCapNum; valB = b.marketCapNum; break;
        case 'volume24h': valA = a.volume24hNum; valB = b.volume24hNum; break;
        case 'listingTime': valA = a.listingTime; valB = b.listingTime; break;
        case 'liquidity': valA = parseFloat(a.liquidity); valB = parseFloat(b.liquidity); break;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [tokens, searchTerm, sortField, sortDirection]);

  // --- 辅助渲染函数 ---
  
  // 渲染排序箭头
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <span className="w-4" />;
    return sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  // 获取特定代币的特定历史数据 (价格/持有人) 供 Sparkline 使用
  const getHistoryForToken = (tokenId: string, key: 'price' | 'holders') => {
    const tokenHistory = history[tokenId] || [];
    return tokenHistory.map(h => ({ value: key === 'price' ? h.price : h.holders }));
  };

  // 格式化刷新间隔显示文本
  const formatInterval = (ms: number) => {
    const minutes = ms / 60000;
    return `${minutes} min`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans pb-10">
      
      {/* 顶部导航栏 */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
              <TrendingUp className="text-yellow-500" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">Binance Alpha <span className="text-yellow-500">Monitor</span></h1>
            <h1 className="text-xl font-bold tracking-tight text-white sm:hidden">Alpha<span className="text-yellow-500">Mon</span></h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 text-sm text-gray-400">
             {/* 最后更新时间 */}
             <div className="hidden lg:flex items-center gap-1">
               <Clock size={14} />
               <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
             </div>

             {/* 刷新频率选择器 */}
             <div className="relative">
               <button 
                 onClick={() => setShowIntervalSelector(!showIntervalSelector)}
                 className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-md border border-gray-700 transition-all text-xs sm:text-sm"
               >
                 <span>Freq: {formatInterval(refreshIntervalMs)}</span>
                 <ChevronDown size={12} />
               </button>
               {showIntervalSelector && (
                 <div className="absolute right-0 mt-2 w-32 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                   {[1, 5, 10, 30].map(mins => (
                     <button
                       key={mins}
                       onClick={() => {
                         setRefreshIntervalMs(mins * 60 * 1000);
                         setShowIntervalSelector(false);
                       }}
                       className={`w-full text-left px-4 py-2 hover:bg-gray-800 text-sm ${refreshIntervalMs === mins * 60000 ? 'text-yellow-500 font-bold' : 'text-gray-300'}`}
                     >
                       {mins} min
                     </button>
                   ))}
                 </div>
               )}
             </div>

             {/* 手动刷新按钮 */}
             <button 
                onClick={() => loadData()}
                disabled={loading}
                className="flex items-center gap-2 bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-500 px-3 py-1.5 rounded-md border border-yellow-600/30 transition-all active:scale-95 disabled:opacity-50"
             >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 控制栏 (搜索、显示设置) */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* 搜索框 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search tokens... (搜索代币)" 
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none transition-all placeholder-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
             {/* 表头列显示切换 */}
             <div className="relative z-20">
                <button 
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="h-full px-4 bg-gray-900 border border-gray-800 rounded-lg flex items-center gap-2 text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
                >
                  <Eye size={18} />
                  <span className="hidden sm:inline">View (视图)</span>
                </button>
                {showColumnSelector && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-2 grid gap-1">
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Toggle Columns</div>
                    {AVAILABLE_COLUMNS.map(col => (
                      <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-800 rounded cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={visibleColumns.has(col.id)}
                          onChange={() => toggleColumn(col.id)}
                          className="rounded border-gray-700 bg-gray-800 text-yellow-500 focus:ring-yellow-500/50"
                        />
                        <span className="text-sm text-gray-300">{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
             </div>

             {/* 代币计数统计 */}
             <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-3 min-w-[120px]">
               <div className="bg-blue-500/10 p-2 rounded text-blue-500"><BarChart2 size={18} /></div>
               <div>
                 <div className="text-xs text-gray-500">Tokens</div>
                 <div className="font-bold text-white">{filteredAndSortedTokens.length}</div>
               </div>
             </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded-lg mb-6 flex items-center gap-2">
            <Info size={18} />
            {error}. Ensure your browser allows CORS or use a proxy for this API.
          </div>
        )}

        {/* 主数据表格 */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-800/50 text-gray-400 font-medium border-b border-gray-700">
                <tr>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-800 transition-colors sticky left-0 bg-gray-900 z-10"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">Token {renderSortIcon('name')}</div>
                  </th>
                  
                  {visibleColumns.has('price') && (
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-800 transition-colors text-right" onClick={() => handleSort('price')}>
                      <div className="flex items-center gap-1 justify-end">Price {renderSortIcon('price')}</div>
                    </th>
                  )}
                  {visibleColumns.has('priceTrend') && <th className="px-6 py-4 text-center">Price Trend (5m)</th>}
                  
                  {visibleColumns.has('holders') && (
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-800 transition-colors text-right" onClick={() => handleSort('holders')}>
                       <div className="flex items-center gap-1 justify-end">Holders {renderSortIcon('holders')}</div>
                    </th>
                  )}
                  {visibleColumns.has('holdersTrend') && <th className="px-6 py-4 text-center">Holders Trend (5m)</th>}
                  
                  {visibleColumns.has('change24h') && (
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-800 transition-colors text-right" onClick={() => handleSort('change24h')}>
                       <div className="flex items-center gap-1 justify-end">24h Change {renderSortIcon('change24h')}</div>
                    </th>
                  )}
                  
                  {visibleColumns.has('marketCap') && (
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-800 transition-colors text-right" onClick={() => handleSort('marketCap')}>
                       <div className="flex items-center gap-1 justify-end">Market Cap {renderSortIcon('marketCap')}</div>
                    </th>
                  )}

                  {visibleColumns.has('volume24h') && (
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-800 transition-colors text-right" onClick={() => handleSort('volume24h')}>
                       <div className="flex items-center gap-1 justify-end">Volume 24h {renderSortIcon('volume24h')}</div>
                    </th>
                  )}

                  {visibleColumns.has('liquidity') && (
                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-800 transition-colors text-right" onClick={() => handleSort('liquidity')}>
                       <div className="flex items-center gap-1 justify-end">Liquidity {renderSortIcon('liquidity')}</div>
                    </th>
                  )}

                  {visibleColumns.has('listingTime') && (
                     <th className="px-6 py-4 cursor-pointer hover:bg-gray-800 transition-colors text-right" onClick={() => handleSort('listingTime')}>
                        <div className="flex items-center gap-1 justify-end">Listed {renderSortIcon('listingTime')}</div>
                     </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredAndSortedTokens.length === 0 ? (
                   <tr>
                     <td colSpan={10} className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                       <Info size={32} />
                       {loading ? "Loading data from Binance... (正在加载)" : "No tokens found. (未找到代币)"}
                     </td>
                   </tr>
                ) : (
                  filteredAndSortedTokens.map((token) => (
                    <tr 
                      key={token.tokenId} 
                      className="group hover:bg-gray-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedToken(token)}
                    >
                      {/* 代币名称和图标列 (固定在左侧) */}
                      <td className="px-6 py-4 sticky left-0 bg-gray-900 group-hover:bg-gray-800/90 transition-colors border-r border-gray-800">
                        <div className="flex items-center gap-3">
                          <img src={token.iconUrl} alt="" className="w-8 h-8 rounded-full bg-gray-800 object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/32x32/1f2937/6b7280?text=?')} />
                          <div>
                            <div className="font-bold text-white group-hover:text-yellow-500 transition-colors flex items-center gap-1">
                                {token.symbol}
                                {token.hotTag && <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded border border-red-500/30">HOT</span>}
                            </div>
                            <div className="text-xs text-gray-500">{token.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* 动态渲染选中的列 */}
                      {visibleColumns.has('price') && (
                        <td className="px-6 py-4 text-right font-mono text-gray-200">
                          ${token.priceNum < 1 ? token.priceNum.toFixed(6) : token.priceNum.toFixed(2)}
                        </td>
                      )}
                      
                      {visibleColumns.has('priceTrend') && (
                        <td className="px-6 py-2">
                          <div className="flex justify-center">
                            <Sparkline data={getHistoryForToken(token.tokenId, 'price')} color={token.change24hNum >= 0 ? '#10b981' : '#ef4444'} />
                          </div>
                        </td>
                      )}
                      
                      {visibleColumns.has('holders') && (
                        <td className="px-6 py-4 text-right font-mono text-gray-200">
                          {token.holdersNum.toLocaleString()}
                        </td>
                      )}
                      
                      {visibleColumns.has('holdersTrend') && (
                        <td className="px-6 py-2">
                          <div className="flex justify-center">
                            <Sparkline data={getHistoryForToken(token.tokenId, 'holders')} color="#3b82f6" />
                          </div>
                        </td>
                      )}
                      
                      {visibleColumns.has('change24h') && (
                        <td className={`px-6 py-4 text-right font-medium ${token.change24hNum >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {token.change24hNum > 0 ? '+' : ''}{token.percentChange24h}%
                        </td>
                      )}
                      
                      {visibleColumns.has('marketCap') && (
                        <td className="px-6 py-4 text-right text-gray-400 font-mono">
                           ${(token.marketCapNum / 1000000).toFixed(2)}M
                        </td>
                      )}

                      {visibleColumns.has('volume24h') && (
                        <td className="px-6 py-4 text-right text-gray-400 font-mono">
                           ${(token.volume24hNum / 1000000).toFixed(2)}M
                        </td>
                      )}

                      {visibleColumns.has('liquidity') && (
                        <td className="px-6 py-4 text-right text-gray-400 font-mono">
                           ${parseFloat(token.liquidity).toLocaleString()}
                        </td>
                      )}

                      {visibleColumns.has('listingTime') && (
                        <td className="px-6 py-4 text-right text-gray-400 text-xs">
                           {new Date(token.listingTime).toLocaleDateString()}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 页脚说明 */}
        <div className="mt-4 text-center text-xs text-gray-600">
           Data sourced from Binance Web3 Wallet (Alpha). Sparklines represent real-time accumulation ({formatInterval(refreshIntervalMs)} intervals).
           Tokens listed on CEX are hidden. History is retained for 48 hours.
           <br/>
           数据来源：Binance Web3 钱包 (Alpha)。折线图代表实时累积趋势 ({formatInterval(refreshIntervalMs)} 间隔)。已上线 CEX 的代币会被隐藏。历史数据保留48小时。
        </div>

      </main>

      {/* 详情弹窗 */}
      {selectedToken && (
        <TokenDetailModal 
          token={selectedToken} 
          history={history[selectedToken.tokenId] || []} 
          onClose={() => setSelectedToken(null)} 
        />
      )}

      {/* 点击遮罩层关闭下拉菜单 */}
      {(showColumnSelector || showIntervalSelector) && (
        <div className="fixed inset-0 z-10" onClick={() => {setShowColumnSelector(false); setShowIntervalSelector(false)}} />
      )}

    </div>
  );
}