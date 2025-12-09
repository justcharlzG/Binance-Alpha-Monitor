import React from 'react';
import { X, ExternalLink, Copy, Users, DollarSign, Activity, Layers } from 'lucide-react';
import { AlphaToken, HistoryPoint } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface TokenDetailModalProps {
  token: AlphaToken | null;
  history: HistoryPoint[];
  onClose: () => void;
}

/**
 * 代币详情模态框
 * 展示代币的详细统计信息和更大尺寸的历史趋势图表
 */
const TokenDetailModal: React.FC<TokenDetailModalProps> = ({ token, history, onClose }) => {
  if (!token) return null;

  // 格式化货币显示
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 6 }).format(val);

  // 格式化大数值 (e.g., 1.5M, 20K)
  const formatNumber = (val: number) => 
    new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* 头部区域：图标、名称、合约地址 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50 sticky top-0 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <img src={token.iconUrl} alt={token.name} className="w-12 h-12 rounded-full border border-gray-700" />
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {token.name} <span className="text-gray-500 text-lg font-normal">/ {token.symbol}</span>
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <img src={token.chainIconUrl} className="w-4 h-4" alt={token.chainName} />
                <span>{token.chainName}</span>
                <span className="text-gray-600">•</span>
                <span className="font-mono text-xs bg-gray-800 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer hover:bg-gray-700" title="Copy Address">
                  {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                  <Copy size={10} />
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-8">
          
          {/* 关键指标卡片网格 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-400 text-sm mb-1 flex items-center gap-2"><DollarSign size={14} /> 价格 (Price)</div>
              <div className="text-2xl font-mono text-white">{formatCurrency(token.priceNum)}</div>
              <div className={`text-sm ${token.change24hNum >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {token.change24hNum > 0 ? '+' : ''}{token.percentChange24h}% (24h)
              </div>
            </div>
            <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-400 text-sm mb-1 flex items-center gap-2"><Users size={14} /> 持有人数 (Holders)</div>
              <div className="text-2xl font-mono text-white">{token.holdersNum.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">链上持有人</div>
            </div>
            <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-400 text-sm mb-1 flex items-center gap-2"><Layers size={14} /> 市值 (Market Cap)</div>
              <div className="text-2xl font-mono text-white">${formatNumber(token.marketCapNum)}</div>
              <div className="text-xs text-gray-500 mt-1">完全稀释估值 (FDV): ${formatNumber(parseFloat(token.fdv))}</div>
            </div>
            <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
              <div className="text-gray-400 text-sm mb-1 flex items-center gap-2"><Activity size={14} /> 24h 成交量</div>
              <div className="text-2xl font-mono text-white">${formatNumber(token.volume24hNum)}</div>
              <div className="text-xs text-gray-500 mt-1">{token.count24h} 笔交易</div>
            </div>
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 价格趋势图 */}
            <div className="bg-gray-800/20 p-4 rounded-xl border border-gray-800">
              <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">价格趋势 (Price Trend)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(val) => `$${val < 1 ? val.toFixed(4) : val.toFixed(2)}`}
                      width={60}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                      labelFormatter={(ts) => new Date(ts).toLocaleString()}
                      formatter={(val: number) => [`$${val}`, '价格']}
                    />
                    <Line type="monotone" dataKey="price" stroke="#fbbf24" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#fbbf24' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 持有者增长图 */}
            <div className="bg-gray-800/20 p-4 rounded-xl border border-gray-800">
              <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">持有人数变化 (Holders Growth)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="#6b7280"
                      fontSize={12}
                      width={50}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                      labelFormatter={(ts) => new Date(ts).toLocaleString()}
                      formatter={(val: number) => [val, '持有人数']}
                    />
                    <Line type="monotone" dataKey="holders" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* 底部信息与链接 */}
          <div className="flex justify-between items-center text-sm text-gray-500 pt-4 border-t border-gray-800">
             <div>上线时间: {new Date(token.listingTime).toLocaleString()}</div>
             <a 
               href={`https://solscan.io/token/${token.contractAddress}`} 
               target="_blank" 
               rel="noreferrer" 
               className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
             >
               查看区块链浏览器 (Explorer) <ExternalLink size={12} />
             </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TokenDetailModal;