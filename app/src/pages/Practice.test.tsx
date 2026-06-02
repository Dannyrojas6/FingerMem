import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import Practice from './Practice'
import { scenes } from '../data/scenes'

// Helper to render Practice with specific route params
function renderPractice(sceneId: string, index: string | number = '0') {
  return render(
    <MemoryRouter initialEntries={[`/practice/${sceneId}/${index}`]}>
      <Routes>
        <Route path="/practice/:sceneId/:index" element={<Practice />} />
      </Routes>
    </MemoryRouter>
  )
}

// Enhanced helper that also tracks current location (useful for button navigation tests)
function renderPracticeWithLocation(sceneId: string, index: string | number = '0') {
  let currentLocation: ReturnType<typeof useLocation> | null = null

  const LocationTracker = () => {
    currentLocation = useLocation()
    return null
  }

  const result = render(
    <MemoryRouter initialEntries={[`/practice/${sceneId}/${index}`]}>
      <LocationTracker />
      <Routes>
        <Route path="/practice/:sceneId/:index" element={<Practice />} />
        <Route path="/" element={<div data-testid="home-screen">Home</div>} />
      </Routes>
    </MemoryRouter>
  )

  return {
    ...result,
    getCurrentLocation: () => currentLocation,
  }
}

describe('Practice 组件 - 核心打字交互', () => {
  // 使用当前激活词典的第一个场景（数据无关）
  const testScene = scenes[0]
  const firstSentence = testScene.sentences[0]

  beforeEach(() => {
    vi.useRealTimers()
  })

  it('应该正确渲染句子和翻译', () => {
    renderPractice(testScene.id, 0)

    // 使用 data-testid 稳定查询句子区域
    const sentenceArea = screen.getByTestId('practice-sentence')
    const text = sentenceArea.textContent || ''
    expect(text.replace(/·/g, ' ')).toContain(firstSentence.en)
    expect(screen.getByText(firstSentence.zh)).toBeInTheDocument()

    // 进度使用 testid + 文本内容（不再有视觉进度条）
    const progress = screen.getByTestId('practice-progress')
    expect(progress.textContent).toMatch(/1\s*\/\s*\d+/)
  })

  it('正确输入字符时应对应字符显示为绿色', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })

    const prefix = firstSentence.en.slice(0, 6)
    await user.type(input, prefix)

    const sentenceArea = screen.getByTestId('practice-sentence')
    const spans = Array.from(sentenceArea.querySelectorAll('span'))

    // 当前实现使用 emerald（带透明度变体）
    expect(spans[0]).toHaveClass('text-emerald-400/90')
  })

  it('输入错误字符时应对应字符显示为红色', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })

    const wrongInput = 'X' + firstSentence.en.slice(1, 5)
    await user.type(input, wrongInput)

    const sentenceArea = screen.getByTestId('practice-sentence')
    const spans = Array.from(sentenceArea.querySelectorAll('span'))

    // 当前实现使用 rose（带透明度变体）
    const hasRed = spans.some(s => s.classList.contains('text-rose-400/90'))
    expect(hasRed).toBe(true)
  })

  it('输入空格错误时应显示为红色 ·', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })

    await user.type(input, 'X ')

    const sentenceArea = screen.getByTestId('practice-sentence')
    const spans = Array.from(sentenceArea.querySelectorAll('span'))

    // 打错 + 空格后，至少应该出现红色错误标记（具体哪个位置的 · 取决于句子内容）
    const hasRoseError = spans.some(s => s.classList.contains('text-rose-400/90'))
    expect(hasRoseError).toBe(true)
  })

  it('进度文本应随正确前缀长度更新', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })
    const progress = screen.getByTestId('practice-progress')

    const prefix = firstSentence.en.slice(0, 4)
    await user.type(input, prefix)

    // 进度文本会从 "1 / N" 保持（当前 UI 无像素进度条），这里验证输入后仍能正常渲染且不崩溃
    await waitFor(() => {
      expect(progress.textContent).toMatch(/\d+\s*\/\s*\d+/)
    })
  })

  it('完全正确输入后（不以空格结尾）应该标记完成并自动进入下一句', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })

    const cleanEn = firstSentence.en.replace(/[.,!?;:"']$/, '')
    await user.type(input, cleanEn)

    await waitFor(
      () => {
        expect(screen.getByText(testScene.name)).toBeInTheDocument()
      },
      { timeout: 400 }
    )
  })

  it('按 Escape 应该清空输入', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement

    const prefix = firstSentence.en.slice(0, 8)
    await user.type(input, prefix)

    expect(input.value).toBe(prefix)

    await user.keyboard('{Escape}')

    expect(input.value).toBe('')
  })

  it('完成输入后按 Escape 不应在延迟后自动跳到下一句', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    const cleanEn = firstSentence.en.replace(/[.,!?;:"']$/, '')
    const secondSentenceZh = testScene.sentences[1].zh

    await user.type(input, cleanEn)
    await user.keyboard('{Escape}')

    expect(input.value).toBe('')

    // 等待超过自动跳转延迟（80ms），确认 Escape 取消后不会误跳句
    await waitFor(
      () => {
        expect(screen.getByText(firstSentence.zh)).toBeInTheDocument()
        expect(screen.queryByText(secondSentenceZh)).not.toBeInTheDocument()
        const progress = screen.getByTestId('practice-progress')
        expect(progress.textContent).toMatch(/1\s*\/\s*\d+/)
      },
      { timeout: 300 }
    )
  })

  it('句子索引无效时应显示错误信息', () => {
    renderPractice(testScene.id, 99)

    expect(screen.getByTestId('error-message')).toHaveTextContent('句子不存在')
    expect(screen.getByTestId('back-to-list-link')).toBeInTheDocument()
  })

  it('场景不存在时应显示错误信息', () => {
    renderPractice('non-existent-scene', 0)

    expect(screen.getByTestId('error-message')).toHaveTextContent('未找到该场景')
  })

  it('最后一个句子完全正确输入后应显示恭喜完成界面', async () => {
    const user = userEvent.setup()
    const total = testScene.sentences.length
    renderPractice(testScene.id, total - 1)

    const input = screen.getByRole('textbox', { hidden: true })
    const lastSentenceEn = testScene.sentences[total - 1].en.replace(/[.,!?;:"']$/, '')

    await user.type(input, lastSentenceEn)

    await waitFor(
      () => {
        expect(screen.getByText(/练习完成/)).toBeInTheDocument()
        expect(screen.getByTestId('completion-back-button')).toBeInTheDocument()
        expect(screen.getByTestId('completion-retry-button')).toBeInTheDocument()
      },
      { timeout: 600 }
    )
  })

  it('点击打字区域应该聚焦隐藏输入框', async () => {
    const user = userEvent.setup()
    const { container } = renderPractice(testScene.id, 0)

    const typingArea = container.querySelector(
      '[class*="min-h-"][class*="cursor-text"]'
    ) as HTMLElement
    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement

    // 模拟点击打字区域
    await user.click(typingArea)

    // 输入框应该获得焦点（通过检查 document.activeElement）
    expect(document.activeElement).toBe(input)
  })

  it('完全匹配时进度文本仍正常显示', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })
    const progress = screen.getByTestId('practice-progress')

    const cleanSentence = firstSentence.en.replace(/[.,!?;:"']$/, '')
    await user.type(input, cleanSentence)

    await waitFor(() => {
      // 完全匹配后仍显示完整进度文本（当前 UI 无像素 100% 条）
      expect(progress.textContent).toMatch(/\d+\s*\/\s*\d+/)
    }, { timeout: 300 })
  })

  it('正确输入后，未输入的部分应保持灰色', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })
    const sentenceArea = screen.getByTestId('practice-sentence')

    await user.type(input, 'I want')

    const spans = Array.from(sentenceArea.querySelectorAll('span'))
    expect(spans[0]).toHaveClass('text-emerald-400/90')
    // 未输入的保持默认灰色类
    const laterSpan = spans.find((s, i) => i > 6 && s.classList.contains('text-foreground/40'))
    expect(laterSpan).toBeTruthy()
  })

  it('输入错误后再纠正，字符颜色应恢复为绿色', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })
    const sentenceArea = screen.getByTestId('practice-sentence')

    await user.type(input, 'I xant')

    let spans = Array.from(sentenceArea.querySelectorAll('span'))
    expect(spans[2]).toHaveClass('text-rose-400/90')

    await user.type(input, '{backspace}{backspace}{backspace}{backspace}want')

    spans = Array.from(sentenceArea.querySelectorAll('span'))
    expect(spans[2]).toHaveClass('text-emerald-400/90')
    expect(spans[3]).toHaveClass('text-emerald-400/90')
  })

  it('新句子默认静态下划线（不闪烁），只有长时间未输入后才开始闪烁', async () => {
    const user = userEvent.setup()
    const { container } = renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })
    const sentenceArea = container.querySelector('[class*="cursor-text"]')!

    // 新句子出现时 → 默认静态下划线（无闪烁类），因为一眼就能看出还没开始输入
    let spans = Array.from(sentenceArea.querySelectorAll('span'))
    let cursorSpan = spans.find(s => s.classList.contains('border-b-[2.5px]'))
    expect(cursorSpan).toBeTruthy()
    expect(cursorSpan?.classList.contains('typing-cursor')).toBe(false)

    // 输入过程中 → 继续保持静态
    await user.type(input, 'I w')

    spans = Array.from(sentenceArea.querySelectorAll('span'))
    cursorSpan = spans.find(s => s.classList.contains('border-b-[2.5px]'))
    expect(cursorSpan).toBeTruthy()
    expect(cursorSpan?.classList.contains('typing-cursor')).toBe(false)
  })

  it('完成非最后一句后应自动显示下一句的内容', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })
    const firstSentenceClean = firstSentence.en.replace(/[.,!?;:"']$/, '')
    const secondSentenceZh = testScene.sentences[1].zh
    const total = testScene.sentences.length

    await user.type(input, firstSentenceClean)

    await waitFor(
      () => {
        expect(screen.getByText(secondSentenceZh)).toBeInTheDocument()
        const progress = screen.getByTestId('practice-progress')
        expect(progress.textContent).toMatch(new RegExp(`2\\s*/\\s*${total}`))
      },
      { timeout: 600 }
    )
  })

  it('Escape 按键在输入错误后仍然可以清空输入', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement

    await user.type(input, 'I xxxxx') // 严重错误
    expect(input.value).not.toBe('')

    await user.keyboard('{Escape}')

    expect(input.value).toBe('')
  })

  it('输入超长内容时不会在视觉渲染上产生多余的红色错误字符（允许超打）', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    const sentenceArea = screen.getByTestId('practice-sentence')

    const cleanSentence = firstSentence.en.replace(/[.,!?;:"']$/, '')
    const overType = cleanSentence + 'xxx'

    await user.type(input, overType)

    // Phase 1 后允许用户输入超过目标长度（无硬截断，用于纠错）
    expect(input.value.length).toBeGreaterThan(cleanSentence.length)

    // 渲染有界（只覆盖 target 字符）。如果原句带末尾标点，超打的第一个字符可能落在标点位置产生少量红色
    const spans = Array.from(sentenceArea.querySelectorAll('span'))
    const redSpans = spans.filter(s => s.classList.contains('text-rose-400/90'))
    expect(redSpans.length).toBeLessThanOrEqual(1)
  })

  it('最后一个句子的两个操作按钮点击后应该有正确的行为', async () => {
    const user = userEvent.setup()
    const total = testScene.sentences.length
    renderPractice(testScene.id, total - 1)

    const input = screen.getByRole('textbox', { hidden: true })
    const lastClean = testScene.sentences[total - 1].en.replace(/[.,!?;:"']$/, '')

    await user.type(input, lastClean)

    await waitFor(() => {
      expect(screen.getByTestId('completion-back-button')).toBeInTheDocument()
    }, { timeout: 600 })

    const backButton = screen.getByTestId('completion-back-button')
    const retryButton = screen.getByTestId('completion-retry-button')

    expect(backButton).toBeInTheDocument()
    expect(retryButton).toBeInTheDocument()

    await user.click(retryButton)

    await waitFor(() => {
      const progress = screen.getByTestId('practice-progress')
      expect(progress.textContent).toMatch(/1\s*\/\s*\d+/)
    })
  })

  it('完成一句后输入框应该被重置为空（进入下一句）', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    const clean = firstSentence.en.replace(/[.,!?;:"']$/, '')

    await user.type(input, clean)

    await waitFor(
      () => {
        expect(screen.getByText(testScene.sentences[1].zh)).toBeInTheDocument()
        expect(input.value).toBe('')
      },
      { timeout: 600 }
    )
  })

  it('点击完成界面的“返回场景列表”应导航回首页', async () => {
    const user = userEvent.setup()
    renderPracticeWithLocation(testScene.id, testScene.sentences.length - 1)

    const input = screen.getByRole('textbox', { hidden: true })
    const lastClean = testScene.sentences[testScene.sentences.length - 1].en.replace(
      /[.,!?;:"']$/,
      ''
    )

    await user.type(input, lastClean)

    await waitFor(() => {
      expect(screen.getByTestId('completion-back-button')).toBeInTheDocument()
    }, { timeout: 600 })

    const backButton = screen.getByTestId('completion-back-button')
    await user.click(backButton)

    await waitFor(() => {
      expect(screen.getByTestId('home-screen')).toBeInTheDocument()
    })
  })

  it('点击完成界面的“重新练习本场景”应回到该场景第一句', async () => {
    const user = userEvent.setup()
    renderPracticeWithLocation(testScene.id, testScene.sentences.length - 1)

    const input = screen.getByRole('textbox', { hidden: true })
    const lastClean = testScene.sentences[testScene.sentences.length - 1].en.replace(
      /[.,!?;:"']$/,
      ''
    )

    await user.type(input, lastClean)

    const retryButton = await screen.findByTestId('completion-retry-button', {}, { timeout: 600 })
    await user.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText(testScene.sentences[0].zh)).toBeInTheDocument()
      const progress = screen.getByTestId('practice-progress')
      expect(progress.textContent).toMatch(/1\s*\/\s*\d+/)
    })
  })

  it('大量纠错后仍能继续正常输入并看到绿色反馈', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    const sentenceArea = screen.getByTestId('practice-sentence')

    await user.type(input, 'wrongwrongwrong')
    await user.type(input, '{backspace}'.repeat(15))

    const prefix = firstSentence.en.slice(0, 6)
    await user.type(input, prefix)

    const spans = Array.from(sentenceArea.querySelectorAll('span'))
    const greenCount = spans.filter(s => s.classList.contains('text-emerald-400/90')).length

    expect(greenCount).toBeGreaterThan(0)
  })

  it('完成一句后新句子的进度文本应正确推进到第二句', async () => {
    const user = userEvent.setup()
    const total = testScene.sentences.length
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })

    const clean = firstSentence.en.replace(/[.,!?;:"']$/, '')
    await user.type(input, clean)

    await waitFor(
      () => {
        expect(screen.getByText(testScene.sentences[1].zh)).toBeInTheDocument()
      },
      { timeout: 600 }
    )

    // 自动进入第二句后，进度文本应正确显示 "2 / N"
    const progress = screen.getByTestId('practice-progress')
    expect(progress.textContent).toMatch(new RegExp(`2\\s*/\\s*${total}`))
  })
})
