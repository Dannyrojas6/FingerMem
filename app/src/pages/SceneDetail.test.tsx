import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SceneDetail from './SceneDetail'
import { scenes } from '../data/scenes'

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
    // 使用当前激活词典的第一个场景（数据无关）
    const firstScene = scenes[0]
    renderSceneDetail(firstScene.id)

    expect(screen.getByTestId('scene-name')).toHaveTextContent(firstScene.name)
    expect(screen.getByTestId('start-practice-button')).toBeInTheDocument()
    expect(screen.getAllByTestId('sentence-item').length).toBeGreaterThan(0)
  })

  it('无效场景会显示错误提示', () => {
    renderSceneDetail('non-existent-scene')

    expect(screen.getByTestId('error-message')).toHaveTextContent('未找到该场景的练习内容')
    expect(screen.getByTestId('back-to-list-link')).toBeInTheDocument()
  })
})
