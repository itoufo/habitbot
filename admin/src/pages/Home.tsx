import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          HabitLine Admin Dashboard
        </h1>

        <div className="text-center mb-12">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
          >
            ダッシュボードを開く →
          </Link>
        </div>

        <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left gap-4">
          <Link to="/dashboard">
            <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 cursor-pointer">
              <h2 className="mb-3 text-2xl font-semibold">
                ユーザー管理
              </h2>
              <p className="m-0 max-w-[30ch] text-sm opacity-50">
                登録ユーザーの一覧と統計情報を表示
              </p>
            </div>
          </Link>

          <Link to="/dashboard">
            <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 cursor-pointer">
              <h2 className="mb-3 text-2xl font-semibold">
                習慣分析
              </h2>
              <p className="m-0 max-w-[30ch] text-sm opacity-50">
                習慣の達成率や継続率を可視化
              </p>
            </div>
          </Link>

          <Link to="/dashboard">
            <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 cursor-pointer">
              <h2 className="mb-3 text-2xl font-semibold">
                通知管理
              </h2>
              <p className="m-0 max-w-[30ch] text-sm opacity-50">
                リマインドの送信履歴と失敗キュー
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-600">
            続ける力を、設計で支える。
          </p>
        </div>
      </div>
    </main>
  )
}
