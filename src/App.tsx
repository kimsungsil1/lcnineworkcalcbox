import { useState } from 'react'
import './App.css'
import { useAuth } from './app/AuthProvider'
import BasicCalculator from './features/basic-calculator/BasicCalculator'
import PercentCalculator from './features/percent-calculator/PercentCalculator'
import DateCalculator from './features/date-calculator/DateCalculator'
import UnitConverter from './features/unit-converter/UnitConverter'
import FxCalculator from './features/fx-calculator/FxCalculator'
import HistoryPanel from './features/history/HistoryPanel'
import { useHistory } from './features/history/useHistory'
import type { HistoryItem } from './features/history/types'

const TABS = [
  { id: 'basic', label: '기본 계산기' },
  { id: 'percent', label: '퍼센트' },
  { id: 'date', label: '날짜' },
  { id: 'unit', label: '단위 변환' },
  { id: 'fx', label: '환율' },
  { id: 'history', label: '기록' },
] as const

export default function App() {
  const { user, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('basic')
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null)
  const history = useHistory(user)

  if (loading) {
    return <div className="app-loading">불러오는 중…</div>
  }

  const handleSelectHistory = (item: HistoryItem) => {
    setSelectedHistory(item)
    if (activeTab !== 'history') {
      setActiveTab(item.type)
    }
  }

  const toolProps = {
    onAddHistory: history.addHistory,
    selectedHistory,
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>LCNine 업무 계산기</h1>
          <p>실무 계산을 빠르게 처리하고 기록합니다.</p>
        </div>
        <div className="user-info">
          <div className="user-email">
            {user?.email ?? user?.displayName ?? '비회원 모드'}
          </div>
          {user ? (
            <button type="button" onClick={() => signOut()}>
              로그아웃
            </button>
          ) : (
            <span className="user-hint">로그인 없이 사용 중</span>
          )}
        </div>
      </header>

      <nav className="app-tabs" aria-label="도구 탭">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="app-content">
        <main className="main-panel">
          {activeTab === 'basic' && <BasicCalculator {...toolProps} />}
          {activeTab === 'percent' && <PercentCalculator {...toolProps} />}
          {activeTab === 'date' && <DateCalculator {...toolProps} />}
          {activeTab === 'unit' && <UnitConverter {...toolProps} />}
          {activeTab === 'fx' && (
            <FxCalculator user={user} {...toolProps} />
          )}
          {activeTab === 'history' && (
            <HistoryPanel
              items={history.items}
              loading={history.loading}
              hasMore={history.hasMore}
              onLoadMore={history.loadMore}
              onSelect={handleSelectHistory}
            />
          )}
        </main>

        <aside className="history-aside">
          <HistoryPanel
            items={history.items}
            loading={history.loading}
            hasMore={history.hasMore}
            onLoadMore={history.loadMore}
            onSelect={handleSelectHistory}
          />
        </aside>
      </div>
    </div>
  )
}
