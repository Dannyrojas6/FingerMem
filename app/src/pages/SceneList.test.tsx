import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import SceneList from './SceneList'
import { scenes } from '../data/scenes'

function renderSceneList() {
  const router = createMemoryRouter(
    [
      { path: '/', element: <SceneList /> },
      { path: '/practice/:sceneId/:index', element: <div data-testid="practice-page" /> },
    ],
    { initialEntries: ['/'] }
  )
  render(<RouterProvider router={router} />)
  return router
}

function getActiveWheelItem(testId: string) {
  const items = screen.getAllByTestId(testId)
  const active = items.find(el => el.getAttribute('aria-selected') === 'true')
  if (!active) throw new Error(`No active item in ${testId}`)
  return active
}

describe('SceneList 组件', () => {
  it('应该能渲染场景滚轮', () => {
    renderSceneList()

    expect(screen.getByTestId('scene-wheel')).toBeInTheDocument()
    const items = screen.getAllByTestId('scene-wheel-item')
    expect(items.length).toBeGreaterThan(0)
    expect(screen.queryByTestId('scene-list-title')).not.toBeInTheDocument()
    expect(screen.queryByTestId('scene-list-continue')).not.toBeInTheDocument()
  })

  it('点击当前场景应在同页展开句子滚轮', async () => {
    const user = userEvent.setup()
    renderSceneList()

    await user.click(getActiveWheelItem('scene-wheel-item'))

    expect(screen.getByTestId('sentence-wheel')).toBeVisible()
    expect(screen.getAllByTestId('sentence-item').length).toBeGreaterThan(0)
  })

  it('点击当前句子应进入练习页', async () => {
    const user = userEvent.setup()
    const router = renderSceneList()
    const firstScene = scenes[0]

    await user.click(getActiveWheelItem('scene-wheel-item'))
    await user.click(getActiveWheelItem('sentence-item'))

    expect(router.state.location.pathname).toBe(`/practice/${firstScene.id}/0`)
    expect(screen.getByTestId('practice-page')).toBeInTheDocument()
  })

  it('滚轮项应显示句子数量', () => {
    renderSceneList()

    const sceneWheel = screen.getByTestId('scene-wheel')
    const sentenceInfo = within(sceneWheel).getAllByText(/\d+\s*句/)
    expect(sentenceInfo.length).toBeGreaterThan(0)
  })

  it('场景序号与名称之间为空格而非间隔号', () => {
    renderSceneList()
    const firstScene = scenes[0]
    const order = firstScene.id.match(/^(\d+)-/)?.[1]?.padStart(2, '0')
    expect(order).toBeTruthy()
    expect(screen.getByText(`${order} ${firstScene.name}`)).toBeInTheDocument()
  })

  it('句子选择时点击返回箭头应回到仅场景选择', async () => {
    const user = userEvent.setup()
    renderSceneList()

    await user.click(getActiveWheelItem('scene-wheel-item'))
    expect(screen.getByTestId('sentence-wheel')).toBeVisible()

    await user.click(screen.getByTestId('scene-picker-back'))

    const back = screen.getByTestId('scene-picker-back')
    expect(back).toHaveAttribute('aria-hidden', 'true')
    expect(document.querySelector('.scene-picker-layout')).toHaveAttribute('data-split', 'false')
  })
})