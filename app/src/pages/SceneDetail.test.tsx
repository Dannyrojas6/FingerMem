import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SceneDetail from './SceneDetail'

function renderSceneDetail(sceneId: string) {
  return render(
    <MemoryRouter initialEntries={[`/scene/${sceneId}`]}>
      <Routes>
        <Route path="/scene/:sceneId" element={<SceneDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('SceneDetail 组件', () => {
  it('有效场景能正常渲染场景名称和练习入口', () => {
    renderSceneDetail('daily-life')

    expect(screen.getByText('日常对话')).toBeInTheDocument()
    // 应该有连续练习入口或单个句子练习按钮
    const hasPracticeEntry =
      screen.queryByText('开始连续练习本场景 →') || screen.queryAllByText('开始练习').length > 0
    expect(hasPracticeEntry).toBeTruthy()
  })

  it('无效场景会显示错误提示', () => {
    renderSceneDetail('non-existent-scene')

    expect(screen.getByText('未找到该场景的练习内容')).toBeInTheDocument()
    expect(screen.getByText('返回场景列表')).toBeInTheDocument()
  })
})
