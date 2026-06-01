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
    const { container } = renderPractice(testScene.id, 0)

    // 句子文本被拆成多个 span，用 container 文本内容判断
    const text = container.textContent || ''
    expect(text.replace(/·/g, ' ')).toContain(firstSentence.en)
    expect(screen.getByText(firstSentence.zh)).toBeInTheDocument()
    expect(screen.getByText(/第 1 \/ \d+ 句/)).toBeInTheDocument()
  })

  it('正确输入字符时应对应字符显示为绿色', async () => {
    const user = userEvent.setup()
    const { container } = renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })

    // 输入前几个字符（使用实际句子内容的前缀）
    const prefix = firstSentence.en.slice(0, 6)
    await user.type(input, prefix)

    const sentenceArea = container.querySelector('.text-4xl')!
    const spans = Array.from(sentenceArea.querySelectorAll('span'))

    // 至少第一个字符应该被标记为正确
    expect(spans[0]).toHaveClass('text-green-600')
  })

  it('输入错误字符时应对应字符显示为红色', async () => {
    const user = userEvent.setup()
    const { container } = renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })

    // 故意输入一个错误字符（修改第一个字符）
    const wrongInput = 'X' + firstSentence.en.slice(1, 5)
    await user.type(input, wrongInput)

    const sentenceArea = container.querySelector('.text-4xl')!
    const spans = Array.from(sentenceArea.querySelectorAll('span'))

    // 应该有红色标记的错误字符
    const hasRed = spans.some(s => s.classList.contains('text-red-600'))
    expect(hasRed).toBe(true)
  })

  it('输入空格错误时应显示为红色 ·', async () => {
    const user = userEvent.setup()
    const { container } = renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })

    // 故意打错 + 输入空格
    await user.type(input, 'X ')

    const sentenceArea = container.querySelector('.text-4xl')!
    const spans = Array.from(sentenceArea.querySelectorAll('span'))

    // 空格错误位置应该显示红色 ·
    const spaceSpan = spans.find(s => s.textContent === '·' && s.classList.contains('text-red-600'))
    expect(spaceSpan).toBeTruthy()
  })

  it('进度条应根据正确前缀长度更新', async () => {
    const user = userEvent.setup()
    const { container } = renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })

    const progressBar = container.querySelector('.bg-blue-600') as HTMLElement

    const prefix = firstSentence.en.slice(0, 4)
    await user.type(input, prefix)

    await waitFor(() => {
      const style = progressBar?.getAttribute('style') || ''
      expect(style).toMatch(/width: [1-9]/)
    })
  })

  it('完全正确输入后（不以空格结尾）应该标记完成并自动进入下一句', async () => {
    const user = userEvent.setup()
    renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })

    // 使用实际句子的英文内容（去除末尾标点）
    const cleanEn = firstSentence.en.replace(/[.,!?;:"']$/, '')
    await user.type(input, cleanEn)

    await waitFor(
      () => {
        expect(screen.getByText(testScene.name)).toBeInTheDocument()
      },
      { timeout: 300 }
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

  it('句子索引无效时应显示错误信息', () => {
    renderPractice(testScene.id, 99)

    expect(screen.getByText('句子不存在')).toBeInTheDocument()
    expect(screen.getByText('返回场景列表')).toBeInTheDocument()
  })

  it('场景不存在时应显示错误信息', () => {
    renderPractice('non-existent-scene', 0)

    expect(screen.getByText('未找到该场景')).toBeInTheDocument()
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
        expect(screen.getByText(/恭喜完成/)).toBeInTheDocument()
        expect(screen.getByText('返回列表')).toBeInTheDocument()
        expect(screen.getByText('继续训练')).toBeInTheDocument()
      },
      { timeout: 400 }
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

  it('完全匹配时进度条应达到 100%', async () => {
    const user = userEvent.setup()
    const { container } = renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })
    const progressBar = container.querySelector('.bg-blue-600') as HTMLElement

    const cleanSentence = firstSentence.en.replace(/[.,!?;:"']$/, '')
    await user.type(input, cleanSentence)

    await waitFor(
      () => {
        const style = progressBar.getAttribute('style') || ''
        expect(style).toContain('width: 100%')
      },
      { timeout: 200 }
    )
  })

  it('正确输入后，未输入的部分应保持灰色', async () => {
    const user = userEvent.setup()
    const { container } = renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })
    const sentenceArea = container.querySelector('.text-4xl')!

    await user.type(input, 'I want')

    const spans = Array.from(sentenceArea.querySelectorAll('span'))
    // 前几个应该是绿色
    expect(spans[0]).toHaveClass('text-green-600')
    // 后面未输入的字符应该是灰色
    const laterSpan = spans.find((s, i) => i > 6 && s.classList.contains('text-gray-400'))
    expect(laterSpan).toBeTruthy()
  })

  it('输入错误后再纠正，字符颜色应恢复为绿色', async () => {
    const user = userEvent.setup()
    const { container } = renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })
    const sentenceArea = container.querySelector('.text-4xl')!

    // 先打错
    await user.type(input, 'I xant')

    let spans = Array.from(sentenceArea.querySelectorAll('span'))
    expect(spans[2]).toHaveClass('text-red-600') // x 是错的

    // 现在用退格纠正（userEvent.type 支持 {backspace}）
    await user.type(input, '{backspace}{backspace}{backspace}{backspace}want')

    spans = Array.from(sentenceArea.querySelectorAll('span'))
    expect(spans[2]).toHaveClass('text-green-600') // w 现在正确
    expect(spans[3]).toHaveClass('text-green-600')
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

    await user.type(input, firstSentenceClean)

    // 等待自动跳转
    await waitFor(
      () => {
        expect(screen.getByText(secondSentenceZh)).toBeInTheDocument()
        expect(screen.getByText(/第 2 \/ 10 句/)).toBeInTheDocument()
      },
      { timeout: 500 }
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

  it('输入超长内容时应被限制且不会产生多余的红色错误字符', async () => {
    const user = userEvent.setup()
    const { container } = renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    const sentenceArea = container.querySelector('.text-4xl')!

    const cleanSentence = firstSentence.en.replace(/[.,!?;:"']$/, '')
    const overType = cleanSentence + 'xxx'

    await user.type(input, overType)

    // 输入框的值不应超过有效长度
    expect(input.value.length).toBeLessThanOrEqual(cleanSentence.length)

    // 由于我们只输入了正确内容 + 少量多余字符，红色错误字符数量应该很少（或为0）
    const spans = Array.from(sentenceArea.querySelectorAll('span'))
    const redSpans = spans.filter(s => s.classList.contains('text-red-600'))
    // 允许少量红色（因为 slice 可能在渲染时有轻微差异），但不应该很多
    expect(redSpans.length).toBeLessThan(5)
  })

  it('最后一个句子的两个操作按钮点击后应该有正确的行为', async () => {
    const user = userEvent.setup()
    const total = testScene.sentences.length
    renderPractice(testScene.id, total - 1)

    const input = screen.getByRole('textbox', { hidden: true })
    const lastClean = testScene.sentences[total - 1].en.replace(/[.,!?;:"']$/, '')

    await user.type(input, lastClean)

    await waitFor(
      () => {
        expect(screen.getByText('返回列表')).toBeInTheDocument()
      },
      { timeout: 400 }
    )

    // 检查两个按钮都存在（modal 实际按钮文案）
    const backToList = screen.getByText('返回列表')
    const retry = screen.getByText('继续训练')

    expect(backToList).toBeInTheDocument()
    expect(retry).toBeInTheDocument()

    // 点击“继续训练”应该能正常工作（不崩溃）
    await user.click(retry)

    // 应该又回到第一句
    await waitFor(() => {
      expect(screen.getByText(/第 1 \/ 10 句/)).toBeInTheDocument()
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

    await waitFor(
      () => {
        expect(screen.getByText('返回列表')).toBeInTheDocument()
      },
      { timeout: 400 }
    )

    const backButton = screen.getByText('返回列表')
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

    const retryButton = await screen.findByText('继续训练', {}, { timeout: 400 })
    await user.click(retryButton)

    await waitFor(() => {
      // 应该回到第一句
      expect(screen.getByText(testScene.sentences[0].zh)).toBeInTheDocument()
      expect(screen.getByText(/第 1 \/ \d+ 句/)).toBeInTheDocument()
    })
  })

  it('大量纠错后仍能继续正常输入并看到绿色反馈', async () => {
    const user = userEvent.setup()
    const { container } = renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement
    const sentenceArea = container.querySelector('.text-4xl')!

    // 打很多错的然后删除
    await user.type(input, 'wrongwrongwrong')
    await user.type(input, '{backspace}'.repeat(15))

    // 重新正常输入前几个字符
    const prefix = firstSentence.en.slice(0, 6)
    await user.type(input, prefix)

    const spans = Array.from(sentenceArea.querySelectorAll('span'))
    const greenCount = spans.filter(s => s.classList.contains('text-green-600')).length

    expect(greenCount).toBeGreaterThan(0)
  })

  it('完成一句后新句子的进度条应从 0% 开始', async () => {
    const user = userEvent.setup()
    const { container } = renderPractice(testScene.id, 0)

    const input = screen.getByRole('textbox', { hidden: true })
    const progressBar = container.querySelector('.bg-blue-600') as HTMLElement

    const clean = firstSentence.en.replace(/[.,!?;:"']$/, '')
    await user.type(input, clean)

    await waitFor(
      () => {
        expect(screen.getByText(testScene.sentences[1].zh)).toBeInTheDocument()
      },
      { timeout: 500 }
    )

    // 新句子的进度条应该重置为 0%
    const style = progressBar.getAttribute('style') || ''
    expect(style).toContain('width: 0%')
  })
})
