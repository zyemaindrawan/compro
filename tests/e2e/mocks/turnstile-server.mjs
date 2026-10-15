import { createServer } from 'node:http'

const PORT = Number(process.env.TURNSTILE_MOCK_PORT ?? 3199)

createServer((request, response) => {
  if (request.url === '/health') {
    response.end('ok')
    return
  }
  let body = ''
  request.on('data', (chunk) => {
    body += chunk
  })
  request.on('end', () => {
    const token = new URLSearchParams(body).get('response') ?? ''
    const success = token !== '' && token !== 'fail'
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify(success ? { success } : { 'success': false, 'error-codes': ['invalid-input-response'] }))
  })
}).listen(PORT, '127.0.0.1')
