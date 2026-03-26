const PRODUCTS = [
  { name: 'iPhone 15', price: 25_000_000 },
  { name: 'Laptop Dell XPS 13', price: 32_000_000 },
  { name: 'MacBook Air M3', price: 34_500_000 },
  { name: 'Samsung S24 Ultra', price: 29_900_000 },
  { name: 'iPad Pro M4', price: 27_000_000 },
  { name: 'AirPods Pro 2', price: 5_800_000 },
]

const CHANNELS = ['Website', 'Shopee', 'Tiki', 'Facebook Shop', 'Zalo OA']

/**
 * Picks one random item from a list.
 * @template T
 * @param {T[]} items List of values.
 * @returns {T} A randomly selected value.
 */
function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)]
}

/**
 * Generates a pseudo-random order identifier using timestamp + random suffix.
 * @returns {string} Order ID in a human-friendly format.
 */
function generateOrderId() {
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `ORD-${Date.now()}-${suffix}`
}

/**
 * Generates one sales payload used by the live dashboard stream.
 * @returns {{ timestamp: string, order_id: string, product: string, amount: number, quantity: number, channel: string, status: 'SUCCESS' | 'FAIL' }}
 */
function generateMockOrderPayload() {
  const selectedProduct = randomFrom(PRODUCTS)
  const amountVariance = Math.floor(selectedProduct.price * (Math.random() * 0.08))

  return {
    timestamp: new Date().toISOString(),
    order_id: generateOrderId(),
    product: selectedProduct.name,
    amount: selectedProduct.price + amountVariance,
    quantity: 1,
    channel: randomFrom(CHANNELS),
    status: Math.random() > 0.2 ? 'SUCCESS' : 'FAIL',
  }
}

module.exports = {
  generateMockOrderPayload,
}
