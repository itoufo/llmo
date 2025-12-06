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
  details?: {
    aiCitationComment?: string
    missingConcepts?: string[]
    coveredConcepts?: string[]
    structureIssues?: string[]
    eeatStrengths?: string[]
    eeatWeaknesses?: string[]
  }
}
