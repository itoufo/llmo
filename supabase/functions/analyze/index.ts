import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[analyze] Starting analysis for: ${url}`)

    // 1. HTML取得（生HTMLも保持してSEO分析用に使う）
    console.log('[analyze] Fetching content...')
    const { html, content } = await fetchContent(url)

    if (content.length < 100) {
      return new Response(JSON.stringify({ error: 'Content too short to analyze' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. SEO診断（HTMLから抽出）
    console.log('[analyze] Analyzing SEO...')
    const seoResult = analyzeSEO(html, url, content)

    // 3. LLM評価（LLMO + SEOコメント）
    console.log('[analyze] Evaluating with LLM...')
    const llmResult = await evaluateWithLLM(content, seoResult)

    // 4. スコア計算
    const llmoOverall = Math.round(
      (llmResult.aiCitation.score +
        llmResult.questionFit.score +
        llmResult.coverage.score +
        llmResult.structure.score +
        llmResult.eeat.score) / 5
    )

    const seoOverall = Math.round(
      (seoResult.title.score +
        seoResult.meta.score +
        seoResult.headings.score +
        seoResult.images.score +
        seoResult.links.score +
        seoResult.mobile.score +
        seoResult.performance.score) / 7
    )

    const result = {
      url,
      scores: {
        // LLMO スコア
        aiCitation: llmResult.aiCitation.score,
        questionFit: llmResult.questionFit.score,
        coverage: llmResult.coverage.score,
        structure: llmResult.structure.score,
        eeat: llmResult.eeat.score,
        llmoOverall,
        // SEO スコア
        seoTitle: seoResult.title.score,
        seoMeta: seoResult.meta.score,
        seoHeadings: seoResult.headings.score,
        seoImages: seoResult.images.score,
        seoLinks: seoResult.links.score,
        seoMobile: seoResult.mobile.score,
        seoPerformance: seoResult.performance.score,
        seoOverall,
        // 総合
        overall: Math.round((llmoOverall + seoOverall) / 2)
      },
      improvements: llmResult.improvements || [],
      questions: llmResult.questions,
      seo: seoResult,
      details: {
        aiCitationComment: llmResult.aiCitation.comment,
        missingConcepts: llmResult.coverage.missing,
        coveredConcepts: llmResult.coverage.covered,
        structureIssues: llmResult.structure.issues,
        eeatStrengths: llmResult.eeat.strengths,
        eeatWeaknesses: llmResult.eeat.weaknesses
      }
    }

    // 5. Supabaseに保存
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase.from('analyses').insert({
      url,
      ai_citation: result.scores.aiCitation,
      question_fit: result.scores.questionFit,
      coverage: result.scores.coverage,
      structure: result.scores.structure,
      eeat: result.scores.eeat,
      overall: result.scores.overall,
      improvements: result.improvements,
      raw_result: { llm: llmResult, seo: seoResult }
    })

    console.log(`[analyze] Completed. LLMO: ${llmoOverall}, SEO: ${seoOverall}`)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('[analyze] Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Analysis failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

/**
 * HTMLから構造を保持したテキスト（Markdown風）に変換する
 * 見出し→#、リスト→-/1.、テーブル→|col|、引用→> を保持
 */
function htmlToStructuredText(html: string): string {
  // script, style, nav, footer等のノイズを除去
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')

  // 見出しをMarkdown形式に変換
  cleaned = cleaned.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, text) => {
    const cleanText = text.replace(/<[^>]+>/g, '').trim()
    return cleanText ? `\n${'#'.repeat(parseInt(level))} ${cleanText}\n` : ''
  })

  // リスト項目を変換
  cleaned = cleaned.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => {
    const cleanText = text.replace(/<[^>]+>/g, '').trim()
    return cleanText ? `- ${cleanText}\n` : ''
  })

  // テーブルセルを変換
  cleaned = cleaned.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, row) => {
    const cells: string[] = []
    row.replace(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi, (_: string, cell: string) => {
      cells.push(cell.replace(/<[^>]+>/g, '').trim())
      return ''
    })
    return cells.length > 0 ? `| ${cells.join(' | ')} |\n` : ''
  })

  // blockquoteを変換
  cleaned = cleaned.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, text) => {
    const cleanText = text.replace(/<[^>]+>/g, '').trim()
    return cleanText ? `> ${cleanText}\n` : ''
  })

  // 段落にはブレイクを入れる
  cleaned = cleaned.replace(/<\/p>/gi, '\n\n')
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n')

  // 残りのタグを除去
  cleaned = cleaned.replace(/<[^>]+>/g, ' ')

  // 連続空白・空行を整理
  cleaned = cleaned.replace(/[ \t]+/g, ' ')
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  cleaned = cleaned.trim()

  return cleaned
}

async function fetchContent(url: string): Promise<{ html: string; content: string }> {
  let html = ''
  let content = ''

  // まず直接fetchを試す
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    html = await res.text()

    // HTMLから構造を保持したテキストを抽出
    content = htmlToStructuredText(html)

    const plainLength = content.replace(/[#\-|>]/g, '').replace(/\s+/g, ' ').trim().length
    if (plainLength > 200) {
      console.log(`[fetch] Direct fetch successful: ${content.length} chars (plain: ${plainLength})`)
      return { html, content }
    }
  } catch (e) {
    console.log('[fetch] Direct fetch failed, trying Jina...')
  }

  // Jina Reader APIでJSレンダリング済みコンテンツを取得
  const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
    headers: { 'Accept': 'text/plain' }
  })

  if (!jinaRes.ok) {
    throw new Error(`Failed to fetch content: ${jinaRes.status}`)
  }

  content = await jinaRes.text()
  console.log(`[fetch] Jina fetch successful: ${content.length} chars`)
  return { html, content }
}

// SEO診断関数 - HTMLフィードバック付き
function analyzeSEO(html: string, url: string, content: string) {
  const result = {
    title: { score: 0, value: '', issues: [] as string[], suggestions: [] as string[], htmlFix: '' },
    meta: { score: 0, description: '', keywords: '', issues: [] as string[], suggestions: [] as string[], htmlFix: '' },
    headings: { score: 0, h1Count: 0, h2Count: 0, h3Count: 0, structure: [] as string[], issues: [] as string[], suggestions: [] as string[], htmlFix: '' },
    images: { score: 0, total: 0, withAlt: 0, withoutAlt: 0, missingAltImages: [] as string[], issues: [] as string[], suggestions: [] as string[], htmlFix: '' },
    links: { score: 0, internal: 0, external: 0, broken: 0, issues: [] as string[], suggestions: [] as string[], htmlFix: '' },
    mobile: { score: 0, hasViewport: false, issues: [] as string[], suggestions: [] as string[], htmlFix: '' },
    performance: { score: 0, htmlSize: 0, issues: [] as string[], suggestions: [] as string[] },
    canonical: { url: '', hasCanonical: false, htmlFix: '' },
    robots: { content: '', issues: [] as string[] },
    structured: { hasSchema: false, types: [] as string[], htmlFix: '' },
    ogp: { hasOgp: false, issues: [] as string[], htmlFix: '' },
    headHtml: '' // 推奨<head>タグの内容
  }

  // ページのキーワードを推測（コンテンツから頻出語を抽出）
  const pageKeywords = extractKeywords(content)
  const suggestedTitle = generateSuggestedTitle(content, pageKeywords)
  const suggestedDescription = generateSuggestedDescription(content, pageKeywords)

  // Title分析
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  if (titleMatch) {
    result.title.value = titleMatch[1].trim()
    const titleLen = result.title.value.length
    if (titleLen === 0) {
      result.title.score = 0
      result.title.issues.push('タイトルが空です')
      result.title.suggestions.push('30-60文字の説明的なタイトルを設定してください')
      result.title.htmlFix = `<title>${suggestedTitle}</title>`
    } else if (titleLen < 30) {
      result.title.score = 60
      result.title.issues.push(`タイトルが短すぎます（${titleLen}文字）`)
      result.title.suggestions.push('30-60文字を目安にキーワードを含めてください')
      result.title.htmlFix = `<!-- 現在: ${titleLen}文字 → 推奨: 30-60文字 -->\n<title>${suggestedTitle}</title>`
    } else if (titleLen > 60) {
      result.title.score = 70
      result.title.issues.push(`タイトルが長すぎます（${titleLen}文字）`)
      result.title.suggestions.push('60文字以内に収めると検索結果で省略されません')
      const shortenedTitle = result.title.value.slice(0, 57) + '...'
      result.title.htmlFix = `<!-- 現在: ${titleLen}文字 → 推奨: 60文字以内 -->\n<title>${shortenedTitle}</title>`
    } else {
      result.title.score = 100
    }
  } else {
    result.title.score = 0
    result.title.issues.push('titleタグがありません')
    result.title.suggestions.push('<title>ページタイトル</title>を<head>内に追加してください')
    result.title.htmlFix = `<title>${suggestedTitle}</title>`
  }

  // Meta Description分析
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
  if (descMatch) {
    result.meta.description = descMatch[1].trim()
    const descLen = result.meta.description.length
    if (descLen === 0) {
      result.meta.score = 30
      result.meta.issues.push('meta descriptionが空です')
      result.meta.suggestions.push('120-160文字で魅力的な説明を書いてください')
      result.meta.htmlFix = `<meta name="description" content="${suggestedDescription}">`
    } else if (descLen < 70) {
      result.meta.score = 60
      result.meta.issues.push(`meta descriptionが短すぎます（${descLen}文字）`)
      result.meta.suggestions.push('120-160文字を目安に内容を充実させてください')
      result.meta.htmlFix = `<!-- 現在: ${descLen}文字 → 推奨: 120-160文字 -->\n<meta name="description" content="${suggestedDescription}">`
    } else if (descLen > 160) {
      result.meta.score = 80
      result.meta.issues.push(`meta descriptionが長すぎます（${descLen}文字）`)
      result.meta.suggestions.push('160文字以内に収めてください')
      result.meta.htmlFix = `<!-- 現在: ${descLen}文字 → 推奨: 160文字以内 -->\n<meta name="description" content="${result.meta.description.slice(0, 157)}...">`
    } else {
      result.meta.score = 100
    }
  } else {
    result.meta.score = 0
    result.meta.issues.push('meta descriptionがありません')
    result.meta.suggestions.push('<meta name="description" content="...">を追加してください')
    result.meta.htmlFix = `<meta name="description" content="${suggestedDescription}">`
  }

  // Headings分析
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || []
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || []
  const h3Matches = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || []
  result.headings.h1Count = h1Matches.length
  result.headings.h2Count = h2Matches.length
  result.headings.h3Count = h3Matches.length

  // 見出しの内容を取得
  const extractHeadingText = (tag: string) => tag.replace(/<[^>]+>/g, '').trim()
  result.headings.structure = [
    ...h1Matches.map(h => `H1: ${extractHeadingText(h)}`),
    ...h2Matches.map(h => `H2: ${extractHeadingText(h)}`),
  ].slice(0, 10)

  let headingScore = 100
  let headingFixes: string[] = []
  if (h1Matches.length === 0) {
    headingScore -= 40
    result.headings.issues.push('H1タグがありません')
    result.headings.suggestions.push('ページに1つのH1タグを設定してください')
    headingFixes.push(`<h1>${suggestedTitle}</h1>`)
  } else if (h1Matches.length > 1) {
    headingScore -= 20
    result.headings.issues.push(`H1タグが${h1Matches.length}個あります`)
    result.headings.suggestions.push('H1タグは1ページに1つが推奨です')
    headingFixes.push(`<!-- H1は1つだけにしてください。現在${h1Matches.length}個あります -->`)
  }
  if (h2Matches.length === 0) {
    headingScore -= 20
    result.headings.issues.push('H2タグがありません')
    result.headings.suggestions.push('コンテンツをH2タグで構造化してください')
    headingFixes.push(`<!-- H2タグで構造化の例 -->\n<h2>主要なセクション1</h2>\n<p>内容...</p>\n<h2>主要なセクション2</h2>\n<p>内容...</p>`)
  }
  result.headings.score = Math.max(0, headingScore)
  result.headings.htmlFix = headingFixes.join('\n\n')

  // Images分析
  const imgMatches = html.match(/<img[^>]*>/gi) || []
  result.images.total = imgMatches.length
  const missingAltImages: string[] = []

  imgMatches.forEach(img => {
    if (/alt=["'][^"']+["']/i.test(img)) {
      result.images.withAlt++
    } else {
      result.images.withoutAlt++
      const srcMatch = img.match(/src=["']([^"']+)["']/i)
      if (srcMatch) {
        missingAltImages.push(srcMatch[1])
      }
    }
  })
  result.images.missingAltImages = missingAltImages.slice(0, 5)

  if (result.images.total === 0) {
    result.images.score = 70
    result.images.issues.push('画像がありません')
    result.images.suggestions.push('関連する画像を追加するとエンゲージメントが向上します')
  } else if (result.images.withoutAlt > 0) {
    result.images.score = Math.round((result.images.withAlt / result.images.total) * 100)
    result.images.issues.push(`${result.images.withoutAlt}個の画像にalt属性がありません`)
    result.images.suggestions.push('すべての画像に説明的なalt属性を追加してください')
    result.images.htmlFix = missingAltImages.slice(0, 3).map(src => {
      const filename = src.split('/').pop()?.split('.')[0] || 'image'
      return `<!-- alt属性を追加してください -->\n<img src="${src}" alt="${filename}の説明をここに記載">`
    }).join('\n\n')
  } else {
    result.images.score = 100
  }

  // Links分析
  const linkMatches = html.match(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi) || []
  const urlObj = new URL(url)
  linkMatches.forEach(link => {
    const hrefMatch = link.match(/href=["']([^"']*)["']/i)
    if (hrefMatch) {
      const href = hrefMatch[1]
      if (href.startsWith('http') && !href.includes(urlObj.hostname)) {
        result.links.external++
      } else if (!href.startsWith('#') && !href.startsWith('javascript:')) {
        result.links.internal++
      }
    }
  })

  if (result.links.internal === 0) {
    result.links.score = 60
    result.links.issues.push('内部リンクがありません')
    result.links.suggestions.push('関連ページへの内部リンクを追加してください')
    result.links.htmlFix = `<!-- 関連ページへの内部リンク例 -->\n<a href="/related-page">関連記事: タイトル</a>\n<a href="/category">カテゴリーページ</a>`
  } else {
    result.links.score = Math.min(100, 70 + result.links.internal * 3)
  }

  // Mobile分析
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["']/i)
  result.mobile.hasViewport = !!viewportMatch
  if (!viewportMatch) {
    result.mobile.score = 30
    result.mobile.issues.push('viewportメタタグがありません')
    result.mobile.suggestions.push('<meta name="viewport" content="width=device-width, initial-scale=1">を追加してください')
    result.mobile.htmlFix = `<meta name="viewport" content="width=device-width, initial-scale=1">`
  } else {
    result.mobile.score = 100
  }

  // Performance分析（簡易）
  result.performance.htmlSize = html.length
  if (html.length > 500000) {
    result.performance.score = 50
    result.performance.issues.push('HTMLサイズが大きすぎます')
    result.performance.suggestions.push('不要なコードを削除してページを軽量化してください')
  } else if (html.length > 200000) {
    result.performance.score = 70
    result.performance.issues.push('HTMLサイズがやや大きいです')
  } else {
    result.performance.score = 100
  }

  // Canonical
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)
  result.canonical.hasCanonical = !!canonicalMatch
  result.canonical.url = canonicalMatch ? canonicalMatch[1] : ''
  if (!canonicalMatch) {
    result.canonical.htmlFix = `<link rel="canonical" href="${url}">`
  }

  // Robots
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i)
  result.robots.content = robotsMatch ? robotsMatch[1] : ''
  if (result.robots.content.includes('noindex')) {
    result.robots.issues.push('noindexが設定されています - 検索エンジンにインデックスされません')
  }

  // Structured Data
  const schemaMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/i)
  result.structured.hasSchema = !!schemaMatch
  if (schemaMatch) {
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
    if (jsonLdMatch) {
      try {
        const schema = JSON.parse(jsonLdMatch[1])
        result.structured.types.push(schema['@type'] || 'Unknown')
      } catch {}
    }
  } else {
    result.structured.htmlFix = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "${result.title.value || suggestedTitle}",
  "description": "${result.meta.description || suggestedDescription}",
  "url": "${url}"
}
</script>`
  }

  // OGP分析
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["']/i)
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["']/i)
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["']/i)
  result.ogp.hasOgp = !!(ogTitleMatch && ogDescMatch && ogImageMatch)

  if (!result.ogp.hasOgp) {
    const ogpIssues: string[] = []
    if (!ogTitleMatch) ogpIssues.push('og:title')
    if (!ogDescMatch) ogpIssues.push('og:description')
    if (!ogImageMatch) ogpIssues.push('og:image')
    result.ogp.issues.push(`OGPタグが不足: ${ogpIssues.join(', ')}`)

    result.ogp.htmlFix = `<!-- OGP（SNSシェア用）タグ -->
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${result.title.value || suggestedTitle}">
<meta property="og:description" content="${result.meta.description || suggestedDescription}">
<meta property="og:image" content="https://example.com/ogp-image.png">
<meta property="og:site_name" content="サイト名">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${result.title.value || suggestedTitle}">
<meta name="twitter:description" content="${result.meta.description || suggestedDescription}">
<meta name="twitter:image" content="https://example.com/ogp-image.png">`
  }

  // 推奨<head>タグの生成
  result.headHtml = generateRecommendedHead(result, url, suggestedTitle, suggestedDescription)

  return result
}

// コンテンツからキーワードを抽出
function extractKeywords(content: string): string[] {
  const words = content
    .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)

  const freq: Record<string, number> = {}
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1
  })

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}

// 推奨タイトルを生成
function generateSuggestedTitle(content: string, keywords: string[]): string {
  const firstSentence = content.split(/[。.!！?？]/)[0]?.trim() || ''
  if (firstSentence.length > 10 && firstSentence.length <= 60) {
    return firstSentence
  }
  if (keywords.length > 0) {
    return `${keywords.slice(0, 3).join(' ')} | ページタイトル`
  }
  return 'ページタイトルを設定してください'
}

// 推奨descriptionを生成
function generateSuggestedDescription(content: string, keywords: string[]): string {
  const sentences = content.split(/[。.!！?？]/).filter(s => s.trim().length > 20)
  if (sentences.length > 0) {
    const desc = sentences.slice(0, 2).join('。').trim()
    if (desc.length >= 70 && desc.length <= 160) {
      return desc
    }
    if (desc.length > 160) {
      return desc.slice(0, 157) + '...'
    }
  }
  return `${keywords.slice(0, 5).join('、')}について詳しく解説しています。`
}

// 推奨<head>タグを生成
function generateRecommendedHead(seo: any, url: string, title: string, description: string): string {
  const finalTitle = seo.title.value || title
  const finalDesc = seo.meta.description || description

  return `<!-- ===== 推奨<head>タグ ===== -->
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- SEO基本タグ -->
  <title>${finalTitle}</title>
  <meta name="description" content="${finalDesc}">
  <link rel="canonical" href="${url}">

  <!-- OGP（SNSシェア用） -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${finalTitle}">
  <meta property="og:description" content="${finalDesc}">
  <meta property="og:image" content="[OGP画像のURLを設定]">
  <meta property="og:site_name" content="[サイト名]">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${finalTitle}">
  <meta name="twitter:description" content="${finalDesc}">
  <meta name="twitter:image" content="[OGP画像のURLを設定]">

  <!-- 構造化データ -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "${finalTitle}",
    "description": "${finalDesc}",
    "url": "${url}"
  }
  </script>
</head>`
}

async function evaluateWithLLM(text: string, seoResult: any) {
  const models = ['gpt-5-mini', 'gpt-4o-mini']

  const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY')!
  })

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const seoSummary = `
【SEO現状】
- タイトル: ${seoResult.title.value || 'なし'} (${seoResult.title.score}点)
- Meta Description: ${seoResult.meta.description ? seoResult.meta.description.slice(0, 50) + '...' : 'なし'} (${seoResult.meta.score}点)
- 見出し構造: H1=${seoResult.headings.h1Count}, H2=${seoResult.headings.h2Count}, H3=${seoResult.headings.h3Count}
- 画像: ${seoResult.images.total}個（alt付き${seoResult.images.withAlt}個）
- 構造化データ: ${seoResult.structured.hasSchema ? 'あり' : 'なし'}
- OGP: ${seoResult.ogp.hasOgp ? 'あり' : 'なし'}
`

  const prompt = `
あなたはLLMO（AI検索最適化）とSEO両方の専門評価者です。
以下のWebページを読み、AI検索エンジンと従来の検索エンジン両方の観点から評価してください。

注意: ページ本文は見出し（# / ## / ###）、リスト（-）、テーブル（| col |）、引用（>）の構造をMarkdown形式で保持しています。構造スコアの評価にはこの構造情報を正確に反映してください。

# ページ本文
${text.slice(0, 12000)}

${seoSummary}

# 評価項目

## 1. AI引用スコア（0-100）
- LLMが回答素材として使いやすいかどうか
- 情報の明確性、構造化度、再利用性を評価

## 2. 質問対応力の評価（重要）
以下の3カテゴリで質問をリストアップしてください：

### 2-1. 現在答えられる質問（answerable）
- このページの現在の内容で十分に回答できる質問（5-10個）
- AIが引用して回答を生成できるレベルの質問

### 2-2. 部分的に答えられる質問（partial）
- 情報が不足しているが、一部は答えられる質問（3-5個）
- 何が足りないかも含めて記載

### 2-3. 改善後に答えられるようになる質問（afterImprovement）
- 提案する改善を実施すれば答えられるようになる質問（5-10個）
- 具体的で検索されやすい質問形式で記載

## 3. 概念カバレッジ（0-100）
- このテーマで一般的にカバーすべき概念をどれだけ網羅しているか
- カバー済み概念と、不足している概念をリストアップ

## 4. 構造スコア（0-100）
- 見出し階層、箇条書き、Q&A形式などLLMが読み取りやすい構造か
- 問題点を具体的に指摘

## 5. E-E-A-Tスコア（0-100）
- 専門性、経験、権威性、信頼性
- 著者情報、参考文献、更新日などの有無

## 6. 具体的な改善案（最重要）
**LLMO改善案**と**SEO改善案**を両方含めて、優先度の高い順に8-12個の改善案を提案：

各改善案には必ず以下を含めること：
- **priority**: "high" / "medium" / "low"
- **category**: "structure" / "content" / "eeat" / "question" / "concept" / "seo-title" / "seo-meta" / "seo-heading" / "seo-image" / "seo-link" / "seo-schema"
- **type**: "llmo" / "seo" / "both"（どちらの改善か）
- **issue**: 問題点を1文で説明
- **action**: 具体的な改善アクションを1-2文で説明
- **example**: 追加すべき文章やコードの具体例
- **enablesQuestions**: この改善で答えられるようになる質問（1-3個）

# 出力形式（JSON）

{
  "aiCitation": {
    "score": 数値(0-100),
    "comment": "評価コメント（1-2文）"
  },
  "questions": {
    "answerable": ["現在答えられる質問1", "質問2", ...],
    "partial": [
      {"question": "部分的に答えられる質問", "missing": "不足している情報"}
    ],
    "afterImprovement": ["改善後に答えられる質問1", "質問2", ...]
  },
  "questionFit": {
    "score": 数値(0-100),
    "covered": ["対応できている質問1", "質問2"],
    "missing": ["不足している質問1", "質問2"]
  },
  "coverage": {
    "score": 数値(0-100),
    "covered": ["カバー済み概念1", "概念2"],
    "missing": ["不足概念1", "概念2"]
  },
  "structure": {
    "score": 数値(0-100),
    "issues": ["問題点1", "問題点2"]
  },
  "eeat": {
    "score": 数値(0-100),
    "strengths": ["強み1", "強み2"],
    "weaknesses": ["弱み1", "弱み2"]
  },
  "improvements": [
    {
      "priority": "high",
      "category": "structure",
      "type": "llmo",
      "issue": "問題点の説明",
      "action": "具体的な改善アクション",
      "example": "追加すべき文章や見出しの例",
      "enablesQuestions": ["この改善で答えられるようになる質問"]
    },
    {
      "priority": "high",
      "category": "seo-meta",
      "type": "seo",
      "issue": "meta descriptionがない",
      "action": "検索結果に表示される説明文を追加",
      "example": "<meta name=\\"description\\" content=\\"...\\">",
      "enablesQuestions": []
    }
  ]
}
`

  // リトライロジック（モデル切替と長さ調整付き）
  let lastError: Error | null = null

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[analyze] OpenAI ${model} attempt ${attempt}/3`)
        const res = await openai.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          // 4000で長さ切れが出たためさらに増やす
          max_completion_tokens: 15000
        })

        const choice = res.choices?.[0]
        const content = choice?.message?.content

        if (!content) {
          const finishReason = choice?.finish_reason || 'unknown'
          const refusal = (choice as any)?.message?.refusal
          throw new Error(
            refusal
              ? `LLM refused (${finishReason}): ${JSON.stringify(refusal)}`
              : `Empty response (finish_reason=${finishReason})`
          )
        }

        try {
          return JSON.parse(content)
        } catch (e: any) {
          throw new Error(`Failed to parse JSON: ${e.message}`)
        }
      } catch (e: any) {
        lastError = e
        console.warn(`[analyze] ${model} attempt ${attempt} failed: ${e.message}`)
        if (attempt < 3) {
          await sleep(500 * attempt)
        }
      }
    }
    console.warn('[analyze] Switching model after repeated failures')
  }

  throw new Error(`LLM failed after retries: ${lastError?.message}`)
}
