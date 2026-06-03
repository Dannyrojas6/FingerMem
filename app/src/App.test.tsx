import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { scenes } from './data/scenes'

describe('App 路由烟雾测试', () => {
  it('默认路由能正常渲染场景列表', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByTestId('scene-picker-page')).toBeInTheDocument()
    expect(screen.getByTestId('scene-wheel')).toBeInTheDocument()
  })

  it('访问场景详情页能正常渲染', () => {
    const firstSceneId = scenes[0]?.id || 'daily-life'
    render(
      <MemoryRouter initialEntries={[`/scene/${firstSceneId}`]}>
        <App />
      </MemoryRouter>
    )
    // 至少能渲染出场景名称或练习入口（数据无关）
    expect(
      screen.queryByText(scenes[0]?.name || '') || screen.queryByText(/开始练习|开始连续练习|练习/)
    ).toBeTruthy()
  })

  it('练习页顶栏仅展示 Logo，点击 Logo 返回场景选择首页', async () => {
    const user = userEvent.setup()
    const sceneId = scenes[0]?.id
    if (!sceneId) return

    render(
      <MemoryRouter initialEntries={[`/practice/${sceneId}/0`]}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByTestId('app-brand')).toBeInTheDocument()
    expect(screen.getByTestId('practice-page')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '返回' })).not.toBeInTheDocument()

    await user.click(screen.getByTestId('app-brand'))
    expect(screen.getByTestId('scene-picker-page')).toBeInTheDocument()
  })

  it('应用整体不会崩溃（烟雾测试）', () => {
    render(
      <MemoryRouter initialEntries={['/some-invalid-path']}>
        <App />
      </MemoryRouter>
    )
    // 只要能渲染出根容器就算通过
    expect(document.body).toBeInTheDocument()
  })
})
