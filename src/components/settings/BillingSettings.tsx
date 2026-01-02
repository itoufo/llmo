import { CreditCard, TrendingUp, Activity } from 'lucide-react'

interface Props {
  tenant: any
}

export function BillingSettings({ tenant }: Props) {
  const planDetails = {
    free: { name: 'フリープラン', limit: 100, price: 0 },
    basic: { name: 'ベーシックプラン', limit: 1000, price: 2980 },
    pro: { name: 'プロプラン', limit: 5000, price: 9800 },
    enterprise: { name: 'エンタープライズ', limit: -1, price: null }
  }

  const currentPlan = planDetails[tenant?.plan as keyof typeof planDetails] || planDetails.free
  const usage = 42 // 実際は使用量をDBから取得

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">利用状況と料金</h3>
        
        {/* 現在のプラン */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {currentPlan.name}
              </h4>
              {currentPlan.price !== null && (
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  ¥{currentPlan.price.toLocaleString()}/月
                </p>
              )}
            </div>
            <CreditCard className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* 利用状況 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">今月の利用状況</h4>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">解析回数</span>
              <span className="font-medium">
                {usage} / {currentPlan.limit === -1 ? '無制限' : currentPlan.limit}
              </span>
            </div>
            {currentPlan.limit !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((usage / currentPlan.limit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
          
          {currentPlan.limit !== -1 && usage >= currentPlan.limit * 0.8 && (
            <div className="bg-amber-50 text-amber-700 p-3 rounded-md text-sm">
              利用上限に近づいています。プランのアップグレードをご検討ください。
            </div>
          )}
        </div>

        {/* プランアップグレード */}
        {tenant?.plan !== 'enterprise' && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h4 className="font-medium text-gray-900">プランをアップグレード</h4>
            </div>
            
            <div className="grid gap-4">
              {Object.entries(planDetails).map(([key, plan]) => {
                if (key === tenant?.plan || key === 'free') return null
                
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-gray-900">{plan.name}</h5>
                        <p className="text-sm text-gray-600 mt-1">
                          月間 {plan.limit === -1 ? '無制限' : `${plan.limit}回`} まで解析可能
                        </p>
                      </div>
                      {plan.price !== null ? (
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ¥{plan.price.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">/月</p>
                        </div>
                      ) : (
                        <button className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800">
                          お問い合わせ
                        </button>
                      )}
                    </div>
                    {plan.price !== null && (
                      <button className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        このプランにアップグレード
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}