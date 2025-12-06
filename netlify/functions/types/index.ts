export interface LLMEvaluationResult {
  aiCitation: {
    score: number
    comment: string
    questions: string[]
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
  }
  eeat: {
    score: number
    strengths: string[]
    weaknesses: string[]
  }
}
