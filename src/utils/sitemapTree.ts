/**
 * Sitemapツリー構築ユーティリティ
 * URLリストを階層的なツリー構造に変換
 */

import type { PagePriorityScore, SitemapUrl } from './pagePriority'
import { calculatePagePriority } from './pagePriority'

export interface TreeNode {
  id: string
  name: string // パスセグメント名
  fullPath: string // フルパス
  fullUrl: string // 完全なURL
  depth: number
  children: TreeNode[]
  isLeaf: boolean
  urlCount: number // このノード配下のURL総数

  // 分析データ（あれば）
  priority?: PagePriorityScore
  analysisScore?: number
  isAnalyzed?: boolean
}

export interface TreeStats {
  totalNodes: number
  maxDepth: number
  leafCount: number
  averageScore?: number
  scoreDistribution: {
    range: string
    count: number
  }[]
}

/**
 * URLリストをツリー構造に変換
 */
export function buildUrlTree(
  urls: SitemapUrl[],
  analysisScores?: Record<string, number>
): { root: TreeNode; stats: TreeStats } {
  // ルートノード作成
  const rootUrl = urls[0] ? new URL(urls[0].loc).origin : 'https://example.com'
  const root: TreeNode = {
    id: 'root',
    name: new URL(rootUrl).hostname,
    fullPath: '/',
    fullUrl: rootUrl,
    depth: 0,
    children: [],
    isLeaf: false,
    urlCount: 0,
  }

  // 各URLをツリーに挿入
  for (const sitemapUrl of urls) {
    insertUrl(root, sitemapUrl, analysisScores)
  }

  // URL数を再帰的に計算
  calculateUrlCounts(root)

  // 統計計算
  const stats = calculateTreeStats(root, analysisScores)

  return { root, stats }
}

/**
 * URLをツリーに挿入
 */
function insertUrl(
  root: TreeNode,
  sitemapUrl: SitemapUrl,
  analysisScores?: Record<string, number>
): void {
  try {
    const parsed = new URL(sitemapUrl.loc)
    const pathSegments = parsed.pathname.split('/').filter(s => s.length > 0)

    let currentNode = root

    // パスセグメントごとにノードを作成/取得
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      const fullPath = '/' + pathSegments.slice(0, i + 1).join('/')
      const fullUrl = parsed.origin + fullPath

      let childNode = currentNode.children.find(c => c.name === segment)

      if (!childNode) {
        childNode = {
          id: `node-${fullPath.replace(/\//g, '-')}`,
          name: segment,
          fullPath,
          fullUrl,
          depth: i + 1,
          children: [],
          isLeaf: i === pathSegments.length - 1,
          urlCount: 0,
        }
        currentNode.children.push(childNode)
      }

      // 最後のセグメントの場合、分析データを付与
      if (i === pathSegments.length - 1) {
        childNode.isLeaf = true
        childNode.priority = calculatePagePriority(sitemapUrl)
        if (analysisScores && sitemapUrl.loc in analysisScores) {
          childNode.analysisScore = analysisScores[sitemapUrl.loc]
          childNode.isAnalyzed = true
        }
      }

      currentNode = childNode
    }

    // ルート直下の場合（パスが "/" のみ）
    if (pathSegments.length === 0) {
      root.priority = calculatePagePriority(sitemapUrl)
      root.isLeaf = true
      if (analysisScores && sitemapUrl.loc in analysisScores) {
        root.analysisScore = analysisScores[sitemapUrl.loc]
        root.isAnalyzed = true
      }
    }
  } catch (e) {
    console.error('URL挿入エラー:', sitemapUrl.loc, e)
  }
}

/**
 * URL数を再帰的に計算
 */
function calculateUrlCounts(node: TreeNode): number {
  if (node.children.length === 0) {
    node.urlCount = node.isLeaf ? 1 : 0
    return node.urlCount
  }

  let count = node.isLeaf ? 1 : 0
  for (const child of node.children) {
    count += calculateUrlCounts(child)
  }
  node.urlCount = count
  return count
}

/**
 * ツリー統計を計算
 */
function calculateTreeStats(
  root: TreeNode,
  _analysisScores?: Record<string, number>
): TreeStats {
  let totalNodes = 0
  let maxDepth = 0
  let leafCount = 0
  const scores: number[] = []

  function traverse(node: TreeNode) {
    totalNodes++
    if (node.depth > maxDepth) maxDepth = node.depth
    if (node.isLeaf) leafCount++
    if (node.analysisScore !== undefined) {
      scores.push(node.analysisScore)
    }
    for (const child of node.children) {
      traverse(child)
    }
  }

  traverse(root)

  // スコア分布
  const scoreDistribution = [
    { range: '0-20', count: 0 },
    { range: '21-40', count: 0 },
    { range: '41-60', count: 0 },
    { range: '61-80', count: 0 },
    { range: '81-100', count: 0 },
  ]

  for (const score of scores) {
    if (score <= 20) scoreDistribution[0].count++
    else if (score <= 40) scoreDistribution[1].count++
    else if (score <= 60) scoreDistribution[2].count++
    else if (score <= 80) scoreDistribution[3].count++
    else scoreDistribution[4].count++
  }

  return {
    totalNodes,
    maxDepth,
    leafCount,
    averageScore: scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : undefined,
    scoreDistribution,
  }
}

/**
 * ツリーをフラットなリストに展開（表示用）
 */
export interface FlatTreeItem {
  id: string
  name: string
  fullUrl: string
  depth: number
  isLeaf: boolean
  hasChildren: boolean
  isExpanded: boolean
  priority?: PagePriorityScore
  analysisScore?: number
  isAnalyzed?: boolean
  childCount: number
}

export function flattenTree(
  root: TreeNode,
  expandedIds: Set<string> = new Set(['root'])
): FlatTreeItem[] {
  const result: FlatTreeItem[] = []

  function traverse(node: TreeNode, parentExpanded: boolean) {
    if (!parentExpanded && node.id !== 'root') return

    const isExpanded = expandedIds.has(node.id)

    result.push({
      id: node.id,
      name: node.name,
      fullUrl: node.fullUrl,
      depth: node.depth,
      isLeaf: node.isLeaf,
      hasChildren: node.children.length > 0,
      isExpanded,
      priority: node.priority,
      analysisScore: node.analysisScore,
      isAnalyzed: node.isAnalyzed,
      childCount: node.urlCount,
    })

    if (isExpanded) {
      // 子ノードをソート（フォルダ優先、次にアルファベット順）
      const sortedChildren = [...node.children].sort((a, b) => {
        // フォルダ（子あり）を先に
        if (a.children.length > 0 && b.children.length === 0) return -1
        if (a.children.length === 0 && b.children.length > 0) return 1
        // 優先度でソート
        if (a.priority && b.priority) {
          return b.priority.score - a.priority.score
        }
        // アルファベット順
        return a.name.localeCompare(b.name)
      })

      for (const child of sortedChildren) {
        traverse(child, true)
      }
    }
  }

  traverse(root, true)
  return result
}

/**
 * 特定の深さまでのノードを取得
 */
export function getNodesAtDepth(root: TreeNode, maxDepth: number): TreeNode[] {
  const result: TreeNode[] = []

  function traverse(node: TreeNode) {
    if (node.depth <= maxDepth) {
      result.push(node)
    }
    if (node.depth < maxDepth) {
      for (const child of node.children) {
        traverse(child)
      }
    }
  }

  traverse(root)
  return result
}

/**
 * 分析済みノードのみを取得
 */
export function getAnalyzedNodes(root: TreeNode): TreeNode[] {
  const result: TreeNode[] = []

  function traverse(node: TreeNode) {
    if (node.isAnalyzed) {
      result.push(node)
    }
    for (const child of node.children) {
      traverse(child)
    }
  }

  traverse(root)
  return result
}

/**
 * パスでノードを検索
 */
export function findNodeByPath(root: TreeNode, path: string): TreeNode | null {
  const normalizedPath = path.replace(/\/$/, '') || '/'

  function traverse(node: TreeNode): TreeNode | null {
    if (node.fullPath === normalizedPath) {
      return node
    }
    for (const child of node.children) {
      const found = traverse(child)
      if (found) return found
    }
    return null
  }

  return traverse(root)
}

/**
 * ノードとその祖先を全て展開するためのIDセットを取得
 */
export function getExpandedIdsForPath(_root: TreeNode, path: string): Set<string> {
  const expandedIds = new Set<string>(['root'])
  const segments = path.split('/').filter(s => s.length > 0)

  let currentPath = ''
  for (const segment of segments) {
    currentPath += '/' + segment
    const nodeId = `node-${currentPath.replace(/\//g, '-')}`
    expandedIds.add(nodeId)
  }

  return expandedIds
}

/**
 * ツリーをTreeMap用のデータに変換
 */
export interface TreeMapData {
  name: string
  value: number // サイズ（URL数または逆スコア）
  score?: number
  tier?: string
  children?: TreeMapData[]
}

export function convertToTreeMapData(
  node: TreeNode,
  sizeBy: 'urlCount' | 'score' = 'urlCount'
): TreeMapData {
  const data: TreeMapData = {
    name: node.name,
    value: sizeBy === 'urlCount'
      ? Math.max(1, node.urlCount)
      : (node.analysisScore ? 101 - node.analysisScore : 50), // スコアが高いほど値が小さく（面積が小さく）
    score: node.analysisScore,
    tier: node.priority?.tier,
  }

  if (node.children.length > 0) {
    data.children = node.children.map(child => convertToTreeMapData(child, sizeBy))
  }

  return data
}

/**
 * 比較用: 複数URLの分析結果を行列形式に変換
 */
export interface ComparisonMatrix {
  urls: string[]
  metrics: string[]
  data: number[][] // [urlIndex][metricIndex]
  averages: number[] // 各メトリクスの平均
}

export function buildComparisonMatrix(
  analysisResults: Array<{
    url: string
    scores: Record<string, number>
  }>,
  metrics: string[] = ['overall', 'aiCitation', 'questionFit', 'coverage', 'structure', 'eeat', 'seoOverall']
): ComparisonMatrix {
  const urls = analysisResults.map(r => r.url)
  const data: number[][] = []
  const sums: number[] = new Array(metrics.length).fill(0)

  for (const result of analysisResults) {
    const row: number[] = []
    for (let i = 0; i < metrics.length; i++) {
      const value = result.scores[metrics[i]] ?? 0
      row.push(value)
      sums[i] += value
    }
    data.push(row)
  }

  const averages = sums.map(sum => Math.round(sum / (analysisResults.length || 1)))

  return { urls, metrics, data, averages }
}

/**
 * メトリクス名の日本語ラベル
 */
export const METRIC_LABELS: Record<string, string> = {
  overall: '総合スコア',
  aiCitation: 'AI引用適性',
  questionFit: '質問適合',
  coverage: 'カバレッジ',
  structure: '構造',
  eeat: 'E-E-A-T',
  seoOverall: 'SEO総合',
  seoTitle: 'タイトル',
  seoMeta: 'メタ',
  seoHeadings: '見出し',
  seoImages: '画像',
  seoLinks: 'リンク',
  seoMobile: 'モバイル',
  seoPerformance: 'パフォーマンス',
}
