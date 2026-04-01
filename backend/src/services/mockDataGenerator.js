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
const SPIKE_ORDER_PROBABILITY = 0.2
const REGULAR_AMOUNT_MIN = 50_000
const REGULAR_AMOUNT_RANGE = 450_001
const SPIKE_AMOUNT_MIN = 600_000
const SPIKE_AMOUNT_RANGE = 1_900_001
const SUCCESS_RATE = 0.8

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
 * Generates one sales payload used by the live dashboard stream.
 * @returns {{ timestamp: string, order_id: string, product: string, amount: number, quantity: number, channel: string, status: 'SUCCESS' | 'FAIL' }}
 */
function generateMockOrderPayload() {
  const selectedProduct = randomFrom(PRODUCTS)
  const isSpikeOrder = Math.random() < SPIKE_ORDER_PROBABILITY

  // Keep most orders in a smaller, realistic range to avoid a perfectly linear cumulative curve.
  const regularAmount = REGULAR_AMOUNT_MIN + Math.floor(Math.random() * REGULAR_AMOUNT_RANGE)

  // Introduce occasional spikes so the area chart shows natural steps and volatility.
  const spikeAmount = SPIKE_AMOUNT_MIN + Math.floor(Math.random() * SPIKE_AMOUNT_RANGE)

  const amount = isSpikeOrder ? spikeAmount : regularAmount

  return {
    timestamp: new Date().toISOString(),
    order_id: generateOrderId(),
    product: selectedProduct.name,
    amount,
    quantity: 1,
    channel: randomFrom(CHANNELS),
    status: Math.random() < SUCCESS_RATE ? 'SUCCESS' : 'FAIL',
  }
}

module.exports = {
  generateMockOrderPayload,
}
