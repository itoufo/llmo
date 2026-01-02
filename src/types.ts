export interface AnalyzeRequest {
  url: string
}

export interface Improvement {
  priority: 'high' | 'medium' | 'low'
  category: 'structure' | 'content' | 'eeat' | 'question' | 'concept' | 'seo-title' | 'seo-meta' | 'seo-heading' | 'seo-image' | 'seo-link' | 'seo-schema'
  type?: 'llmo' | 'seo' | 'both'
  issue: string
  action: string
  example?: string
  enablesQuestions?: string[]
}

export interface PartialQuestion {
  question: string
  missing: string
}

export interface QuestionsEvaluation {
  answerable: string[]
  partial: PartialQuestion[]
  afterImprovement: string[]
}

export interface SEOItem {
  score: number
  issues: string[]
  suggestions: string[]
}

export interface SEOResult {
  title: SEOItem & { value: string }
  meta: SEOItem & { description: string; keywords: string }
  headings: SEOItem & { h1Count: number; h2Count: number; h3Count: number }
  images: SEOItem & { total: number; withAlt: number; withoutAlt: number }
  links: SEOItem & { internal: number; external: number }
  mobile: SEOItem & { hasViewport: boolean }
  performance: SEOItem & { htmlSize: number }
  canonical: { url: string; hasCanonical: boolean }
  robots: { content: string; issues: string[] }
  structured: { hasSchema: boolean; types: string[] }
  seoOverallScore?: number
  advancedSeo?: {
    technicalSeo: { score: number; items: any }
    performanceSeo: { score: number; items: any }
    contentSeo: { 
      score: number; 
      items: any;
      scoreBreakdown?: {
        baseScore: number;
        deductions: Array<{ reason: string; penalty: number; current: number }>;
        calculations: Array<{ reason: string; penalty: number }>;
        llmAdjustments?: Array<{
          reason: string;
          adjustment: number;
          originalScore: number;
          finalScore: number;
          targetWordCount: number;
          actualWordCount: number;
        }>;
      }
    }
    userExperience: { score: number; items: any }
  }
}

export interface UsageInfo {
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: {
    input: number
    output: number
    total: number
  }
}

export interface AnalyzeResult {
  url: string
  scores: {
    // LLMO
    aiCitation: number
    questionFit: number
    coverage: number
    structure: number
    eeat: number
    llmoOverall?: number
    // SEO
    seoTitle?: number
    seoMeta?: number
    seoHeadings?: number
    seoImages?: number
    seoLinks?: number
    seoMobile?: number
    seoPerformance?: number
    seoOverall?: number
    // Total
    overall: number
  }
  improvements: Improvement[]
  questions: QuestionsEvaluation
  seo?: SEOResult
  result?: {
    metadata?: {
      title?: string
    }
    issues?: any[]
  }
  details?: {
    aiCitationComment?: string
    missingConcepts?: string[]
    coveredConcepts?: string[]
    structureIssues?: string[]
    eeatStrengths?: string[]
    eeatWeaknesses?: string[]
  }
  usage?: UsageInfo
}

// 診断結果のキャッシュエントリ
export interface CachedResult {
  date: string // YYYY-MM-DD
  analyzedAt: string // ISO timestamp
  result: AnalyzeResult
}

// ページごとの履歴
export interface PageHistory {
  url: string
  latestScore: number
  results: CachedResult[]
}

// ドメインごとの履歴
export interface DomainHistory {
  domain: string
  pages: Record<string, PageHistory> // key: URL
}

// 全体の履歴ストレージ
export interface HistoryStorage {
  domains: Record<string, DomainHistory> // key: domain
}

// 分析結果（DB用）
export interface Analysis {
  id: string
  url: string
  score: number
  result: AnalyzeResult
  user_id: string | null
  tenant_id: string | null
  created_at: string
}

// テナント情報
export interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  monthly_limit: number
  settings: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

// プロファイル情報
export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  default_tenant_id: string | null
  created_at: string
  updated_at: string
}
