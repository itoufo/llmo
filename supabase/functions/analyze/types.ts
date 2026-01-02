// LLM評価結果の型定義
export interface LLMEvaluationResult {
  aiCitation: {
    score: number
    comment: string
  }
  questions: {
    answerable: string[]
    partial: Array<{ question: string; missing: string }>
    afterImprovement: string[]
  }
  questionFit: {
    score: number
    covered: string[]
    missing: string[]
  }
  coverage: {
    score: number
    covered: string[]
    missing: string[]
  }
  structure: {
    score: number
    issues: string[]
    strengths?: string[]
  }
  eeat: {
    score: number
    strengths: string[]
    weaknesses: string[]
  }
  contentQuality?: {
    wordCountEvaluation: {
      currentLength: number
      rating: 'thin' | 'adequate' | 'optimal' | 'comprehensive' | 'excessive'
      optimalRange: { min: number; max: number }
      reasoning: string
      qualityScore: number
    }
    informationDensity: {
      score: number
      assessment: string
    }
    uniqueValue: {
      score: number
      uniqueAspects: string[]
    }
  }
  overallScores?: {
    llmoOverall: number
    llmoBreakdown: any
    seoOverall: number
    seoBreakdown: any
    advancedSeoOverall: number
    advancedSeoBreakdown: any
  }
  advancedSeoScores?: {
    technicalSeo: number
    performanceSeo: number
    contentSeo: number
    userExperience: number
    wordCountRating: 'thin' | 'adequate' | 'optimal' | 'comprehensive'
    contentReasoning: string
    reasoning: {
      technical: string
      performance: string
      content: string
      ux: string
    }
  }
  improvements: Array<{
    priority: 'high' | 'medium' | 'low'
    category: string
    type?: string
    issue: string
    action: string
    example?: string
    enablesQuestions?: string[]
    expectedImpact?: string
  }>
}

export interface SEOAnalysisResult {
  title: {
    exists: boolean
    content: string
    length: number
    score: number
    suggestions: string[]
  }
  meta: {
    description: { exists: boolean; content: string; length: number }
    keywords: { exists: boolean; content: string }
    score: number
    suggestions: string[]
  }
  headings: {
    h1: { count: number; content: string[] }
    h2: { count: number; content: string[] }
    h3: { count: number; content: string[] }
    structure: string
    score: number
    suggestions: string[]
  }
  images: {
    count: number
    withAlt: number
    withTitle: number
    score: number
    suggestions: string[]
  }
  links: {
    internal: number
    external: number
    score: number
    suggestions: string[]
  }
  keywords: {
    density: Record<string, number>
    score: number
    suggestions: string[]
  }
  mobile: {
    viewport: boolean
    responsive: boolean
    score: number
    suggestions: string[]
  }
  performance: {
    htmlSize: number
    estimatedLoadTime: number
    score: number
    suggestions: string[]
  }
  seoComments?: string[]
  seoOverallScore?: number
  advancedSeo?: any
  scoreReasoning?: any
}

export interface LLMUsage {
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface AnalysisResult {
  url: string
  scores: {
    aiCitation: number
    questionFit: number
    coverage: number
    structure: number
    eeat: number
    llmoOverall: number
    seoTitle: number
    seoMeta: number
    seoHeadings: number
    seoImages: number
    seoLinks: number
    seoMobile: number
    seoPerformance: number
    seoOverall: number
    overall: number
  }
  improvements: any[]
  questions: any
  seo: SEOAnalysisResult
  scoreBreakdowns?: any
  details: any
  usage: any
}