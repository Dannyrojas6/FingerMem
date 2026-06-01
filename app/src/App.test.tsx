import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
    expect(screen.getByText('基础英语 850 · 请选择一个场景')).toBeInTheDocument()
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
