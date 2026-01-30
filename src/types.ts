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

// サイトマップ関連
export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
}

export interface SitemapResult {
  domain: string
  sitemapUrl: string
  urls: SitemapUrl[]
  totalFound: number
  truncated: boolean
}

export interface SitemapUrlWithStatus extends SitemapUrl {
  selected: boolean
  status: 'pending' | 'analyzing' | 'completed' | 'error'
  score?: number
  analyzedAt?: string
  error?: string
}

// ===========================================
// Consulting Grade Types
// ===========================================

// Extended Improvement with ROI data
export interface EnhancedImprovement extends Improvement {
  effort?: 'minimal' | 'low' | 'medium' | 'high' | 'major'
  impactPrediction?: {
    metricAffected: string
    currentEstimate: number
    predictedScore: number
    confidenceLevel: 'high' | 'medium' | 'low'
  }
  evidence?: {
    contentQuotes: string[]
    scoreJustification: string
  }
  isQuickWin?: boolean
  implementationOrder?: number
}

// Executive Summary
export interface KeyFinding {
  icon: 'critical' | 'warning' | 'info' | 'success'
  finding: string
}

export interface ExecutiveSummaryData {
  headline: string
  keyFindings: KeyFinding[]
  overallVerdict: 'excellent' | 'good' | 'needs-improvement' | 'critical'
  scores: {
    overall: number
    llmoOverall: number
    seoOverall: number
  }
  benchmarkPercentile?: number
  improvementPotential?: number
  quickWinCount?: number
  totalEstimatedHours?: { min: number; max: number }
}

// Quick Wins
export interface QuickWinItem {
  id: string
  title: string
  description: string
  effort: string
  impact: string
  category: string
  steps?: string[]
  example?: string
  metricAffected?: string
}

// Benchmark Comparison
export interface BenchmarkData {
  metric: string
  label: string
  score: number
  percentile: number
  interpretation: string
  industryAvg: number
  gap: number
  improvementPotential: number
}

// Implementation Roadmap
export interface RoadmapItem {
  id: string
  title: string
  description?: string
  effort: string
  impact: string
  dependencies?: string[]
  isCompleted?: boolean
}

export interface RoadmapPhase {
  id: string
  phase: string
  timeframe: string
  description?: string
  items: RoadmapItem[]
  expectedGain: string
  isActive?: boolean
}

// Consulting Insights (from LLM response)
export interface ConsultingInsights {
  executiveSummary?: {
    headline: string
    keyFindings: KeyFinding[]
    overallVerdict: 'excellent' | 'good' | 'needs-improvement' | 'critical'
  }
  quickWins?: {
    items: Array<{
      title: string
      effort: string
      impact: string
      description: string
    }>
    totalTimeEstimate: string
    expectedTotalGain: string
  }
  roadmap?: {
    phases: Array<{
      phase: string
      timeframe: string
      items: string[]
      expectedGain: string
    }>
  }
  competitiveContext?: {
    industryBenchmark: string
    positioningAdvice: string
  }
}

// Extended AnalyzeResult with consulting data
export interface EnhancedAnalyzeResult extends AnalyzeResult {
  consultingInsights?: ConsultingInsights
  enhancedImprovements?: EnhancedImprovement[]
}

// ===========================================
// Sitemap Enhanced Types
// ===========================================

// Page priority calculation
export interface PagePriorityScore {
  url: string
  score: number
  tier: 'critical' | 'high' | 'medium' | 'low'
  factors: {
    depth: number
    sitemapPriority: number
    recency: number
    pathSignal: number
    changefreq: number
  }
}

// URL tree node for visualization
export interface UrlTreeNode {
  segment: string
  fullPath: string
  url?: SitemapUrlWithStatus
  children: UrlTreeNode[]
  count: number
  avgScore?: number
  priorityTier?: 'critical' | 'high' | 'medium' | 'low'
}

// Sitemap history snapshot
export interface SitemapSnapshot {
  id: string
  domain: string
  createdAt: string
  averageScore: number
  urlCount: number
  urlScores: Record<string, number>
}

// Trend data point
export interface TrendDataPoint {
  date: string
  averageScore: number
  urlCount: number
  llmoAvg?: number
  seoAvg?: number
}

// Comparison row for matrix
export interface ComparisonRow {
  url: string
  pathname: string
  overall: number
  llmoOverall?: number
  seoOverall?: number
  aiCitation: number
  questionFit: number
  coverage: number
  structure: number
  eeat: number
  analyzedAt?: string
}

// View modes for sitemap
export type SitemapViewMode = 'list' | 'tree' | 'compare' | 'trends'
