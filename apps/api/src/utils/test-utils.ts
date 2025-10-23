import { parseStockURL, validateURLs } from './stockUrlParser'
import { NehtwAPIClient } from './nehtwClient'

// Test URL Parser
console.log('Testing URL Parser...')
const testUrls = [
  'https://stock.adobe.com/images/123456',
  'https://www.shutterstock.com/image-photo/test-789012',
  'https://www.freepik.com/free-photo/test-456789',
  'https://invalid-url.com/test',
]

testUrls.forEach((url) => {
  const result = parseStockURL(url)
  console.log(`${url} =>`, result)
})

const validation = validateURLs(testUrls)
console.log('Valid URLs:', validation.valid.length)
console.log('Invalid URLs:', validation.invalid.length)

// Test Nehtw Client (requires real API key)
if (process.env.NEHTW_API_KEY) {
  const client = new NehtwAPIClient(process.env.NEHTW_API_KEY)

  console.log('\nTesting Nehtw Client...')
  client
    .getStockSites()
    .then((sites) => console.log('✅ Stock sites fetched:', Object.keys(sites).length))
    .catch((err) => console.error('❌ Error:', err.message))
}
