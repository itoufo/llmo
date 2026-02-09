/**
 * E-E-A-T証拠抽出モジュール
 * Experience, Expertise, Authoritativeness, Trustworthiness の
 * 具体的証拠をHTMLから抽出・検証
 */

export interface AuthorInfo {
  name?: string
  role?: string
  bio?: string
  credentials: string[]
  socialProfiles: string[]
  imageUrl?: string
  schemaFound: boolean
}

export interface CitationInfo {
  type: 'academic' | 'news' | 'official' | 'internal' | 'unknown'
  url?: string
  text: string
  domain?: string
  isVerifiable: boolean
}

export interface PublicationInfo {
  publishDate?: string
  modifiedDate?: string
  hasDateline: boolean
  freshnessScore: number // 0-100
}

export interface OrganizationInfo {
  name?: string
  type?: string
  url?: string
  logo?: string
  address?: string
  contactInfo: {
    email?: string
    phone?: string
    socialProfiles: string[]
  }
  schemaFound: boolean
}

export interface EEATEvidence {
  // Experience - 実体験の証拠
  experience: {
    score: number
    signals: string[]
    firstPersonNarratives: number
    caseStudies: number
    practicalExamples: number
  }
  // Expertise - 専門性の証拠
  expertise: {
    score: number
    signals: string[]
    author: AuthorInfo | null
    technicalDepth: number
    industryTermsUsed: string[]
  }
  // Authoritativeness - 権威性の証拠
  authoritativeness: {
    score: number
    signals: string[]
    citations: CitationInfo[]
    externalReferences: number
    brandMentions: string[]
  }
  // Trustworthiness - 信頼性の証拠
  trustworthiness: {
    score: number
    signals: string[]
    publication: PublicationInfo
    organization: OrganizationInfo | null
    hasPrivacyPolicy: boolean
    hasContactInfo: boolean
    httpsSecure: boolean
  }
  // 総合スコア
  overallScore: number
  confidence: number
  recommendations: string[]
}

/**
 * HTMLからE-E-A-T証拠を抽出
 */
export function extractEEATEvidence(html: string, url: string): EEATEvidence {
  const experience = extractExperienceSignals(html)
  const expertise = extractExpertiseSignals(html)
  const authoritativeness = extractAuthoritativenessSignals(html, url)
  const trustworthiness = extractTrustworthinessSignals(html, url)

  // 総合スコア計算（加重平均）
  const weights = { experience: 0.2, expertise: 0.3, authoritativeness: 0.25, trustworthiness: 0.25 }
  const overallScore = Math.round(
    experience.score * weights.experience +
    expertise.score * weights.expertise +
    authoritativeness.score * weights.authoritativeness +
    trustworthiness.score * weights.trustworthiness
  )

  // 信頼度（証拠の量に基づく）
  const signalCount =
    experience.signals.length +
    expertise.signals.length +
    authoritativeness.signals.length +
    trustworthiness.signals.length
  const confidence = Math.min(1, signalCount / 20) // 20シグナルで最大信頼度

  // 推奨事項生成
  const recommendations = generateEEATRecommendations({
    experience, expertise, authoritativeness, trustworthiness
  })

  return {
    experience,
    expertise,
    authoritativeness,
    trustworthiness,
    overallScore,
    confidence: Math.round(confidence * 100) / 100,
    recommendations
  }
}

/**
 * Experience（実体験）シグナルの抽出
 */
function extractExperienceSignals(html: string): EEATEvidence['experience'] {
  const signals: string[] = []
  let score = 50 // ベーススコア

  // 一人称ナラティブの検出
  const firstPersonPatterns = [
    /私(は|が|の|たち)/g,
    /I (have|had|am|was|did|tried|tested|used|experienced)/gi,
    /we (have|had|are|were|did|tried|tested|used|experienced)/gi,
    /my experience/gi,
    /in my (opinion|view|experience)/gi,
    /実際に/g,
    /試してみ/g,
    /使ってみ/g
  ]
  let firstPersonCount = 0
  for (const pattern of firstPersonPatterns) {
    const matches = html.match(pattern)
    if (matches) firstPersonCount += matches.length
  }
  if (firstPersonCount > 0) {
    signals.push(`一人称ナラティブ: ${firstPersonCount}件`)
    score += Math.min(15, firstPersonCount * 3)
  }

  // ケーススタディ・事例の検出
  const caseStudyPatterns = [
    /case study/gi,
    /事例/g,
    /成功事例/g,
    /導入事例/g,
    /実績/g,
    /before.{0,20}after/gi,
    /ビフォー.{0,10}アフター/g
  ]
  let caseStudyCount = 0
  for (const pattern of caseStudyPatterns) {
    const matches = html.match(pattern)
    if (matches) caseStudyCount += matches.length
  }
  if (caseStudyCount > 0) {
    signals.push(`ケーススタディ/事例: ${caseStudyCount}件`)
    score += Math.min(15, caseStudyCount * 5)
  }

  // 具体的な数値・結果の検出
  const resultPatterns = [
    /\d+%\s*(増加|減少|向上|改善|アップ|ダウン)/g,
    /increased by \d+%/gi,
    /decreased by \d+%/gi,
    /結果として/g,
    /その結果/g,
    /achieved/gi
  ]
  let practicalExamples = 0
  for (const pattern of resultPatterns) {
    const matches = html.match(pattern)
    if (matches) practicalExamples += matches.length
  }
  if (practicalExamples > 0) {
    signals.push(`具体的成果/数値: ${practicalExamples}件`)
    score += Math.min(20, practicalExamples * 4)
  }

  return {
    score: Math.min(100, score),
    signals,
    firstPersonNarratives: firstPersonCount,
    caseStudies: caseStudyCount,
    practicalExamples
  }
}

/**
 * Expertise（専門性）シグナルの抽出
 */
function extractExpertiseSignals(html: string): EEATEvidence['expertise'] {
  const signals: string[] = []
  let score = 50

  // 著者情報の抽出
  const author = extractAuthorInfo(html)
  if (author) {
    if (author.name) {
      signals.push(`著者名: ${author.name}`)
      score += 10
    }
    if (author.credentials.length > 0) {
      signals.push(`資格/肩書: ${author.credentials.join(', ')}`)
      score += author.credentials.length * 5
    }
    if (author.schemaFound) {
      signals.push('Schema.org Person マークアップあり')
      score += 10
    }
  }

  // 専門用語の検出
  const technicalTermPatterns = [
    // IT/Tech
    /API|SDK|OAuth|JWT|REST|GraphQL/gi,
    // Medical
    /診断|治療|症状|処方|臨床/g,
    // Finance
    /ROI|KPI|P\/E|利回り|キャッシュフロー/gi,
    // Legal
    /法律|条項|判例|契約|規制/g
  ]
  const industryTerms: string[] = []
  for (const pattern of technicalTermPatterns) {
    const matches = html.match(pattern)
    if (matches) {
      industryTerms.push(...matches.slice(0, 5)) // 最大5件まで
    }
  }
  const uniqueTerms = [...new Set(industryTerms)]
  if (uniqueTerms.length > 0) {
    signals.push(`専門用語使用: ${uniqueTerms.length}種`)
    score += Math.min(15, uniqueTerms.length * 3)
  }

  // 技術的深度（詳細な説明の有無）
  const technicalDepthIndicators = [
    /<code[^>]*>/gi,
    /<pre[^>]*>/gi,
    /手順|ステップ|方法/g,
    /step\s*\d|step-by-step/gi,
    /具体的には/g,
    /詳しく説明/g
  ]
  let technicalDepth = 0
  for (const pattern of technicalDepthIndicators) {
    const matches = html.match(pattern)
    if (matches) technicalDepth += matches.length
  }
  if (technicalDepth > 0) {
    signals.push(`技術的詳細度: ${technicalDepth}件`)
    score += Math.min(15, technicalDepth * 2)
  }

  return {
    score: Math.min(100, score),
    signals,
    author,
    technicalDepth,
    industryTermsUsed: uniqueTerms
  }
}

/**
 * 著者情報の抽出
 */
function extractAuthorInfo(html: string): AuthorInfo | null {
  const info: AuthorInfo = {
    credentials: [],
    socialProfiles: [],
    schemaFound: false
  }

  // Schema.org Person
  const personSchemaMatch = html.match(/"@type"\s*:\s*"Person"[^}]*"name"\s*:\s*"([^"]+)"/i)
  if (personSchemaMatch) {
    info.name = personSchemaMatch[1]
    info.schemaFound = true
  }

  // メタタグからの著者
  const authorMetaMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i)
  if (authorMetaMatch && !info.name) {
    info.name = authorMetaMatch[1]
  }

  // rel="author" リンク
  const authorLinkMatch = html.match(/<a[^>]*rel=["']author["'][^>]*>([^<]+)</i)
  if (authorLinkMatch && !info.name) {
    info.name = authorLinkMatch[1].trim()
  }

  // バイライン検出
  const bylinePatterns = [
    /(?:written by|by|author:|著者:|執筆者:)\s*([^<\n]{2,50})/i,
    /<[^>]*class=["'][^"']*(?:author|byline|writer)[^"']*["'][^>]*>([^<]+)</i
  ]
  for (const pattern of bylinePatterns) {
    const match = html.match(pattern)
    if (match && !info.name) {
      info.name = match[1].trim()
      break
    }
  }

  // 資格・肩書の検出
  const credentialPatterns = [
    /(?:Ph\.?D|M\.?D|MBA|博士|修士|教授|准教授|弁護士|公認会計士|税理士)/gi
  ]
  for (const pattern of credentialPatterns) {
    const matches = html.match(pattern)
    if (matches) {
      info.credentials.push(...matches)
    }
  }
  info.credentials = [...new Set(info.credentials)]

  // ソーシャルプロファイル
  const socialPatterns = [
    /twitter\.com\/([a-zA-Z0-9_]+)/gi,
    /linkedin\.com\/in\/([a-zA-Z0-9_-]+)/gi,
    /github\.com\/([a-zA-Z0-9_-]+)/gi
  ]
  for (const pattern of socialPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      info.socialProfiles.push(match[0])
    }
  }
  info.socialProfiles = [...new Set(info.socialProfiles)]

  if (!info.name && info.credentials.length === 0 && info.socialProfiles.length === 0) {
    return null
  }

  return info
}

/**
 * Authoritativeness（権威性）シグナルの抽出
 */
function extractAuthoritativenessSignals(html: string, url: string): EEATEvidence['authoritativeness'] {
  const signals: string[] = []
  let score = 50

  // 引用・出典の抽出
  const citations = extractCitations(html)
  if (citations.length > 0) {
    const verifiableCitations = citations.filter(c => c.isVerifiable)
    signals.push(`引用: ${citations.length}件 (検証可能: ${verifiableCitations.length}件)`)
    score += Math.min(20, verifiableCitations.length * 4)
  }

  // 外部リンク（権威あるソースへ）
  const externalLinkMatches = html.matchAll(/<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>/gi)
  const externalDomains = new Set<string>()
  const authoritativeDomains = [
    'gov', 'edu', 'ac.jp', 'go.jp', 'wikipedia.org',
    'scholar.google', 'pubmed', 'nature.com', 'science.org'
  ]

  for (const match of externalLinkMatches) {
    try {
      const linkUrl = new URL(match[1])
      const currentDomain = new URL(url).hostname
      if (linkUrl.hostname !== currentDomain) {
        externalDomains.add(linkUrl.hostname)
        if (authoritativeDomains.some(d => linkUrl.hostname.includes(d))) {
          signals.push(`権威あるソースへのリンク: ${linkUrl.hostname}`)
          score += 5
        }
      }
    } catch {
      // Invalid URL, skip
    }
  }

  // ブランド・組織への言及
  const brandPatterns = [
    /Google|Microsoft|Amazon|Apple|Meta|Facebook/gi,
    /厚生労働省|経済産業省|総務省|金融庁/g,
    /WHO|CDC|FDA|NIH/gi
  ]
  const brandMentions: string[] = []
  for (const pattern of brandPatterns) {
    const matches = html.match(pattern)
    if (matches) {
      brandMentions.push(...matches)
    }
  }
  const uniqueBrands = [...new Set(brandMentions)]
  if (uniqueBrands.length > 0) {
    signals.push(`権威ある組織への言及: ${uniqueBrands.length}件`)
    score += Math.min(10, uniqueBrands.length * 2)
  }

  return {
    score: Math.min(100, score),
    signals,
    citations,
    externalReferences: externalDomains.size,
    brandMentions: uniqueBrands
  }
}

/**
 * 引用情報の抽出
 */
function extractCitations(html: string): CitationInfo[] {
  const citations: CitationInfo[] = []

  // 引用タグ
  const blockquoteMatches = html.matchAll(/<blockquote[^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/blockquote>/gi)
  for (const match of blockquoteMatches) {
    const text = match[1].replace(/<[^>]+>/g, '').trim()
    if (text.length > 10) {
      citations.push({
        type: 'unknown',
        text: text.substring(0, 200),
        isVerifiable: false
      })
    }
  }

  // cite属性付きリンク
  const citeMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi)
  for (const match of citeMatches) {
    const urlStr = match[1]
    const text = match[2].trim()

    let type: CitationInfo['type'] = 'unknown'
    let isVerifiable = false
    let domain: string | undefined

    try {
      const citationUrl = new URL(urlStr)
      domain = citationUrl.hostname
      isVerifiable = true

      if (domain.includes('.gov') || domain.includes('.go.jp')) {
        type = 'official'
      } else if (domain.includes('.edu') || domain.includes('.ac.') || domain.includes('scholar.google')) {
        type = 'academic'
      } else if (domain.includes('news') || domain.includes('times') || domain.includes('post')) {
        type = 'news'
      }
    } catch {
      // Not a valid URL
    }

    if (text.length > 5) {
      citations.push({
        type,
        url: urlStr,
        text: text.substring(0, 100),
        domain,
        isVerifiable
      })
    }
  }

  // 参考文献セクション
  const referenceMatch = html.match(/(?:参考文献|references|出典|sources)[^<]*<[^>]*>([^]*?)<\/(?:ul|ol|div)/i)
  if (referenceMatch) {
    const listItems = referenceMatch[1].matchAll(/<li[^>]*>([^<]+)/gi)
    for (const item of listItems) {
      citations.push({
        type: 'unknown',
        text: item[1].trim().substring(0, 200),
        isVerifiable: false
      })
    }
  }

  return citations.slice(0, 20) // 最大20件
}

/**
 * Trustworthiness（信頼性）シグナルの抽出
 */
function extractTrustworthinessSignals(html: string, url: string): EEATEvidence['trustworthiness'] {
  const signals: string[] = []
  let score = 50

  // 公開日・更新日の抽出
  const publication = extractPublicationInfo(html)
  if (publication.publishDate) {
    signals.push(`公開日: ${publication.publishDate}`)
    score += 5
  }
  if (publication.modifiedDate) {
    signals.push(`更新日: ${publication.modifiedDate}`)
    score += 10
  }
  if (publication.freshnessScore >= 80) {
    signals.push('コンテンツが新鮮')
    score += 10
  }

  // 組織情報の抽出
  const organization = extractOrganizationInfo(html)
  if (organization) {
    if (organization.name) {
      signals.push(`運営組織: ${organization.name}`)
      score += 5
    }
    if (organization.schemaFound) {
      signals.push('Schema.org Organization マークアップあり')
      score += 10
    }
    if (organization.contactInfo.email || organization.contactInfo.phone) {
      signals.push('連絡先情報あり')
      score += 5
    }
  }

  // プライバシーポリシー
  const hasPrivacyPolicy = /privacy|プライバシー|個人情報/i.test(html) &&
    /<a[^>]*href=["'][^"']*(?:privacy|プライバシー)[^"']*["']/i.test(html)
  if (hasPrivacyPolicy) {
    signals.push('プライバシーポリシーへのリンクあり')
    score += 5
  }

  // 連絡先ページ
  const hasContactInfo = /<a[^>]*href=["'][^"']*(?:contact|お問い合わせ|問合せ)[^"']*["']/i.test(html)
  if (hasContactInfo) {
    signals.push('お問い合わせページへのリンクあり')
    score += 5
  }

  // HTTPS
  const httpsSecure = url.startsWith('https://')
  if (httpsSecure) {
    signals.push('HTTPS使用')
    score += 5
  }

  return {
    score: Math.min(100, score),
    signals,
    publication,
    organization,
    hasPrivacyPolicy,
    hasContactInfo,
    httpsSecure
  }
}

/**
 * 公開情報の抽出
 */
function extractPublicationInfo(html: string): PublicationInfo {
  let publishDate: string | undefined
  let modifiedDate: string | undefined

  // Schema.org datePublished
  const publishedMatch = html.match(/"datePublished"\s*:\s*"([^"]+)"/i)
  if (publishedMatch) {
    publishDate = publishedMatch[1]
  }

  // Schema.org dateModified
  const modifiedMatch = html.match(/"dateModified"\s*:\s*"([^"]+)"/i)
  if (modifiedMatch) {
    modifiedDate = modifiedMatch[1]
  }

  // メタタグ
  if (!publishDate) {
    const metaDateMatch = html.match(/<meta[^>]*(?:property|name)=["'](?:article:published_time|date|pubdate)["'][^>]*content=["']([^"']+)["']/i)
    if (metaDateMatch) {
      publishDate = metaDateMatch[1]
    }
  }

  // time要素
  if (!publishDate) {
    const timeMatch = html.match(/<time[^>]*datetime=["']([^"']+)["']/i)
    if (timeMatch) {
      publishDate = timeMatch[1]
    }
  }

  // 日付らしきテキスト
  const hasDateline = /<time/i.test(html) ||
    /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(html) ||
    /\d{4}年\d{1,2}月\d{1,2}日/.test(html)

  // 新鮮度スコア計算
  let freshnessScore = 50
  const dateToCheck = modifiedDate || publishDate
  if (dateToCheck) {
    try {
      const contentDate = new Date(dateToCheck)
      const now = new Date()
      const daysDiff = (now.getTime() - contentDate.getTime()) / (1000 * 60 * 60 * 24)

      if (daysDiff < 30) freshnessScore = 100
      else if (daysDiff < 90) freshnessScore = 85
      else if (daysDiff < 180) freshnessScore = 70
      else if (daysDiff < 365) freshnessScore = 55
      else if (daysDiff < 730) freshnessScore = 40
      else freshnessScore = 25
    } catch {
      // Invalid date
    }
  }

  return {
    publishDate,
    modifiedDate,
    hasDateline,
    freshnessScore
  }
}

/**
 * 組織情報の抽出
 */
function extractOrganizationInfo(html: string): OrganizationInfo | null {
  const info: OrganizationInfo = {
    contactInfo: {
      socialProfiles: []
    },
    schemaFound: false
  }

  // Schema.org Organization
  const orgSchemaMatch = html.match(/"@type"\s*:\s*"(?:Organization|LocalBusiness|Corporation)"[^}]*"name"\s*:\s*"([^"]+)"/i)
  if (orgSchemaMatch) {
    info.name = orgSchemaMatch[1]
    info.schemaFound = true
  }

  // サイト名からの推測
  if (!info.name) {
    const siteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
    if (siteNameMatch) {
      info.name = siteNameMatch[1]
    }
  }

  // メールアドレス
  const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i)
  if (emailMatch) {
    info.contactInfo.email = emailMatch[0]
  }

  // 電話番号（日本形式）
  const phoneMatch = html.match(/(?:0\d{1,4}-\d{1,4}-\d{4}|\d{2,4}-\d{2,4}-\d{4})/i)
  if (phoneMatch) {
    info.contactInfo.phone = phoneMatch[0]
  }

  // ソーシャルプロファイル
  const socialPatterns = [
    /twitter\.com\/[a-zA-Z0-9_]+/gi,
    /facebook\.com\/[a-zA-Z0-9._]+/gi,
    /linkedin\.com\/company\/[a-zA-Z0-9_-]+/gi,
    /youtube\.com\/(?:channel|c|user)\/[a-zA-Z0-9_-]+/gi
  ]
  for (const pattern of socialPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      info.contactInfo.socialProfiles.push(match[0])
    }
  }
  info.contactInfo.socialProfiles = [...new Set(info.contactInfo.socialProfiles)]

  if (!info.name && !info.contactInfo.email && info.contactInfo.socialProfiles.length === 0) {
    return null
  }

  return info
}

/**
 * E-E-A-T改善推奨事項の生成
 */
function generateEEATRecommendations(evidence: Omit<EEATEvidence, 'overallScore' | 'confidence' | 'recommendations'>): string[] {
  const recommendations: string[] = []

  // Experience
  if (evidence.experience.score < 60) {
    if (evidence.experience.firstPersonNarratives < 3) {
      recommendations.push('実体験に基づく一人称の説明を追加することで信頼性が向上します')
    }
    if (evidence.experience.caseStudies === 0) {
      recommendations.push('具体的な事例やケーススタディの追加を検討してください')
    }
    if (evidence.experience.practicalExamples < 2) {
      recommendations.push('数値や具体的な成果を含む実例を追加してください')
    }
  }

  // Expertise
  if (evidence.expertise.score < 60) {
    if (!evidence.expertise.author) {
      recommendations.push('著者情報（名前、肩書、資格）を明記してください')
    } else if (evidence.expertise.author.credentials.length === 0) {
      recommendations.push('著者の資格や専門性を示す情報を追加してください')
    }
    if (!evidence.expertise.author?.schemaFound) {
      recommendations.push('Schema.org Personマークアップの追加を推奨します')
    }
  }

  // Authoritativeness
  if (evidence.authoritativeness.score < 60) {
    const verifiableCitations = evidence.authoritativeness.citations.filter(c => c.isVerifiable)
    if (verifiableCitations.length < 3) {
      recommendations.push('信頼できる情報源への引用・出典リンクを追加してください')
    }
    if (evidence.authoritativeness.externalReferences < 2) {
      recommendations.push('権威ある外部サイト（.gov, .edu等）への参照を検討してください')
    }
  }

  // Trustworthiness
  if (evidence.trustworthiness.score < 60) {
    if (!evidence.trustworthiness.publication.modifiedDate) {
      recommendations.push('コンテンツの更新日を明記してください（dateModifiedスキーマ推奨）')
    }
    if (!evidence.trustworthiness.organization?.schemaFound) {
      recommendations.push('Schema.org Organizationマークアップの追加を推奨します')
    }
    if (!evidence.trustworthiness.hasContactInfo) {
      recommendations.push('お問い合わせページへのリンクを追加してください')
    }
    if (!evidence.trustworthiness.hasPrivacyPolicy) {
      recommendations.push('プライバシーポリシーページへのリンクを追加してください')
    }
    if (evidence.trustworthiness.publication.freshnessScore < 50) {
      recommendations.push('コンテンツの更新を検討してください（古い情報は信頼性を下げます）')
    }
  }

  return recommendations.slice(0, 10) // 最大10件
}
