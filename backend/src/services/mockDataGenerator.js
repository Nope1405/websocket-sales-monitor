const PRODUCTS = [
  { name: 'iPhone 15', price: 25_000_000 },
  { name: 'Laptop Dell XPS 13', price: 32_000_000 },
  { name: 'MacBook Air M3', price: 34_500_000 },
  { name: 'Samsung S24 Ultra', price: 29_900_000 },
  { name: 'iPad Pro M4', price: 27_000_000 },
  { name: 'AirPods Pro 2', price: 5_800_000 },
]

const CHANNELS = ['Website', 'Shopee', 'Tiki', 'Facebook Shop', 'Zalo OA']
const ORDER_ID_MIN_SUFFIX = 1000
const ORDER_ID_SUFFIX_RANGE = 9000
const SUCCESS_RATE = 0.65
const PRICE_MIN_VND = 50_000
const PRICE_MAX_VND = 1_500_000
const PRICE_STEP_VND = 10_000

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
  const suffix = Math.floor(ORDER_ID_MIN_SUFFIX + Math.random() * ORDER_ID_SUFFIX_RANGE)
  return `ORD-${Date.now()}-${suffix}`
}

/**
 * Generates a realistic ecommerce price in VND and rounds to nearest 10,000.
 * @returns {number}
 */
function generateRoundedPriceVND() {
  const randomValue = PRICE_MIN_VND + Math.floor(Math.random() * (PRICE_MAX_VND - PRICE_MIN_VND + 1))
  const rounded = Math.round(randomValue / PRICE_STEP_VND) * PRICE_STEP_VND
  return Math.min(PRICE_MAX_VND, Math.max(PRICE_MIN_VND, rounded))
}

/**
 * Generates one sales payload used by the live dashboard stream.
 * @returns {{ timestamp: string, order_id: string, product: string, amount: number, quantity: number, channel: string, status: 'SUCCESS' | 'FAIL' }}
 */
function generateMockOrderPayload() {
  const selectedProduct = randomFrom(PRODUCTS)
  const isSuccess = Math.random() < SUCCESS_RATE
  const roundedAmount = generateRoundedPriceVND()
  const signedAmount = isSuccess ? roundedAmount : -roundedAmount

  return {
    timestamp: new Date().toISOString(),
    order_id: generateOrderId(),
    product: selectedProduct.name,
    amount: signedAmount,
    quantity: 1,
    channel: randomFrom(CHANNELS),
    status: isSuccess ? 'SUCCESS' : 'FAIL',
  }
}

module.exports = {
  generateMockOrderPayload,
}
