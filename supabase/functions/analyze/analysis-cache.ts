/**
 * 分析キャッシュモジュール
 * - URLの正規化
 * - コンテンツハッシュによる重複検出
 * - Supabaseキャッシュ統合
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface CacheConfig {
  enabled: boolean
  ttlMinutes: number // キャッシュ有効期間（分）
  similarityThreshold: number // コンテンツ類似度閾値（0-1）
}

export interface CachedAnalysis {
  id: string
  url: string
  normalizedUrl: string
  contentHash: string
  result: any
  createdAt: string
  expiresAt: string
  hitCount: number
}

export interface CacheResult {
  hit: boolean
  cached?: CachedAnalysis
  reason?: string
}

const DEFAULT_CONFIG: CacheConfig = {
  enabled: true,
  ttlMinutes: 60 * 24 * 7, // 1週間
  similarityThreshold: 0.95
}

/**
 * URLを正規化
 * - プロトコル統一
 * - トレイリングスラッシュ除去
 * - クエリパラメータのソート
 * - フラグメント除去
 * - www.の正規化
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)

    // プロトコルをhttpsに統一
    parsed.protocol = 'https:'

    // www.を除去
    parsed.hostname = parsed.hostname.replace(/^www\./, '')

    // トレイリングスラッシュを除去（ルート以外）
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1)
    }

    // フラグメントを除去
    parsed.hash = ''

    // クエリパラメータをソート（トラッキングパラメータ除去）
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'ref', 'source'
    ]
    const params = new URLSearchParams(parsed.search)
    trackingParams.forEach(p => params.delete(p))

    const sortedParams = new URLSearchParams([...params.entries()].sort())
    parsed.search = sortedParams.toString()

    return parsed.toString()
  } catch {
    // パースできない場合はそのまま返す
    return url.toLowerCase().trim()
  }
}

/**
 * コンテンツハッシュを生成
 * - HTMLの本文部分のみをハッシュ化
 * - 軽微な変更は無視
 */
export async function generateContentHash(content: string): Promise<string> {
  // HTMLタグを除去してテキストのみ抽出
  const textContent = content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // 正規化（空白、句読点の揺れを吸収）
  const normalized = textContent
    .toLowerCase()
    .replace(/[。、．，！？!?]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 10000) // 最初の10000文字のみ

  // SHA-256ハッシュ生成
  const encoder = new TextEncoder()
  const data = encoder.encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * Simhashによる類似度計算（簡易版）
 * - 完全一致でなくても類似コンテンツを検出
 */
export function calculateSimilarity(hash1: string, hash2: string): number {
  if (hash1 === hash2) return 1

  // ハッシュをビット列として比較（ハミング距離）
  let matches = 0
  const minLen = Math.min(hash1.length, hash2.length)

  for (let i = 0; i < minLen; i++) {
    if (hash1[i] === hash2[i]) matches++
  }

  return matches / minLen
}

/**
 * キャッシュマネージャークラス
 */
export class AnalysisCacheManager {
  private supabase: SupabaseClient
  private config: CacheConfig

  constructor(supabaseUrl: string, supabaseKey: string, config: Partial<CacheConfig> = {}) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * キャッシュを検索
   */
  async lookup(url: string, content?: string): Promise<CacheResult> {
    if (!this.config.enabled) {
      return { hit: false, reason: 'Cache disabled' }
    }

    const normalizedUrl = normalizeUrl(url)

    // 1. 正規化URLで完全一致検索
    const { data: urlMatch, error: urlError } = await this.supabase
      .from('llmo.analyses')
      .select('*')
      .eq('normalized_url', normalizedUrl)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!urlError && urlMatch) {
      // ヒットカウント更新
      await this.incrementHitCount(urlMatch.id)
      return {
        hit: true,
        cached: this.mapToCachedAnalysis(urlMatch),
        reason: 'URL match'
      }
    }

    // 2. コンテンツハッシュで類似検索
    if (content) {
      const contentHash = await generateContentHash(content)

      const { data: hashMatches, error: hashError } = await this.supabase
        .from('llmo.analyses')
        .select('*')
        .eq('content_hash', contentHash)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)

      if (!hashError && hashMatches && hashMatches.length > 0) {
        const match = hashMatches[0]
        await this.incrementHitCount(match.id)
        return {
          hit: true,
          cached: this.mapToCachedAnalysis(match),
          reason: 'Content hash match'
        }
      }

      // 3. 類似ハッシュ検索（コストが高いため、オプション）
      if (this.config.similarityThreshold < 1) {
        const { data: recentAnalyses } = await this.supabase
          .from('llmo.analyses')
          .select('id, content_hash')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(100)

        if (recentAnalyses) {
          for (const analysis of recentAnalyses) {
            if (analysis.content_hash) {
              const similarity = calculateSimilarity(contentHash, analysis.content_hash)
              if (similarity >= this.config.similarityThreshold) {
                const { data: fullMatch } = await this.supabase
                  .from('llmo.analyses')
                  .select('*')
                  .eq('id', analysis.id)
                  .single()

                if (fullMatch) {
                  await this.incrementHitCount(fullMatch.id)
                  return {
                    hit: true,
                    cached: this.mapToCachedAnalysis(fullMatch),
                    reason: `Similar content (${Math.round(similarity * 100)}% match)`
                  }
                }
              }
            }
          }
        }
      }
    }

    return { hit: false, reason: 'No cache match' }
  }

  /**
   * 分析結果をキャッシュに保存
   */
  async store(
    url: string,
    content: string,
    result: any
  ): Promise<{ id: string; expiresAt: string }> {
    const normalizedUrl = normalizeUrl(url)
    const contentHash = await generateContentHash(content)
    const expiresAt = new Date(Date.now() + this.config.ttlMinutes * 60 * 1000).toISOString()

    const { data, error } = await this.supabase
      .from('llmo.analyses')
      .insert({
        url,
        normalized_url: normalizedUrl,
        content_hash: contentHash,
        result,
        expires_at: expiresAt,
        hit_count: 0
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to store cache: ${error.message}`)
    }

    return { id: data.id, expiresAt }
  }

  /**
   * キャッシュを更新（再分析時）
   */
  async update(
    id: string,
    content: string,
    result: any
  ): Promise<void> {
    const contentHash = await generateContentHash(content)
    const expiresAt = new Date(Date.now() + this.config.ttlMinutes * 60 * 1000).toISOString()

    const { error } = await this.supabase
      .from('llmo.analyses')
      .update({
        content_hash: contentHash,
        result,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to update cache: ${error.message}`)
    }
  }

  /**
   * ヒットカウントを増加
   */
  private async incrementHitCount(id: string): Promise<void> {
    await this.supabase.rpc('increment_analysis_hit_count', { analysis_id: id })
  }

  /**
   * DBレコードをCachedAnalysis型にマッピング
   */
  private mapToCachedAnalysis(record: any): CachedAnalysis {
    return {
      id: record.id,
      url: record.url,
      normalizedUrl: record.normalized_url,
      contentHash: record.content_hash,
      result: record.result,
      createdAt: record.created_at,
      expiresAt: record.expires_at,
      hitCount: record.hit_count || 0
    }
  }

  /**
   * 期限切れキャッシュを削除
   */
  async cleanup(): Promise<number> {
    const { data, error } = await this.supabase
      .from('llmo.analyses')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('Cache cleanup failed:', error)
      return 0
    }

    return data?.length || 0
  }

  /**
   * キャッシュ統計を取得
   */
  async getStats(): Promise<{
    totalEntries: number
    validEntries: number
    expiredEntries: number
    totalHits: number
    avgHitsPerEntry: number
  }> {
    const now = new Date().toISOString()

    // 有効なエントリ数
    const { count: validCount } = await this.supabase
      .from('llmo.analyses')
      .select('*', { count: 'exact', head: true })
      .gt('expires_at', now)

    // 期限切れエントリ数
    const { count: expiredCount } = await this.supabase
      .from('llmo.analyses')
      .select('*', { count: 'exact', head: true })
      .lte('expires_at', now)

    // 総ヒット数
    const { data: hitData } = await this.supabase
      .from('llmo.analyses')
      .select('hit_count')

    const totalHits = hitData?.reduce((sum, r) => sum + (r.hit_count || 0), 0) || 0
    const totalEntries = (validCount || 0) + (expiredCount || 0)

    return {
      totalEntries,
      validEntries: validCount || 0,
      expiredEntries: expiredCount || 0,
      totalHits,
      avgHitsPerEntry: totalEntries > 0 ? totalHits / totalEntries : 0
    }
  }
}

/**
 * グローバルキャッシュインスタンス（シングルトン）
 */
let globalCacheManager: AnalysisCacheManager | null = null

export function getCacheManager(
  supabaseUrl?: string,
  supabaseKey?: string,
  config?: Partial<CacheConfig>
): AnalysisCacheManager {
  if (!globalCacheManager) {
    const url = supabaseUrl || Deno.env.get('SUPABASE_URL')!
    const key = supabaseKey || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    globalCacheManager = new AnalysisCacheManager(url, key, config)
  }
  return globalCacheManager
}

/**
 * キャッシュ付き分析実行ヘルパー
 */
export async function withCache<T>(
  url: string,
  content: string,
  analyzer: () => Promise<T>,
  cacheManager?: AnalysisCacheManager
): Promise<{ result: T; fromCache: boolean; cacheInfo?: { reason: string; hitCount?: number } }> {
  const cache = cacheManager || getCacheManager()

  // キャッシュ検索
  const cacheResult = await cache.lookup(url, content)

  if (cacheResult.hit && cacheResult.cached) {
    console.log(`[cache] Hit: ${cacheResult.reason}`)
    return {
      result: cacheResult.cached.result as T,
      fromCache: true,
      cacheInfo: {
        reason: cacheResult.reason!,
        hitCount: cacheResult.cached.hitCount
      }
    }
  }

  // キャッシュミス: 分析実行
  console.log(`[cache] Miss: ${cacheResult.reason}`)
  const result = await analyzer()

  // 結果をキャッシュに保存
  try {
    await cache.store(url, content, result)
    console.log('[cache] Stored new analysis')
  } catch (err) {
    console.error('[cache] Failed to store:', err)
  }

  return {
    result,
    fromCache: false
  }
}
