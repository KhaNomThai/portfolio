import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, runnerImport, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * ใส่ <link rel="preload"> ให้ไฟล์ฟอนต์ (เฉพาะตอน build เพราะชื่อไฟล์มี hash)
 * เว็บนี้เป็น SPA: ถ้าไม่ preload เบราว์เซอร์จะรู้ว่าต้องใช้ฟอนต์ก็ต่อเมื่อ React วาดข้อความแล้ว
 * ฟอนต์จึงมาถึงช้ากว่าการวาดครั้งแรกเสมอ → preload ให้โหลดคู่ไปกับ JS ตั้งแต่อ่าน HTML
 * ใส่เฉพาะ subset latin ที่เนื้อหาภาษาอังกฤษใช้จริง (subset อื่นใน CSS ของ fontsource โหลดเมื่อเจออักษรนั้นเท่านั้น)
 */
function preloadFonts(names: string[]): Plugin {
  let base = '/'
  return {
    name: 'preload-fonts',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml(_html, ctx) {
      return Object.keys(ctx.bundle ?? {})
        .filter((file) => file.endsWith('.woff2') && names.some((name) => file.includes(name)))
        .map((file) => ({
          tag: 'link',
          // crossorigin จำเป็น: เบราว์เซอร์โหลดฟอนต์แบบ CORS ถ้า preload ไม่มี attribute นี้จะโหลดซ้ำสองรอบ
          attrs: { rel: 'preload', href: base + file, as: 'font', type: 'font/woff2', crossorigin: true },
          injectTo: 'head',
        }))
    },
  }
}

/**
 * HTML จริงต่อโปรเจกต์ (dist/projects/<id>/index.html) + sitemap.xml + robots.txt + 404.html จาก index.html ที่ build แล้ว
 * crawler ของ LinkedIn/LINE/Facebook ไม่รัน JS ถ้าทุก path ได้ index.html เดียวกัน preview และ canonical ของทุกโปรเจกต์จะเป็นของหน้าแรก
 * 404.html = แอปเดิม: id ที่ไม่มีจริงได้สถานะ 404 แต่คนที่พิมพ์ผิดยังเจอหน้าแรก (ProjectPage เปลี่ยน URL ให้)
 */
function projectPages(): Plugin {
  const attr = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  // แท็กที่หาไม่เจอ = index.html เปลี่ยนรูปแบบ ต้องให้ build พัง ไม่ใช่ปล่อย meta ของหน้าแรกขึ้นไปเงียบ ๆ
  const swap = (html: string, pattern: RegExp, value: string) => {
    if (!pattern.test(html)) throw new Error(`index.html ไม่มีแท็กที่ตรงกับ ${pattern}`)
    return html.replace(pattern, (_match, before: string, after: string) => before + attr(value) + after)
  }
  const meta = (key: string) => new RegExp(`(<meta\\s+(?:name|property)="${key}"\\s+content=")[^"]*(")`)

  return {
    name: 'project-pages',
    apply: 'build',
    async writeBundle({ dir }) {
      // ไม่ import data.ts ที่หัวไฟล์: มันจะกลายเป็น dependency ของ config แล้ว dev server restart ทุกครั้งที่แก้เนื้อหา (แทน HMR)
      const { profile, projects } = (await runnerImport<typeof import('./src/data.ts')>(resolve('src/data.ts'))).module
      const dist = dir!
      const home = readFileSync(resolve(dist, 'index.html'), 'utf8')
      const urls = [`${profile.siteUrl}/`]
      for (const { id, title, desc } of projects) {
        const url = `${profile.siteUrl}/projects/${id}`
        urls.push(url)
        const pageTitle = `${title} — ${profile.name}`
        let html = swap(home, /(<title>)[^<]*(<\/title>)/, pageTitle)
        html = swap(html, /(<link rel="canonical" href=")[^"]*(")/, url)
        html = swap(html, meta('description'), desc)
        html = swap(html, meta('og:url'), url)
        html = swap(html, meta('og:title'), pageTitle)
        html = swap(html, meta('og:description'), desc)
        mkdirSync(resolve(dist, 'projects', id), { recursive: true })
        writeFileSync(resolve(dist, 'projects', id, 'index.html'), html)
      }
      writeFileSync(resolve(dist, '404.html'), home.replace(/<link rel="canonical"[^>]*>/, '<meta name="robots" content="noindex" />'))
      writeFileSync(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${profile.siteUrl}/sitemap.xml\n`)
      writeFileSync(
        resolve(dist, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`
      )
    },
  }
}

// https://vite.dev/config/
// deploy บน Vercel ที่ root ("/") — base เป็นค่าเริ่มต้น จึงไม่ต้องตั้ง
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    preloadFonts(['newsreader-latin-opsz-normal', 'ibm-plex-sans-latin-wght-normal']),
    projectPages(),
  ],
  build: {
    rollupOptions: {
      output: {
        // PDF ไม่ใส่ hash: Vercel ส่ง content-disposition ตามชื่อไฟล์ และ Chrome ใช้ชื่อนั้นแทน attribute download
        assetFileNames: ({ names }) => (names[0]?.endsWith('.pdf') ? 'assets/[name][extname]' : 'assets/[name]-[hash][extname]'),
      },
    },
  },
})
