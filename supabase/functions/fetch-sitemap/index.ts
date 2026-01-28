import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
}

interface SitemapResult {
  domain: string
  sitemapUrl: string
  urls: SitemapUrl[]
  totalFound: number
  truncated: boolean
}

// XMLからURLを抽出
function parseUrlsFromXml(xml: string): SitemapUrl[] {
  const urls: SitemapUrl[] = []

  // <url>タグを抽出
  const urlMatches = xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)

  for (const match of urlMatches) {
    const urlBlock = match[1]

    const locMatch = urlBlock.match(/<loc>([^<]+)<\/loc>/i)
    if (!locMatch) continue

    const url: SitemapUrl = {
      loc: locMatch[1].trim()
    }

    const lastmodMatch = urlBlock.match(/<lastmod>([^<]+)<\/lastmod>/i)
    if (lastmodMatch) url.lastmod = lastmodMatch[1].trim()

    const changefreqMatch = urlBlock.match(/<changefreq>([^<]+)<\/changefreq>/i)
    if (changefreqMatch) url.changefreq = changefreqMatch[1].trim()

    const priorityMatch = urlBlock.match(/<priority>([^<]+)<\/priority>/i)
    if (priorityMatch) url.priority = priorityMatch[1].trim()

    urls.push(url)
  }

  return urls
}

// sitemap indexから子sitemapのURLを抽出
function parseSitemapIndexUrls(xml: string): string[] {
  const urls: string[] = []
  const matches = xml.matchAll(/<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/gi)

  for (const match of matches) {
    urls.push(match[1].trim())
  }

  return urls
}

// sitemapがindexかどうか判定
function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex/i.test(xml)
}

// robots.txtからsitemap URLを探す
async function findSitemapFromRobots(domain: string): Promise<string | null> {
  try {
    const robotsUrl = `https://${domain}/robots.txt`
    const res = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'LLMO-Doctor-Bot/1.0' }
    })

    if (!res.ok) return null

    const text = await res.text()
    const match = text.match(/^Sitemap:\s*(.+)$/im)

    return match ? match[1].trim() : null
  } catch {
    return null
  }
}

// sitemapを取得してパース
async function fetchSitemap(url: string): Promise<SitemapUrl[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LLMO-Doctor-Bot/1.0' }
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap: ${res.status}`)
  }

  let xml = await res.text()

  // gzip圧縮されている場合は.xml.gzの場合がある（Denoは自動解凍する）

  // sitemap indexの場合は最初の子sitemapのみ取得
  if (isSitemapIndex(xml)) {
    const childUrls = parseSitemapIndexUrls(xml)
    if (childUrls.length > 0) {
      // 最初の子sitemapを取得
      const childRes = await fetch(childUrls[0], {
        headers: { 'User-Agent': 'LLMO-Doctor-Bot/1.0' }
      })
      if (childRes.ok) {
        xml = await childRes.text()
      }
    }
  }

  return parseUrlsFromXml(xml)
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { domain } = await req.json()

    if (!domain || typeof domain !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid domain' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ドメインを正規化（httpやwwwを除去）
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .trim()

    console.log(`[fetch-sitemap] Processing domain: ${cleanDomain}`)

    let sitemapUrl = `https://${cleanDomain}/sitemap.xml`
    let urls: SitemapUrl[] = []

    // 1. まず /sitemap.xml を試す
    try {
      urls = await fetchSitemap(sitemapUrl)
      console.log(`[fetch-sitemap] Found ${urls.length} URLs from ${sitemapUrl}`)
    } catch (e) {
      console.log(`[fetch-sitemap] /sitemap.xml failed, checking robots.txt...`)

      // 2. robots.txtからsitemap URLを探す
      const robotsSitemap = await findSitemapFromRobots(cleanDomain)
      if (robotsSitemap) {
        sitemapUrl = robotsSitemap
        try {
          urls = await fetchSitemap(sitemapUrl)
          console.log(`[fetch-sitemap] Found ${urls.length} URLs from robots.txt sitemap`)
        } catch (e2) {
          console.log(`[fetch-sitemap] robots.txt sitemap also failed`)
        }
      }
    }

    // 3. 一般的なsitemap URLパターンを試す
    if (urls.length === 0) {
      const patterns = [
        `https://${cleanDomain}/sitemap_index.xml`,
        `https://${cleanDomain}/sitemap-index.xml`,
        `https://${cleanDomain}/sitemaps/sitemap.xml`,
        `https://www.${cleanDomain}/sitemap.xml`,
      ]

      for (const pattern of patterns) {
        try {
          urls = await fetchSitemap(pattern)
          if (urls.length > 0) {
            sitemapUrl = pattern
            console.log(`[fetch-sitemap] Found ${urls.length} URLs from ${pattern}`)
            break
          }
        } catch {
          continue
        }
      }
    }

    if (urls.length === 0) {
      return new Response(JSON.stringify({
        error: 'サイトマップが見つかりませんでした',
        tried: [
          `https://${cleanDomain}/sitemap.xml`,
          'robots.txt',
          'その他一般的なパターン'
        ]
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 最大100件に制限（フロントで10件選択可能）
    const maxUrls = 100
    const truncated = urls.length > maxUrls
    const totalFound = urls.length

    if (truncated) {
      urls = urls.slice(0, maxUrls)
    }

    const result: SitemapResult = {
      domain: cleanDomain,
      sitemapUrl,
      urls,
      totalFound,
      truncated
    }

    console.log(`[fetch-sitemap] Returning ${urls.length} URLs (total: ${totalFound})`)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('[fetch-sitemap] Error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Failed to fetch sitemap'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
