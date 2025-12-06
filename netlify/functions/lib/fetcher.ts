import fetch from 'node-fetch'

export async function fetchHTML(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'LLMO-Site-Doctor/1.0 (https://github.com/yourusername/llmo-site-doctor)'
    },
    // @ts-ignore - node-fetch v3 supports timeout differently
    timeout: 10000
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  return await res.text()
}
