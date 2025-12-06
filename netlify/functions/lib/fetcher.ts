export async function fetchHTML(url: string): Promise<string> {
  // まず通常のfetchを試す
  console.log(`[fetcher] Trying direct fetch for: ${url}`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const html = await res.text()

    // コンテンツが十分にあるかチェック（JSレンダリングでない場合）
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (textContent.length > 200) {
      console.log(`[fetcher] Direct fetch successful, content length: ${textContent.length}`)
      return html
    }

    console.log(`[fetcher] Direct fetch returned thin content (${textContent.length} chars), trying JS rendering...`)
  } catch (error: any) {
    console.log(`[fetcher] Direct fetch failed: ${error.message}`)
  } finally {
    clearTimeout(timeoutId)
  }

  // JSレンダリングが必要な場合、Microlink APIを使用
  console.log(`[fetcher] Using Microlink API for JS rendering...`)
  return await fetchWithMicrolink(url)
}

async function fetchWithMicrolink(url: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    // Microlink API - HTMLを取得
    const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&meta=false&scripts=true&styles=false`

    const res = await fetch(apiUrl, {
      signal: controller.signal
    })

    if (!res.ok) {
      throw new Error(`Microlink API error: ${res.status}`)
    }

    const data = await res.json() as any

    if (data.status !== 'success') {
      throw new Error(`Microlink failed: ${data.message || 'Unknown error'}`)
    }

    // Microlink APIはHTMLを直接返さないので、別の方法を使う
    // Jina AIのReader APIを試す（無料でJSレンダリング対応）
    console.log(`[fetcher] Trying Jina Reader API...`)
    return await fetchWithJina(url)
  } catch (error: any) {
    console.log(`[fetcher] Microlink failed: ${error.message}, trying Jina...`)
    return await fetchWithJina(url)
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchWithJina(url: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    // Jina Reader API - マークダウン形式でコンテンツを取得
    const jinaUrl = `https://r.jina.ai/${url}`

    const res = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/html'
      },
      signal: controller.signal
    })

    if (!res.ok) {
      throw new Error(`Jina API error: ${res.status}`)
    }

    const content = await res.text()

    if (content.length < 100) {
      throw new Error('Jina returned insufficient content')
    }

    console.log(`[fetcher] Jina Reader successful, content length: ${content.length}`)

    // Jinaはプレーンテキスト/マークダウンを返すので、簡易的なHTMLにラップ
    return `<!DOCTYPE html><html><body><article>${content}</article></body></html>`
  } finally {
    clearTimeout(timeoutId)
  }
}
