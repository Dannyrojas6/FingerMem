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
  it('应该渲染所有 10 个场景卡片', () => {
    renderSceneList()

    // 检查标题
    expect(screen.getByText('基础英语 850 · 请选择一个场景')).toBeInTheDocument()

    // 检查是否有 10 个卡片链接
    const links = screen.getAllByRole('link')
    // 10 个场景卡片 + 可能的其他链接
    const sceneCards = links.filter(link => link.getAttribute('href')?.startsWith('/scene/'))
    expect(sceneCards).toHaveLength(10)
  })

  it('应该显示正确的场景名称', () => {
    renderSceneList()

    expect(screen.getByText('日常对话')).toBeInTheDocument()
    expect(screen.getByText('餐厅点餐')).toBeInTheDocument()
    expect(screen.getByText('购物')).toBeInTheDocument()
    expect(screen.getByText('旅行')).toBeInTheDocument()
    expect(screen.getByText('工作场合')).toBeInTheDocument()
    expect(screen.getByText('家庭生活')).toBeInTheDocument()
    expect(screen.getByText('健康医疗')).toBeInTheDocument()
    expect(screen.getByText('天气')).toBeInTheDocument()
    expect(screen.getByText('时间与日期')).toBeInTheDocument()
    expect(screen.getByText('地点与方向')).toBeInTheDocument()
  })

  it('卡片应该链接到对应场景的第一句练习', () => {
    renderSceneList()

    const dailyLifeLink = screen.getByRole('link', { name: /日常对话/ })
    expect(dailyLifeLink).toHaveAttribute('href', '/scene/daily-life')

    const restaurantLink = screen.getByRole('link', { name: /餐厅点餐/ })
    expect(restaurantLink).toHaveAttribute('href', '/scene/restaurant')
  })

  it('每个卡片都应该显示句子数量', () => {
    renderSceneList()

    // 所有卡片都应该显示 "10 个句子 · 点击开始练习"
    const sentenceCounts = screen.getAllByText('10 个句子 · 点击开始练习')
    expect(sentenceCounts).toHaveLength(10)
  })

  it('底部应该有正确的提示文字', () => {
    renderSceneList()

    expect(
      screen.getByText('点击卡片查看场景内容，可选择单个句子练习或连续练习整个场景。')
    ).toBeInTheDocument()
  })
})
