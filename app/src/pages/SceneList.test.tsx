import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SceneList from './SceneList'

function renderSceneList() {
  return render(
    <MemoryRouter>
      <SceneList />
    </MemoryRouter>
  )
}

describe('SceneList 组件', () => {
  it('应该能渲染场景卡片列表', () => {
    renderSceneList()

    // 至少能渲染出场景卡片（具体数量由当前词典决定）
    const links = screen.getAllByRole('link')
    const sceneCards = links.filter(link => link.getAttribute('href')?.startsWith('/scene/'))
    expect(sceneCards.length).toBeGreaterThan(0)
  })

  it('卡片应该链接到正确的场景详情页', () => {
    renderSceneList()

    const sceneCards = screen.getAllByRole('link').filter(link =>
      link.getAttribute('href')?.startsWith('/scene/')
    )

    // 验证至少有一个卡片链接正确
    expect(sceneCards[0]).toHaveAttribute('href', expect.stringMatching(/^\/scene\//))
  })

  it('卡片应该显示句子数量信息', () => {
    renderSceneList()

    // 验证卡片上显示了句子数量（当前实现是 “N 句”）
    const sentenceInfo = screen.getAllByText(/\d+\s*句/)
    expect(sentenceInfo.length).toBeGreaterThan(0)
  })

})
