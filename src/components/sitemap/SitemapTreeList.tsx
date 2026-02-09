/**
 * Sitemapツリーリストコンポーネント
 * 展開可能なインデント付きツリー表示
 */

import { useState, useMemo, useCallback } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  CheckSquare,
  Square,
  Minus
} from 'lucide-react'
import type {
  TreeNode,
  FlatTreeItem,
} from '../../utils/sitemapTree'
import {
  buildUrlTree,
  flattenTree,
} from '../../utils/sitemapTree'
import type { SitemapUrl } from '../../utils/pagePriority'
import { TIER_CONFIG } from '../../utils/pagePriority'

interface SitemapTreeListProps {
  urls: SitemapUrl[]
  analysisScores?: Record<string, number>
  selectedUrls: Set<string>
  onSelectionChange: (urls: Set<string>) => void
  maxSelection?: number
}

export function SitemapTreeList({
  urls,
  analysisScores,
  selectedUrls,
  onSelectionChange,
  maxSelection = 10,
}: SitemapTreeListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root']))
  const [searchTerm, setSearchTerm] = useState('')

  // ツリー構築
  const { root, stats } = useMemo(
    () => buildUrlTree(urls, analysisScores),
    [urls, analysisScores]
  )

  // フラット化（展開状態に基づく）
  const flatItems = useMemo(
    () => flattenTree(root, expandedIds),
    [root, expandedIds]
  )

  // 検索フィルタ
  const filteredItems = useMemo(() => {
    if (!searchTerm) return flatItems
    const term = searchTerm.toLowerCase()
    return flatItems.filter(
      item =>
        item.name.toLowerCase().includes(term) ||
        item.fullUrl.toLowerCase().includes(term)
    )
  }, [flatItems, searchTerm])

  // 展開/折りたたみ
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // すべて展開/折りたたみ
  const expandAll = useCallback(() => {
    const allIds = new Set<string>()
    function collectIds(node: TreeNode) {
      allIds.add(node.id)
      node.children.forEach(collectIds)
    }
    collectIds(root)
    setExpandedIds(allIds)
  }, [root])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set(['root']))
  }, [])

  // 選択処理
  const toggleSelection = useCallback(
    (url: string) => {
      const next = new Set(selectedUrls)
      if (next.has(url)) {
        next.delete(url)
      } else if (next.size < maxSelection) {
        next.add(url)
      }
      onSelectionChange(next)
    },
    [selectedUrls, maxSelection, onSelectionChange]
  )

  // 子ノード全選択
  const selectChildren = useCallback(
    (node: TreeNode) => {
      const next = new Set(selectedUrls)
      function collect(n: TreeNode) {
        if (n.isLeaf && next.size < maxSelection) {
          next.add(n.fullUrl)
        }
        n.children.forEach(collect)
      }
      collect(node)
      onSelectionChange(next)
    },
    [selectedUrls, maxSelection, onSelectionChange]
  )

  // 選択状態の判定
  const getSelectionState = useCallback(
    (item: FlatTreeItem): 'none' | 'partial' | 'full' => {
      if (item.isLeaf) {
        return selectedUrls.has(item.fullUrl) ? 'full' : 'none'
      }
      // フォルダの場合は子ノードの選択状態をチェック
      // 簡易版: この実装では省略
      return 'none'
    },
    [selectedUrls]
  )

  return (
    <div className="border rounded-lg bg-white">
      {/* ヘッダー */}
      <div className="border-b p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="URLを検索..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-md w-64"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={expandAll}
            className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
          >
            すべて展開
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
          >
            すべて折りたたみ
          </button>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">
            {selectedUrls.size}/{maxSelection} 選択中
          </span>
        </div>
      </div>

      {/* 統計バー */}
      <div className="border-b px-3 py-2 bg-gray-50 flex items-center gap-4 text-xs text-gray-600">
        <span>総URL: {stats.leafCount}</span>
        <span>最大深度: {stats.maxDepth}</span>
        {stats.averageScore !== undefined && (
          <span>平均スコア: {stats.averageScore}</span>
        )}
      </div>

      {/* ツリーリスト */}
      <div className="max-h-96 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {searchTerm ? '検索結果がありません' : 'URLがありません'}
          </div>
        ) : (
          <ul className="divide-y">
            {filteredItems.map(item => (
              <TreeListItem
                key={item.id}
                item={item}
                selectionState={getSelectionState(item)}
                onToggleExpand={() => toggleExpand(item.id)}
                onToggleSelection={() => toggleSelection(item.fullUrl)}
                onSelectChildren={() => {
                  const node = findNodeById(root, item.id)
                  if (node) selectChildren(node)
                }}
                isMaxSelected={selectedUrls.size >= maxSelection}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ノードをIDで検索
function findNodeById(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node
  for (const child of node.children) {
    const found = findNodeById(child, id)
    if (found) return found
  }
  return null
}

interface TreeListItemProps {
  item: FlatTreeItem
  selectionState: 'none' | 'partial' | 'full'
  onToggleExpand: () => void
  onToggleSelection: () => void
  onSelectChildren: () => void
  isMaxSelected: boolean
}

function TreeListItem({
  item,
  selectionState,
  onToggleExpand,
  onToggleSelection,
  onSelectChildren,
  isMaxSelected,
}: TreeListItemProps) {
  const tierConfig = item.priority ? TIER_CONFIG[item.priority.tier] : null

  return (
    <li
      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50"
      style={{ paddingLeft: `${item.depth * 20 + 12}px` }}
    >
      {/* 展開/折りたたみボタン */}
      {item.hasChildren ? (
        <button
          onClick={onToggleExpand}
          className="p-0.5 hover:bg-gray-200 rounded"
        >
          {item.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>
      ) : (
        <span className="w-5" />
      )}

      {/* チェックボックス（リーフのみ） */}
      {item.isLeaf ? (
        <button
          onClick={onToggleSelection}
          disabled={selectionState === 'none' && isMaxSelected}
          className={`p-0.5 rounded ${
            selectionState === 'none' && isMaxSelected
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-gray-200'
          }`}
        >
          {selectionState === 'full' ? (
            <CheckSquare className="w-4 h-4 text-blue-600" />
          ) : selectionState === 'partial' ? (
            <Minus className="w-4 h-4 text-blue-400" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
        </button>
      ) : (
        <button
          onClick={onSelectChildren}
          className="p-0.5 hover:bg-gray-200 rounded"
          title="子ページをすべて選択"
        >
          <Square className="w-4 h-4 text-gray-300" />
        </button>
      )}

      {/* アイコン */}
      {item.hasChildren ? (
        <Folder className="w-4 h-4 text-yellow-500" />
      ) : (
        <FileText className="w-4 h-4 text-gray-400" />
      )}

      {/* 名前 */}
      <span className="flex-1 text-sm truncate" title={item.fullUrl}>
        {item.name}
        {item.childCount > 1 && !item.isLeaf && (
          <span className="ml-1 text-xs text-gray-400">({item.childCount})</span>
        )}
      </span>

      {/* 優先度バッジ */}
      {tierConfig && (
        <span
          className="px-1.5 py-0.5 text-xs rounded"
          style={{
            backgroundColor: tierConfig.bgColor,
            color: tierConfig.color,
          }}
        >
          {tierConfig.label}
        </span>
      )}

      {/* スコア */}
      {item.analysisScore !== undefined && (
        <span
          className={`text-sm font-medium ${
            item.analysisScore >= 70
              ? 'text-green-600'
              : item.analysisScore >= 50
              ? 'text-yellow-600'
              : 'text-red-600'
          }`}
        >
          {item.analysisScore}
        </span>
      )}

      {/* 分析済みバッジ */}
      {item.isAnalyzed && (
        <span className="text-xs text-gray-400">分析済</span>
      )}
    </li>
  )
}

export default SitemapTreeList
