import { SEOAnalysisResult } from './types.ts'

export function createLLMOPrompt(content: string, seoResult: SEOAnalysisResult): string {
  const seoSummary = `
SEO診断結果サマリー:
- タイトルタグ: ${seoResult.title.exists ? `${seoResult.title.content} (${seoResult.title.length}文字)` : '未設定'}
- メタディスクリプション: ${seoResult.meta.description.exists ? `${seoResult.meta.description.length}文字` : '未設定'}
- H1見出し: ${seoResult.headings.h1.count}個
- H2見出し: ${seoResult.headings.h2.count}個  
- 画像数: ${seoResult.images.count}個 (alt属性付き: ${seoResult.images.withAlt}個)
- 内部リンク: ${seoResult.links.internal}個
- 外部リンク: ${seoResult.links.external}個

Advanced SEO診断結果:
${JSON.stringify(seoResult.advancedSeo || {}, null, 2)}
`

  return `あなたはLLMO（LLM最適化）とSEOの専門家です。以下のWebページコンテンツを分析し、LLMが引用・参照しやすいかを評価してください。

# コンテンツ
${content}

${seoSummary}

# 評価項目（各100点満点）

## 1. AI引用スコア
LLMが回答生成時に引用素材として使いやすいか:
- 事実が明確に記載されているか
- 数値データや統計が含まれているか
- 定義や説明が構造化されているか
- 情報の信頼性が示されているか

## 2. 質問適合スコア
ユーザーがこのトピックについて持つであろう質問に答えているか:
- 「〜とは」「〜の方法」「なぜ〜」などの基本的な質問への回答
- How-to情報の充実度
- FAQ的な内容の有無
- 実用的な情報の提供

## 3. 概念カバレッジスコア
トピックに関する重要概念をどれだけカバーしているか:
- 主要な概念の網羅性
- 関連用語の説明
- 包括的な情報提供
- トピックの深さと広さのバランス

## 4. 構造スコア
情報が整理され、LLMが解析しやすい構造か:
- 見出しの階層構造
- リスト形式の活用
- 段落の論理的な流れ
- セクション間の関連性

## 5. E-E-A-Tスコア
- Experience（経験）: 実体験に基づく情報
- Expertise（専門性）: 専門知識の深さ
- Authoritativeness（権威性）: 著者や出典の信頼性
- Trustworthiness（信頼性）: 情報の正確性と更新性

## 6. SEO診断コメント（最重要）
上記のSEO診断結果を踏まえて、以下の観点から総合的にコメントしてください：
- タイトルとメタディスクリプションの改善点
- 見出し構造（H1、H2、H3）の最適化
- 画像のalt属性とSEO効果
- 内部/外部リンクの質と量
- モバイル対応とパフォーマンス
- 専門性、経験、権威性、信頼性
- Advanced SEOの観点から見た技術的な改善点

## 7. Advanced SEOスコアの直接算出（最重要）
**固定IF文は使用せず、以下の基準に基づいてあなたがスコアを直接決定してください。**

### 7-1. 技術的SEO（0-100点）
以下の要素を総合的に判断して点数を決定：
- **Canonical URL（15点配分）**: 存在・正確性・適切性
- **構造化データJSON-LD（15点配分）**: 存在・妥当性・スキーマタイプの適切性  
- **Open Graph（10点配分）**: 完全性・画像設定・説明の質
- **Twitter Card（5点配分）**: 設定有無・カードタイプの適切性
- **SSL/HTTPS（15点配分）**: 有効性・混合コンテンツの有無
- **モバイルビューポート（15点配分）**: 設定有無・レスポンシブ対応
- **その他（25点配分）**: 言語設定、文字コード、robots.txt、サイトマップ等

### 7-2. パフォーマンスSEO（0-100点）
以下の要素を総合的に判断して点数を決定：
- **HTMLサイズ（30点配分）**: 
  - 100KB未満: 満点
  - 100-300KB: 20-25点
  - 300-500KB: 10-20点
  - 500KB超: 0-10点
- **インラインCSS/JS（20点配分）**: 適量なら満点、過剰なら減点
- **外部リンク（25点配分）**: 適切な数とnofollow設定
- **内部リンク（25点配分）**: サイト内導線の質、ブロークンリンクの有無

### 7-3. コンテンツSEO（0-100点）
**コンテキストとトピックを考慮した動的評価：**
- **文字数（40点配分）**: 
  - ニュース記事: 300-800語が適切
  - ブログ記事: 800-2000語が適切
  - 詳細ガイド: 2000語以上が適切
  - トピックの深さと読者層を考慮
- **マルチメディア（20点配分）**: 
  - 画像: コンテンツ量に応じた適切な数
  - 動画: トピックによって必要性を判断
- **構造化（20点配分）**: リスト、テーブル、見出し階層の適切性
- **情報密度（20点配分）**: 無駄な文章がなく、価値ある情報の比率

### 7-4. ユーザー体験（0-100点）
以下の要素を総合的に判断して点数を決定：
- **アクセシビリティ（40点配分）**: ARIA、スキップリンク、フォームラベル
- **ナビゲーション（30点配分）**: パンくず、目次、検索機能の必要性判断
- **読みやすさ（30点配分）**: フォントサイズ、行間、コントラスト等

## 8. 具体的な改善案（最重要）
**LLMO改善案**、**SEO改善案**、**Advanced SEO改善案**を統合して、優先度の高い順に10-15個の改善案を提案：

各改善案には必ず以下を含めること：
- **priority**: "high" / "medium" / "low"
- **category**: "structure" / "content" / "eeat" / "question" / "concept" / "technical-seo" / "content-seo" / "ux-seo"
- **type**: "llmo" / "seo" / "advanced-seo" / "integrated"
- **issue**: 問題点を1文で説明
- **action**: 具体的な改善アクションを1-2文で説明
- **example**: 追加すべき文章やコードの具体例
- **enablesQuestions**: この改善で答えられるようになる質問（1-3個）
- **expectedImpact**: "低い" / "中程度" / "高い" / "非常に高い"

# 出力形式（JSON）

{
  "aiCitation": {
    "score": 数値(0-100),
    "comment": "評価コメント（1-2文）"
  },
  "questions": {
    "answerable": ["現在答えられる質問1", "質問2", ...],
    "partial": [
      {"question": "部分的に答えられる質問", "missing": "不足している情報"}
    ],
    "afterImprovement": ["改善後に答えられる質問1", "質問2", ...]
  },
  "questionFit": {
    "score": 数値(0-100),
    "covered": ["対応できている質問1", "質問2"],
    "missing": ["不足している質問1", "質問2"]
  },
  "coverage": {
    "score": 数値(0-100),
    "covered": ["カバー済み概念1", "概念2"],
    "missing": ["不足概念1", "概念2"]
  },
  "structure": {
    "score": 数値(0-100),
    "issues": ["問題点1", "問題点2"],
    "strengths": ["構造的な強み1", "強み2"]
  },
  "eeat": {
    "score": 数値(0-100),
    "strengths": ["強み1", "強み2"],
    "weaknesses": ["弱み1", "弱み2"]
  },
  "contentQuality": {
    "wordCountEvaluation": {
      "currentLength": 数値,
      "rating": "thin" / "adequate" / "comprehensive" / "excessive",
      "optimalRange": {"min": 数値, "max": 数値},
      "reasoning": "このトピックに最適な文字数範囲の理由",
      "qualityScore": 数値(0-100)
    },
    "informationDensity": {
      "score": 数値(0-100),
      "assessment": "情報密度の評価コメント"
    },
    "uniqueValue": {
      "score": 数値(0-100),
      "uniqueAspects": ["独自性のある要素1", "要素2"]
    }
  },
  "overallScores": {
    "llmoOverall": 数値(0-100),
    "llmoBreakdown": {
      "aiCitation": 数値,
      "questionFit": 数値,
      "coverage": 数値,
      "structure": 数値,
      "eeat": 数値,
      "calculation": "例: (20 + 15 + 18 + 22 + 15) / 5 = 18 → 総合18点",
      "detailCalculation": {
        "aiCitation": {"score": 数値, "max": 100, "weight": 0.2, "weighted": 数値},
        "questionFit": {"score": 数値, "max": 100, "weight": 0.2, "weighted": 数値},
        "coverage": {"score": 数値, "max": 100, "weight": 0.2, "weighted": 数値},
        "structure": {"score": 数値, "max": 100, "weight": 0.2, "weighted": 数値},
        "eeat": {"score": 数値, "max": 100, "weight": 0.2, "weighted": 数値},
        "total": 数値
      }
    },
    "seoOverall": 数値(0-100),
    "seoBreakdown": {
      "title": 数値,
      "meta": 数値,
      "headings": 数値,
      "images": 数値,
      "keywords": 数値,
      "calculation": "例: (80 + 70 + 60 + 50 + 65) / 5 = 65 → 総合65点",
      "detailCalculation": {
        "title": {"score": 数値, "max": 100, "weight": 0.2, "weighted": 数値},
        "meta": {"score": 数値, "max": 100, "weight": 0.2, "weighted": 数値},
        "headings": {"score": 数値, "max": 100, "weight": 0.2, "weighted": 数値},
        "images": {"score": 数値, "max": 100, "weight": 0.2, "weighted": 数値},
        "keywords": {"score": 数値, "max": 100, "weight": 0.2, "weighted": 数値},
        "total": 数値
      }
    },
    "advancedSeoOverall": 数値(0-100),
    "advancedSeoBreakdown": {
      "technical": 数値,
      "performance": 数値,
      "content": 数値,
      "userExperience": 数値,
      "calculation": "例: (75 + 80 + 90 + 70) / 4 = 78.75 → 総合79点",
      "detailCalculation": {
        "technical": {"score": 数値, "max": 100, "weight": 0.25, "weighted": 数値},
        "performance": {"score": 数値, "max": 100, "weight": 0.25, "weighted": 数値},
        "content": {"score": 数値, "max": 100, "weight": 0.25, "weighted": 数値},
        "userExperience": {"score": 数値, "max": 100, "weight": 0.25, "weighted": 数値},
        "total": 数値
      }
    }
  },
  "advancedSeoScores": {
    "technicalSeo": 数値(0-100),
    "performanceSeo": 数値(0-100),
    "contentSeo": 数値(0-100),
    "userExperience": 数値(0-100),
    "wordCountRating": "thin" / "adequate" / "optimal" / "comprehensive",
    "contentReasoning": "コンテンツSEOスコアの詳細根拠（何点配分でどう判断したか）",
    "reasoning": {
      "technical": "技術的SEOスコアの根拠",
      "performance": "パフォーマンスSEOスコアの根拠",
      "content": "コンテンツSEOスコアの根拠（文字数、画像、構造など各要素の配点と判断）",
      "ux": "ユーザー体験スコアの根拠"
    }
  },
  "improvements": [
    {
      "priority": "high",
      "category": "content-seo",
      "type": "integrated",
      "issue": "問題点の説明",
      "action": "具体的な改善アクション",
      "example": "追加すべき文章や見出しの例",
      "enablesQuestions": ["この改善で答えられるようになる質問"],
      "expectedImpact": "非常に高い"
    }
  ]
}
`
}