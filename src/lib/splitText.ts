// Open-source SplitText fallback
// Use when GSAP Club (SplitText) is not available
// Replace: import { SplitText } from 'gsap/SplitText'
// With:    import { splitText } from '@/lib/splitText'

export interface SplitResult {
  chars: HTMLElement[]
  words: HTMLElement[]
  revert: () => void
}

export function splitText(el: HTMLElement): SplitResult {
  const original = el.innerHTML
  const text     = el.textContent ?? ''
  const chars:   HTMLElement[] = []
  const words:   HTMLElement[] = []

  const wordArray = text.split(' ')

  el.innerHTML = wordArray
    .map((word, wi) => {
      const wordSpan        = document.createElement('span')
      wordSpan.style.display    = 'inline-block'
      wordSpan.style.whiteSpace = 'nowrap'

      word.split('').forEach(char => {
        const charSpan            = document.createElement('span')
        charSpan.style.display    = 'inline-block'
        charSpan.textContent      = char
        wordSpan.appendChild(charSpan)
        chars.push(charSpan)
      })

      if (wi < wordArray.length - 1) {
        const space            = document.createElement('span')
        space.style.display    = 'inline-block'
        space.textContent      = '\u00A0'
        wordSpan.appendChild(space)
      }

      words.push(wordSpan)
      return wordSpan.outerHTML
    })
    .join('')

  return {
    chars,
    words,
    revert: () => { el.innerHTML = original },
  }
}
