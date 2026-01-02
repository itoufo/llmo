interface AdvancedSeoResult {
  technicalSeo: {
    score: number
    items: {
      canonicalUrl: { exists: boolean; correct: boolean; url?: string }
      robots: { exists: boolean; content?: string; issues?: string[] }
      sitemap: { exists: boolean; referenced: boolean }
      ssl: { enabled: boolean; mixed: boolean }
      mobileViewport: { exists: boolean; content?: string }
      lang: { exists: boolean; value?: string }
      charset: { exists: boolean; value?: string }
      openGraph: { exists: boolean; complete: boolean; missing?: string[] }
      twitterCard: { exists: boolean; type?: string }
      jsonLd: { exists: boolean; valid: boolean; type?: string }
    }
  }
  
  performanceSeo: {
    score: number
    items: {
      loadTime: { value: number; rating: 'fast' | 'moderate' | 'slow' }
      htmlSize: { value: number; rating: 'optimal' | 'heavy' | 'too-heavy' }
      inlineCSS: { count: number; excessive: boolean }
      inlineJS: { count: number; excessive: boolean }
      externalLinks: { count: number; nofollow: number; sponsored: number }
      internalLinks: { count: number; broken: number }
    }
  }

  contentSeo: {
    score: number
    items: {
      wordCount: { value: number; rating: 'thin' | 'optimal' | 'comprehensive' }
      keywordDensity: { primary?: string; density: number; natural: boolean }
      readability: { score: number; level: string }
      uniqueContent: { ratio: number; duplicate?: boolean }
      freshness: { lastModified?: string; age?: number }
      multimedia: { videos: number; images: number; infographics: number }
      lists: { ordered: number; unordered: number }
      tables: { count: number; withCaption: number }
    }
  }

  userExperience: {
    score: number
    items: {
      coreWebVitals: {
        lcp: { value?: number; rating?: string }
        fid: { value?: number; rating?: string }
        cls: { value?: number; rating?: string }
      }
      accessibility: {
        ariaLabels: number
        skipLinks: boolean
        contrastRatio: boolean
        formLabels: boolean
      }
      navigation: {
        breadcrumbs: boolean
        toc: boolean // Table of Contents
        pagination: boolean
        searchBox: boolean
      }
    }
  }
}

export async function analyzeAdvancedSeo(html: string, url: string): Promise<AdvancedSeoResult> {
  const result: AdvancedSeoResult = {
    technicalSeo: {
      score: 0,
      items: {
        canonicalUrl: { exists: false, correct: false },
        robots: { exists: false },
        sitemap: { exists: false, referenced: false },
        ssl: { enabled: url.startsWith('https'), mixed: false },
        mobileViewport: { exists: false },
        lang: { exists: false },
        charset: { exists: false },
        openGraph: { exists: false, complete: false },
        twitterCard: { exists: false },
        jsonLd: { exists: false, valid: false }
      }
    },
    performanceSeo: {
      score: 0,
      items: {
        loadTime: { value: 0, rating: 'moderate' },
        htmlSize: { value: html.length, rating: 'optimal' },
        inlineCSS: { count: 0, excessive: false },
        inlineJS: { count: 0, excessive: false },
        externalLinks: { count: 0, nofollow: 0, sponsored: 0 },
        internalLinks: { count: 0, broken: 0 }
      }
    },
    contentSeo: {
      score: 0,
      items: {
        wordCount: { value: 0, rating: 'thin' },
        keywordDensity: { density: 0, natural: true },
        readability: { score: 0, level: 'average' },
        uniqueContent: { ratio: 1.0 },
        freshness: {},
        multimedia: { videos: 0, images: 0, infographics: 0 },
        lists: { ordered: 0, unordered: 0 },
        tables: { count: 0, withCaption: 0 }
      }
    },
    userExperience: {
      score: 0,
      items: {
        coreWebVitals: {
          lcp: {},
          fid: {},
          cls: {}
        },
        accessibility: {
          ariaLabels: 0,
          skipLinks: false,
          contrastRatio: false,
          formLabels: false
        },
        navigation: {
          breadcrumbs: false,
          toc: false,
          pagination: false,
          searchBox: false
        }
      }
    }
  }

  // Technical SEO Analysis
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
  if (canonicalMatch) {
    result.technicalSeo.items.canonicalUrl.exists = true
    result.technicalSeo.items.canonicalUrl.url = canonicalMatch[1]
    result.technicalSeo.items.canonicalUrl.correct = canonicalMatch[1] === url
  }

  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i)
  if (robotsMatch) {
    result.technicalSeo.items.robots.exists = true
    result.technicalSeo.items.robots.content = robotsMatch[1]
    const issues = []
    if (robotsMatch[1].includes('noindex')) issues.push('noindex設定されています')
    if (robotsMatch[1].includes('nofollow')) issues.push('nofollowが設定されています')
    if (issues.length > 0) result.technicalSeo.items.robots.issues = issues
  }

  // Mobile viewport
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i)
  if (viewportMatch) {
    result.technicalSeo.items.mobileViewport.exists = true
    result.technicalSeo.items.mobileViewport.content = viewportMatch[1]
  }

  // Language
  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i)
  if (langMatch) {
    result.technicalSeo.items.lang.exists = true
    result.technicalSeo.items.lang.value = langMatch[1]
  }

  // Charset
  const charsetMatch = html.match(/<meta[^>]*charset=["']([^"']+)["']/i)
  if (charsetMatch) {
    result.technicalSeo.items.charset.exists = true
    result.technicalSeo.items.charset.value = charsetMatch[1]
  }

  // Open Graph
  const ogTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']
  const foundOgTags: string[] = []
  ogTags.forEach(tag => {
    if (new RegExp(`<meta[^>]*property=["']${tag}["']`, 'i').test(html)) {
      foundOgTags.push(tag)
    }
  })
  result.technicalSeo.items.openGraph.exists = foundOgTags.length > 0
  result.technicalSeo.items.openGraph.complete = foundOgTags.length === ogTags.length
  result.technicalSeo.items.openGraph.missing = ogTags.filter(t => !foundOgTags.includes(t))

  // Twitter Card
  const twitterCardMatch = html.match(/<meta[^>]*name=["']twitter:card["'][^>]*content=["']([^"']+)["']/i)
  if (twitterCardMatch) {
    result.technicalSeo.items.twitterCard.exists = true
    result.technicalSeo.items.twitterCard.type = twitterCardMatch[1]
  }

  // JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
  if (jsonLdMatch) {
    result.technicalSeo.items.jsonLd.exists = true
    try {
      const jsonData = JSON.parse(jsonLdMatch[1])
      result.technicalSeo.items.jsonLd.valid = true
      result.technicalSeo.items.jsonLd.type = jsonData['@type']
    } catch {
      result.technicalSeo.items.jsonLd.valid = false
    }
  }

  // Performance SEO Analysis
  const htmlSizeKB = html.length / 1024
  if (htmlSizeKB < 100) {
    result.performanceSeo.items.htmlSize.rating = 'optimal'
  } else if (htmlSizeKB < 200) {
    result.performanceSeo.items.htmlSize.rating = 'heavy'
  } else {
    result.performanceSeo.items.htmlSize.rating = 'too-heavy'
  }

  // Inline CSS/JS count
  const inlineCSSCount = (html.match(/<style[^>]*>/gi) || []).length
  const inlineJSCount = (html.match(/<script[^>]*>(?!.*application\/ld\+json)/gi) || []).length
  result.performanceSeo.items.inlineCSS.count = inlineCSSCount
  result.performanceSeo.items.inlineCSS.excessive = inlineCSSCount > 5
  result.performanceSeo.items.inlineJS.count = inlineJSCount
  result.performanceSeo.items.inlineJS.excessive = inlineJSCount > 5

  // Links analysis
  const allLinks = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi) || []
  let externalCount = 0, nofollowCount = 0, sponsoredCount = 0, internalCount = 0
  
  allLinks.forEach(link => {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i)
    if (hrefMatch) {
      const href = hrefMatch[1]
      if (href.startsWith('http') && !href.includes(new URL(url).hostname)) {
        externalCount++
        if (/rel=["'][^"']*nofollow/i.test(link)) nofollowCount++
        if (/rel=["'][^"']*sponsored/i.test(link)) sponsoredCount++
      } else if (!href.startsWith('http') || href.includes(new URL(url).hostname)) {
        internalCount++
      }
    }
  })
  
  result.performanceSeo.items.externalLinks = { count: externalCount, nofollow: nofollowCount, sponsored: sponsoredCount }
  result.performanceSeo.items.internalLinks = { count: internalCount, broken: 0 }

  // Content SEO Analysis
  const textContent = html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  const wordCount = textContent.split(/\s+/).length
  result.contentSeo.items.wordCount.value = wordCount
  
  // 文字数評価はLLMで動的に行うため、一時的に'optimal'に設定
  // 実際の評価はevaluateWithLLMで上書きされる
  result.contentSeo.items.wordCount.rating = 'optimal'

  // Multimedia count
  result.contentSeo.items.multimedia.images = (html.match(/<img[^>]*>/gi) || []).length
  result.contentSeo.items.multimedia.videos = (html.match(/<video[^>]*>/gi) || []).length + 
                                               (html.match(/<iframe[^>]*(?:youtube|vimeo)[^>]*>/gi) || []).length

  // Lists and tables
  result.contentSeo.items.lists.ordered = (html.match(/<ol[^>]*>/gi) || []).length
  result.contentSeo.items.lists.unordered = (html.match(/<ul[^>]*>/gi) || []).length
  result.contentSeo.items.tables.count = (html.match(/<table[^>]*>/gi) || []).length
  result.contentSeo.items.tables.withCaption = (html.match(/<caption[^>]*>/gi) || []).length

  // User Experience Analysis
  result.userExperience.items.accessibility.ariaLabels = (html.match(/aria-label=["']/gi) || []).length
  result.userExperience.items.accessibility.skipLinks = /<a[^>]*href=["']#main["']/i.test(html) || 
                                                        /<a[^>]*href=["']#content["']/i.test(html)
  result.userExperience.items.accessibility.formLabels = /<label[^>]*for=["']/i.test(html)

  // Navigation elements
  result.userExperience.items.navigation.breadcrumbs = /itemtype=["'].*BreadcrumbList["']/i.test(html) ||
                                                       /class=["'][^"']*breadcrumb/i.test(html)
  result.userExperience.items.navigation.toc = /<nav[^>]*id=["']toc["']/i.test(html) ||
                                               /class=["'][^"']*table-of-contents/i.test(html)
  result.userExperience.items.navigation.pagination = /class=["'][^"']*pagination/i.test(html) ||
                                                      /<nav[^>]*aria-label=["']pagination["']/i.test(html)
  result.userExperience.items.navigation.searchBox = /<input[^>]*type=["']search["']/i.test(html) ||
                                                     /<form[^>]*role=["']search["']/i.test(html)

  // Calculate scores
  result.technicalSeo.score = calculateTechnicalScore(result.technicalSeo.items)
  result.performanceSeo.score = calculatePerformanceScore(result.performanceSeo.items)
  result.contentSeo.score = calculateContentScore(result.contentSeo.items)
  result.userExperience.score = calculateUXScore(result.userExperience.items)

  return result
}

function calculateTechnicalScore(items: any): number {
  let score = 100
  
  if (!items.canonicalUrl.exists) score -= 10
  else if (!items.canonicalUrl.correct) score -= 5
  
  if (!items.robots.exists) score -= 5
  else if (items.robots.issues?.length > 0) score -= 10
  
  if (!items.ssl.enabled) score -= 15
  if (items.ssl.mixed) score -= 10
  
  if (!items.mobileViewport.exists) score -= 15
  if (!items.lang.exists) score -= 5
  if (!items.charset.exists) score -= 5
  
  if (!items.openGraph.exists) score -= 10
  else if (!items.openGraph.complete) score -= 5
  
  if (!items.twitterCard.exists) score -= 5
  
  if (!items.jsonLd.exists) score -= 10
  else if (!items.jsonLd.valid) score -= 5
  
  return Math.max(0, score)
}

function calculatePerformanceScore(items: any): number {
  let score = 100
  
  if (items.htmlSize.rating === 'heavy') score -= 10
  else if (items.htmlSize.rating === 'too-heavy') score -= 20
  
  if (items.inlineCSS.excessive) score -= 10
  if (items.inlineJS.excessive) score -= 10
  
  if (items.externalLinks.count > 50) score -= 10
  if (items.externalLinks.nofollow === 0 && items.externalLinks.count > 10) score -= 5
  
  if (items.internalLinks.count < 3) score -= 10
  if (items.internalLinks.broken > 0) score -= 15
  
  return Math.max(0, score)
}

function calculateContentScore(items: any): number {
  let score = 100
  
  if (items.wordCount.rating === 'thin') score -= 30
  else if (items.wordCount.rating === 'comprehensive' && items.wordCount.value > 5000) score -= 5
  
  if (items.multimedia.images === 0) score -= 15
  if (items.multimedia.videos === 0) score -= 5
  
  if (items.lists.ordered === 0 && items.lists.unordered === 0) score -= 10
  if (items.tables.count > 0 && items.tables.withCaption === 0) score -= 5
  
  return Math.max(0, score)
}

function calculateUXScore(items: any): number {
  let score = 100
  
  if (items.accessibility.ariaLabels < 3) score -= 10
  if (!items.accessibility.skipLinks) score -= 5
  if (!items.accessibility.formLabels && items.formCount > 0) score -= 10
  
  if (!items.navigation.breadcrumbs) score -= 10
  if (items.wordCount > 2000 && !items.navigation.toc) score -= 10
  if (!items.navigation.searchBox) score -= 5
  
  return Math.max(0, score)
}

export function generateAdvancedSeoReport(result: AdvancedSeoResult): string {
  const issues: string[] = []
  const improvements: string[] = []
  
  // Technical SEO
  if (!result.technicalSeo.items.canonicalUrl.exists) {
    issues.push('Canonicalタグが設定されていません')
    improvements.push('重複コンテンツを防ぐためCanonicalタグを設定してください')
  }
  
  if (!result.technicalSeo.items.jsonLd.exists) {
    issues.push('構造化データ（JSON-LD）がありません')
    improvements.push('検索エンジンの理解を助けるため構造化データを追加してください')
  }
  
  if (!result.technicalSeo.items.openGraph.complete) {
    issues.push(`Open Graphタグが不完全です（${result.technicalSeo.items.openGraph.missing?.join(', ')}が不足）`)
    improvements.push('SNSでのシェア時の表示を最適化するため、すべてのOGタグを設定してください')
  }
  
  // Performance SEO  
  if (result.performanceSeo.items.htmlSize.rating === 'too-heavy') {
    issues.push(`HTMLサイズが大きすぎます（${(result.performanceSeo.items.htmlSize.value / 1024).toFixed(1)}KB）`)
    improvements.push('不要なインラインスタイル・スクリプトを外部ファイル化してください')
  }
  
  if (result.performanceSeo.items.inlineJS.excessive) {
    issues.push(`インラインJavaScriptが多すぎます（${result.performanceSeo.items.inlineJS.count}個）`)
    improvements.push('JavaScriptを外部ファイルにまとめて遅延読み込みを検討してください')
  }
  
  // Content SEO
  if (result.contentSeo.items.wordCount.rating === 'thin') {
    issues.push(`コンテンツ量が少なすぎます（${result.contentSeo.items.wordCount.value}語）`)
    improvements.push('最低300語以上、理想的には1000語以上のコンテンツを作成してください')
  }
  
  if (result.contentSeo.items.multimedia.images === 0) {
    issues.push('画像が1つもありません')
    improvements.push('視覚的な要素を追加してエンゲージメントを向上させてください')
  }
  
  // User Experience
  if (!result.userExperience.items.navigation.breadcrumbs) {
    issues.push('パンくずリストがありません')
    improvements.push('ユーザビリティとSEOのためパンくずリストを追加してください')
  }
  
  if (!result.userExperience.items.accessibility.skipLinks) {
    issues.push('スキップリンクがありません')
    improvements.push('アクセシビリティ向上のためスキップリンクを追加してください')
  }
  
  return JSON.stringify({ issues, improvements }, null, 2)
}