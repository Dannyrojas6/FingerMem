/**
 * Copy Latin subsets from fontsource packages into public/fonts for stable dev/prod URLs.
 */
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'fonts')
const geistMonoPkg = join(root, 'node_modules', '@fontsource-variable', 'geist-mono', 'files')
const jakartaPkg = join(root, 'node_modules', '@fontsource', 'plus-jakarta-sans', 'files')

const copies = [
  [join(geistMonoPkg, 'geist-mono-latin-wght-normal.woff2'), 'geist-mono-latin.woff2'],
  [join(jakartaPkg, 'plus-jakarta-sans-latin-400-normal.woff2'), 'plus-jakarta-sans-latin-400.woff2'],
  [join(jakartaPkg, 'plus-jakarta-sans-latin-500-normal.woff2'), 'plus-jakarta-sans-latin-500.woff2'],
  [join(jakartaPkg, 'plus-jakarta-sans-latin-600-normal.woff2'), 'plus-jakarta-sans-latin-600.woff2'],
]

mkdirSync(outDir, { recursive: true })

for (const [src, dest] of copies) {
  copyFileSync(src, join(outDir, dest))
  console.log(`fonts: ${dest}`)
}