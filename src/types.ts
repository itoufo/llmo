export interface AnalyzeRequest {
  url: string
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
  improvements: string[]
  details?: {
    questions?: string[]
    missingConcepts?: string[]
  }
}
