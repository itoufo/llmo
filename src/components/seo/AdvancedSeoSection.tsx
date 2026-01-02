import { TechnicalSeoCard } from './TechnicalSeoCard'
import { PerformanceSeoCard } from './PerformanceSeoCard'
import { ContentSeoCard } from './ContentSeoCard'
import { UserExperienceCard } from './UserExperienceCard'

interface AdvancedSeoProps {
  advancedSeo: {
    technicalSeo: { score: number; items: any }
    performanceSeo: { score: number; items: any }
    contentSeo: { score: number; items: any; scoreBreakdown?: any }
    userExperience: { score: number; items: any }
    scoreReasoning?: any
  }
}

export function AdvancedSeoSection({ advancedSeo }: AdvancedSeoProps) {
  if (!advancedSeo) {
    return (
      <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-gray-500 text-center">Advanced SEO診断結果は利用できません</p>
      </div>
    )
  }

  // 総合スコアの計算
  const overallScore = Math.round(
    (advancedSeo.technicalSeo.score +
      advancedSeo.performanceSeo.score +
      advancedSeo.contentSeo.score +
      advancedSeo.userExperience.score) / 4
  )

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
        <span className="flex items-center">
          <span className="mr-2">🚀</span>
          Advanced SEO診断
        </span>
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          総合スコア: {overallScore}点
        </span>
      </h3>
      
      <div className="grid gap-6">
        <TechnicalSeoCard 
          technicalSeo={advancedSeo.technicalSeo}
          scoreReasoning={advancedSeo.scoreReasoning}
        />
        
        <PerformanceSeoCard 
          performanceSeo={advancedSeo.performanceSeo}
          scoreReasoning={advancedSeo.scoreReasoning}
        />
        
        <ContentSeoCard 
          contentSeo={advancedSeo.contentSeo}
        />
        
        <UserExperienceCard 
          userExperience={advancedSeo.userExperience}
          scoreReasoning={advancedSeo.scoreReasoning}
        />
      </div>
    </div>
  )
}