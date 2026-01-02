import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'
import { analyzeAdvancedSeo } from './seo-advanced.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ユーザー情報を取得
async function getUserInfo(req: Request): Promise<{ userId: string | null; tenantId: string | null }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null, tenantId: null }
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { userId: null, tenantId: null }
    }

    // デフォルトテナントを取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_tenant_id')
      .eq('id', user.id)
      .single()

    return {
      userId: user.id,
      tenantId: profile?.default_tenant_id || null
    }
  } catch (e) {
    console.warn('[analyze] Failed to get user info:', e)
    return { userId: null, tenantId: null }
  }
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

    // ユーザー情報取得（未ログインでも利用可能）
    const { userId, tenantId } = await getUserInfo(req)
    console.log(`[analyze] User: ${userId || 'anonymous'}, Tenant: ${tenantId || 'none'}`)

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
    const seoResult = await analyzeSEO(html, url, content)

    // 3. LLM評価（LLMO + SEOコメント）
    console.log('[analyze] Evaluating with LLM...')
    const { result: llmResult, usage } = await evaluateWithLLM(content, seoResult)

    // 3.5. LLM評価結果をAdvanced SEOに統合（LLMが全スコアを決定）
    console.log('[analyze] Integrating LLM results with Advanced SEO...')
    if (llmResult.advancedSeoScores && seoResult.advancedSeo) {
      // LLMが算出した全スコアを直接適用
      seoResult.advancedSeo.technicalSeo.score = llmResult.advancedSeoScores.technicalSeo || 50
      seoResult.advancedSeo.performanceSeo.score = llmResult.advancedSeoScores.performanceSeo || 50
      seoResult.advancedSeo.contentSeo.score = llmResult.advancedSeoScores.contentSeo || 50
      seoResult.advancedSeo.userExperience.score = llmResult.advancedSeoScores.userExperience || 50
      
      // スコアの根拠を記録
      if (llmResult.advancedSeoScores.reasoning) {
        seoResult.advancedSeo.scoreReasoning = llmResult.advancedSeoScores.reasoning
      }
      
      // コンテンツSEOのブレークダウンを更新
      if (seoResult.advancedSeo.contentSeo.scoreBreakdown) {
        seoResult.advancedSeo.contentSeo.scoreBreakdown.llmScore = llmResult.advancedSeoScores.contentSeo
        seoResult.advancedSeo.contentSeo.scoreBreakdown.llmReasoning = llmResult.advancedSeoScores.contentReasoning
      }
    }

    // 4. スコア計算
    const llmoOverall = Math.round(
      (llmResult.aiCitation.score +
        llmResult.questionFit.score +
        llmResult.coverage.score +
        llmResult.structure.score +
        llmResult.eeat.score) / 5
    )

    // Advanced SEOスコアを使用（よりdetailedな評価）
    const seoOverall = seoResult.seoOverallScore || Math.round(
      (seoResult.title.score +
        seoResult.meta.score +
        seoResult.headings.score +
        seoResult.images.score +
        seoResult.links.score +
        seoResult.mobile.score +
        seoResult.performance.score) / 7
    )

    // コスト計算（gpt-4o-mini価格: input $0.15/1M, output $0.60/1M）
    const inputCost = (usage.promptTokens / 1_000_000) * 0.15
    const outputCost = (usage.completionTokens / 1_000_000) * 0.60
    const totalCost = inputCost + outputCost

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
      },
      usage: {
        model: usage.model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        cost: {
          input: inputCost,
          output: outputCost,
          total: totalCost
        }
      }
    }

    // 5. Supabaseに保存（llmoスキーマ）
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { db: { schema: 'llmo' } }
    )

    await supabase.from('analyses').insert({
      url,
      // ユーザー・テナント
      user_id: userId,
      tenant_id: tenantId,
      // LLMO スコア
      ai_citation: result.scores.aiCitation,
      question_fit: result.scores.questionFit,
      coverage: result.scores.coverage,
      structure: result.scores.structure,
      eeat: result.scores.eeat,
      llmo_overall: llmoOverall,
      // SEO スコア
      seo_title: seoResult.title.score,
      seo_meta: seoResult.meta.score,
      seo_headings: seoResult.headings.score,
      seo_images: seoResult.images.score,
      seo_links: seoResult.links.score,
      seo_mobile: seoResult.mobile.score,
      seo_performance: seoResult.performance.score,
      seo_overall: seoOverall,
      // 総合
      overall: result.scores.overall,
      // 詳細
      improvements: result.improvements,
      questions: llmResult.questions,
      seo_details: seoResult,
      raw_result: { llm: llmResult, seo: seoResult },
      // LLM使用量
      model: usage.model,
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      total_tokens: usage.totalTokens,
      cost_usd: totalCost
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

    // HTMLからテキスト抽出
    content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (content.length > 200) {
      console.log(`[fetch] Direct fetch successful: ${content.length} chars`)
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
async function analyzeSEO(html: string, url: string, content: string) {
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

  // Advanced SEO分析を追加
  const advancedSeo = await analyzeAdvancedSeo(html, url)
  result.advancedSeo = advancedSeo

  // SEOスコアをAdvanced SEOを含めて再計算（より厳格に）
  const basicSeoScore = Math.round(
    (result.title.score * 0.15 +
     result.meta.score * 0.15 +
     result.headings.score * 0.15 +
     result.images.score * 0.10 +
     result.performance.score * 0.05) / 0.6
  )
  
  const advancedSeoScore = Math.round(
    (advancedSeo.technicalSeo.score * 0.25 +
     advancedSeo.performanceSeo.score * 0.20 +
     advancedSeo.contentSeo.score * 0.30 +
     advancedSeo.userExperience.score * 0.25)
  )
  
  // 基本SEOとAdvanced SEOの重み付け平均（Advanced SEOを重視）
  const seoOverallScore = Math.round(basicSeoScore * 0.3 + advancedSeoScore * 0.7)
  result.seoOverallScore = seoOverallScore

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

interface LLMUsage {
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

async function evaluateWithLLM(text: string, seoResult: any): Promise<{ result: any; usage: LLMUsage }> {
  const models = ['gpt-4o-mini', 'gpt-4o']

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
あなたはLLMO（AI検索最適化）とAdvanced SEO統合評価の専門家です。
以下のWebページを読み、AI検索エンジンと従来検索エンジン両方の観点から包括的に評価してください。

# ページ本文（${text.length}文字）
${text.slice(0, 10000)}

${seoSummary}

# 統合評価項目

## 1. AI引用スコア（0-100）
- LLMが回答素材として使いやすいかどうか
- 情報の明確性、構造化度、再利用性を評価

## 2. コンテンツ品質評価（重要）
以下の観点でコンテンツを総合的に評価：

### 2-1. 文字数と情報密度
- 現在の文字数: ${text.length}文字
- **質的評価基準**: 文字数だけでなく、情報の深さ、実用性、独自性を重視
- 薄いコンテンツ、適切なコンテンツ、包括的コンテンツのどれに該当するか
- このテーマ・トピックに対して「最適な文字数範囲」を算出

### 2-2. 情報の構造化度
- 見出し階層、箇条書き、Q&A形式、図表の活用状況
- LLMが情報を抽出しやすい構造になっているか

### 2-3. 専門性と信頼性
- E-E-A-T（Experience, Expertise, Authoritativeness, Trustworthiness）評価
- 情報源、データ、実体験の記載状況

## 3. 質問対応力の評価（重要）
以下の3カテゴリで質問をリストアップしてください：

### 3-1. 現在答えられる質問（answerable）
- このページの現在の内容で十分に回答できる質問（5-10個）
- AIが引用して回答を生成できるレベルの質問

### 3-2. 部分的に答えられる質問（partial）
- 情報が不足しているが、一部は答えられる質問（3-5個）
- 何が足りないかも含めて記載

### 3-3. 改善後に答えられるようになる質問（afterImprovement）
- 提案する改善を実施すれば答えられるようになる質問（5-10個）
- 具体的で検索されやすい質問形式で記載

## 4. 概念カバレッジ（0-100）
- このテーマで一般的にカバーすべき概念をどれだけ網羅しているか
- カバー済み概念と、不足している概念をリストアップ

## 5. 構造スコア（0-100）
- 見出し階層、箇条書き、Q&A形式などLLMが読み取りやすい構造か
- 問題点を具体的に指摘

## 6. E-E-A-Tスコア（0-100）
- 専門性、経験、権威性、信頼性
- 著者情報、参考文献、更新日などの有無

## 7. Advanced SEOスコアの直接算出（最重要）
**固定IF文は使用せず、以下の基準に基づいてあなたがスコアを直接決定してください。**

### 7-1. 技術的SEO（0-100点）
以下の要素を総合的に判断して点数を決定：
- **Canonical URL（15点配分）**: 存在・正確性・適切性
- **構造化データJSON-LD（15点配分）**: 存在・妥当性・スキーマタイプの適切性  
- **Open Graph（10点配分）**: 完全性・画像設定・説明の質
- **Twitter Card（5点配分）**: 設定有無・カードタイプの適切性
- **SSL/HTTPS（15点配分）**: 有効性・混合コンテンツの有無
- **モバイルビューポート（15点配分）**: 設定有無・レスポンシブ対応
- **その他（25点配分）**: 言語設定、文字コード、robots.txt、サイトマップ等

### 7-2. パフォーマンスSEO（0-100点）
以下の要素を総合的に判断して点数を決定：
- **HTMLサイズ（30点配分）**: 
  - 100KB未満: 満点
  - 100-300KB: 20-25点
  - 300-500KB: 10-20点
  - 500KB超: 0-10点
- **インラインCSS/JS（20点配分）**: 適量なら満点、過剰なら減点
- **外部リンク（25点配分）**: 適切な数とnofollow設定
- **内部リンク（25点配分）**: サイト内導線の質、ブロークンリンクの有無

### 7-3. コンテンツSEO（0-100点）
**コンテキストとトピックを考慮した動的評価：**
- **文字数（40点配分）**: 
  - ニュース記事: 300-800語が適切
  - ブログ記事: 800-2000語が適切
  - 詳細ガイド: 2000語以上が適切
  - トピックの深さと読者層を考慮
- **マルチメディア（20点配分）**: 
  - 画像: コンテンツ量に応じた適切な数
  - 動画: トピックによって必要性を判断
- **構造化（20点配分）**: リスト、テーブル、見出し階層の適切性
- **情報密度（20点配分）**: 無駄な文章がなく、価値ある情報の比率

### 7-4. ユーザー体験（0-100点）
以下の要素を総合的に判断して点数を決定：
- **アクセシビリティ（40点配分）**: ARIA、スキップリンク、フォームラベル
- **ナビゲーション（30点配分）**: パンくず、目次、検索機能の必要性判断
- **読みやすさ（30点配分）**: フォントサイズ、行間、コントラスト等

## 8. 具体的な改善案（最重要）
**LLMO改善案**、**SEO改善案**、**Advanced SEO改善案**を統合して、優先度の高い順に10-15個の改善案を提案：

各改善案には必ず以下を含めること：
- **priority**: "high" / "medium" / "low"
- **category**: "structure" / "content" / "eeat" / "question" / "concept" / "technical-seo" / "content-seo" / "ux-seo"
- **type**: "llmo" / "seo" / "advanced-seo" / "integrated"
- **issue**: 問題点を1文で説明
- **action**: 具体的な改善アクションを1-2文で説明
- **example**: 追加すべき文章やコードの具体例
- **enablesQuestions**: この改善で答えられるようになる質問（1-3個）
- **expectedImpact**: "低い" / "中程度" / "高い" / "非常に高い"

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
    "issues": ["問題点1", "問題点2"],
    "strengths": ["構造的な強み1", "強み2"]
  },
  "eeat": {
    "score": 数値(0-100),
    "strengths": ["強み1", "強み2"],
    "weaknesses": ["弱み1", "弱み2"]
  },
  "contentQuality": {
    "wordCountEvaluation": {
      "currentLength": 数値,
      "rating": "thin" / "adequate" / "comprehensive" / "excessive",
      "optimalRange": {"min": 数値, "max": 数値},
      "reasoning": "このトピックに最適な文字数範囲の理由",
      "qualityScore": 数値(0-100)
    },
    "informationDensity": {
      "score": 数値(0-100),
      "assessment": "情報密度の評価コメント"
    },
    "uniqueValue": {
      "score": 数値(0-100),
      "uniqueAspects": ["独自性のある要素1", "要素2"]
    }
  },
  "advancedSeoScores": {
    "technicalSeo": 数値(0-100),
    "performanceSeo": 数値(0-100),
    "contentSeo": 数値(0-100),
    "userExperience": 数値(0-100),
    "contentReasoning": "コンテンツSEOスコアの詳細根拠（何点配分でどう判断したか）",
    "reasoning": {
      "technical": "技術的SEOスコアの根拠",
      "performance": "パフォーマンスSEOスコアの根拠",
      "content": "コンテンツSEOスコアの根拠（文字数、画像、構造など各要素の配点と判断）",
      "ux": "ユーザー体験スコアの根拠"
    }
  },
  "improvements": [
    {
      "priority": "high",
      "category": "content-seo",
      "type": "integrated",
      "issue": "問題点の説明",
      "action": "具体的な改善アクション",
      "example": "追加すべき文章や見出しの例",
      "enablesQuestions": ["この改善で答えられるようになる質問"],
      "expectedImpact": "非常に高い"
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
          // LLMをフル活用してより詳細な統合評価を実施（gpt-4o-mini上限: 16384）
          max_completion_tokens: 16000
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
          const parsedResult = JSON.parse(content)
          const usage: LLMUsage = {
            model,
            promptTokens: res.usage?.prompt_tokens || 0,
            completionTokens: res.usage?.completion_tokens || 0,
            totalTokens: res.usage?.total_tokens || 0
          }
          console.log(`[analyze] Token usage: ${usage.totalTokens} (prompt: ${usage.promptTokens}, completion: ${usage.completionTokens})`)
          return { result: parsedResult, usage }
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
