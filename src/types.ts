export interface AnalyzeRequest {
  url: string
}

export interface Improvement {
  priority: 'high' | 'medium' | 'low'
  category: 'structure' | 'content' | 'eeat' | 'question' | 'concept'
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

export interface AnalyzeResult {
  url: string
  scores: {
    aiCitation: number
    questionFit: number
    coverage: number
    structure: number
    eeat: number
    overall: number
  }
  improvements: Improvement[]
  questions: QuestionsEvaluation
  details?: {
    aiCitationComment?: string
    missingConcepts?: string[]
    coveredConcepts?: string[]
    structureIssues?: string[]
    eeatStrengths?: string[]
    eeatWeaknesses?: string[]
  }
}
