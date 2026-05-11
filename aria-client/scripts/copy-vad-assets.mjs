import { mkdirSync, copyFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const dest = 'public/vad'
mkdirSync(dest, { recursive: true })

const copies = [
  ['node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js', `${dest}/vad.worklet.bundle.min.js`],
  ['node_modules/@ricky0123/vad-web/dist/silero_vad_v5.onnx', `${dest}/silero_vad_v5.onnx`],
]

for (const [src, dst] of copies) {
  if (!existsSync(src)) {
    console.error(`[copy-vad-assets] missing ${src}`)
    process.exit(1)
  }
  copyFileSync(src, dst)
}

const ortDir = 'node_modules/onnxruntime-web/dist'
for (const f of readdirSync(ortDir)) {
  if (f.endsWith('.wasm')) copyFileSync(join(ortDir, f), join(dest, f))
}

console.log('[copy-vad-assets] copied to public/vad/')
