import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, runnerImport, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import sharp from 'sharp'

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
    configurePreviewServer(server) {
      // Vercel มี rewrite ใน vercel.json ส่วน vite preview ตอบ HTML หน้าแรกให้ URL ที่ไม่มี / ท้ายชื่อ
      server.middlewares.use((req, _res, next) => {
        req.url = req.url?.replace(/^(\/projects\/[\w-]+)\/?(?=\?|$)/, '$1/index.html')
        next()
      })
    },
    transformIndexHtml(html, { bundle }) {
      if (!bundle) return
      // ลิงก์ดาวน์โหลดใน HTML สำรอง ใช้ไฟล์เดียวกับ React แต่ Vite ไม่แปลง href ของ <a> ให้
      const source = html.match(/href="\/(src\/assets\/[^"]+\.pdf)" download/)?.[1]
      const pdf = source && Object.values(bundle).find(file => file.type === 'asset' && file.originalFileNames.includes(source))
      if (!pdf) throw new Error('ไม่พบไฟล์ CV ที่ลิงก์ใน HTML สำรอง อ้างถึง')
      return html.replace(`href="/${source}"`, `href="/${pdf.fileName}?download=1"`)
    },
    async writeBundle({ dir }) {
      // ไม่ import data.ts ที่หัวไฟล์: มันจะกลายเป็น dependency ของ config แล้ว dev server restart ทุกครั้งที่แก้เนื้อหา (แทน HMR)
      const { profile, projects } = (await runnerImport<typeof import('./src/data.ts')>(resolve('src/data.ts'))).module
      const { projectMedia, projectGallery, SHOT_SIZE } = (await runnerImport<typeof import('./src/config/projectMedia.ts')>(resolve('src/config/projectMedia.ts'))).module
      const dist = dir!
      const template = readFileSync(resolve(dist, 'index.html'), 'utf8')
      const links = projects.map(({ id, title }) => `<li><a class="text-pen underline" href="/projects/${attr(id)}">${attr(title)}</a></li>`).join('')
      const home = template.replace('<!-- fallback-projects -->', `<nav aria-label="Projects"><ul class="space-y-2">${links}</ul></nav>`)
      writeFileSync(resolve(dist, 'index.html'), home)
      const urls = [`${profile.siteUrl}/`]
      for (const { id, title, desc } of projects) {
        const url = `${profile.siteUrl}/projects/${id}`
        urls.push(url)
        const pageTitle = `${title} — ${profile.name}`
        let html = swap(template, /(<title>)[^<]*(<\/title>)/, pageTitle)
        html = swap(html, /(<link rel="canonical" href=")[^"]*(")/, url)
        html = swap(html, meta('description'), desc)
        html = swap(html, meta('og:url'), url)
        html = swap(html, meta('og:title'), pageTitle)
        html = swap(html, meta('og:description'), desc)
        html = swap(html, /(<h1[^>]* data-fallback-title>)[^<]*(<\/h1>)/, title)
        html = swap(html, /(<p[^>]* data-fallback-summary>)[^<]*(<\/p>)/, desc)
        html = html.replace('<!-- fallback-projects -->', '<a class="text-pen underline" href="/">All projects</a>')
        const shot = projectMedia[id] ? { file: id, alt: projectMedia[id].alt } : projectGallery[id]?.find((image) => image.hero && !image.portrait)
        if (shot) {
          // ใช้ภาพงานจริงใน preview แยกตามผลงาน และคงภาพหลักสำหรับงานที่ไม่มีภาพปก
          const imagePath = `projects/${id}/preview.jpg`
          mkdirSync(resolve(dist, 'projects', id), { recursive: true })
          await sharp(resolve('src/assets/images/projects', id, `${shot.file}-${SHOT_SIZE.width}.webp`))
            .resize(1200, 630, { fit: 'contain', background: '#f6f8fb' })
            .jpeg({ quality: 82 })
            .toFile(resolve(dist, imagePath))
          html = swap(html, meta('og:image'), `${profile.siteUrl}/${imagePath}`)
          html = swap(html, meta('og:image:alt'), shot.alt)
        }
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
