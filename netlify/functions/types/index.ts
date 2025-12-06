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

export interface LLMEvaluationResult {
  aiCitation: {
    score: number
    comment: string
  }
  questions: QuestionsEvaluation
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
  }
  eeat: {
    score: number
    strengths: string[]
    weaknesses: string[]
  }
  improvements: Improvement[]
}
