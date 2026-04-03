const PRODUCTS = [
  { name: 'AirPods Pro 2', tier: 'LOW' },
  { name: 'Phone Case', tier: 'LOW' },
  { name: 'Bluetooth Speaker Mini', tier: 'LOW' },
  { name: 'Samsung S24 Ultra', tier: 'HIGH' },
  { name: 'MacBook Air M3', tier: 'HIGH' },
  { name: 'Laptop Dell XPS 13', tier: 'HIGH' },
]

const CHANNELS = ['Website', 'Shopee', 'Tiki', 'Facebook Shop', 'Zalo OA']
const ORDER_ID_MIN_SUFFIX = 1000
const ORDER_ID_SUFFIX_RANGE = 9000
const STREAM_INTERVAL_MS = 2000
const SUCCESS_PHASE_MIN_MS = 2 * 60 * 1000
const SUCCESS_PHASE_MAX_MS = 3 * 60 * 1000
const FAIL_PHASE_MIN_MS = 1 * 60 * 1000
const FAIL_PHASE_MAX_MS = 2 * 60 * 1000
const LOW_AMOUNT_MIN_VND = 80_000
const LOW_AMOUNT_MAX_VND = 900_000
const HIGH_AMOUNT_MIN_VND = 6_000_000
const HIGH_AMOUNT_MAX_VND = 35_000_000
const SUCCESS_HIGH_TIER_RATE = 0.88
const FAIL_PHASE_LOW_SUCCESS_RATE = 0.3
const FAIL_PHASE_LOW_SUCCESS_MAX_VND = 250_000
const PRICE_STEP_VND = 10_000

const SUCCESS_PHASE_MIN_TICKS = Math.floor(SUCCESS_PHASE_MIN_MS / STREAM_INTERVAL_MS)
const SUCCESS_PHASE_MAX_TICKS = Math.floor(SUCCESS_PHASE_MAX_MS / STREAM_INTERVAL_MS)
const FAIL_PHASE_MIN_TICKS = Math.floor(FAIL_PHASE_MIN_MS / STREAM_INTERVAL_MS)
const FAIL_PHASE_MAX_TICKS = Math.floor(FAIL_PHASE_MAX_MS / STREAM_INTERVAL_MS)

let currentPhase = 'SUCCESS'
let phaseTicksRemaining = randomInt(SUCCESS_PHASE_MIN_TICKS, SUCCESS_PHASE_MAX_TICKS)
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
 * Returns a random integer in [min, max].
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
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
function generateRoundedPriceVND(tier) {
  const minAmount = tier === 'HIGH' ? HIGH_AMOUNT_MIN_VND : LOW_AMOUNT_MIN_VND
  const maxAmount = tier === 'HIGH' ? HIGH_AMOUNT_MAX_VND : LOW_AMOUNT_MAX_VND
  const randomValue = randomInt(minAmount, maxAmount)

  return Math.round(randomValue / PRICE_STEP_VND) * PRICE_STEP_VND
}

/**
 * Generates a tiny success amount used inside FAIL phase.
 * @returns {number}
 */
function generateFailPhaseSuccessAmountVND() {
  const randomValue = randomInt(LOW_AMOUNT_MIN_VND, FAIL_PHASE_LOW_SUCCESS_MAX_VND)
  return Math.round(randomValue / PRICE_STEP_VND) * PRICE_STEP_VND
}

/**
 * Returns the stream phase for current tick and updates phase counters.
 * @returns {'SUCCESS' | 'FAIL'}
 */
function nextPhase() {
  const phase = currentPhase

  phaseTicksRemaining -= 1

  if (phaseTicksRemaining <= 0) {
    if (currentPhase === 'SUCCESS') {
      currentPhase = 'FAIL'
      phaseTicksRemaining = randomInt(FAIL_PHASE_MIN_TICKS, FAIL_PHASE_MAX_TICKS)
    } else {
      currentPhase = 'SUCCESS'
      phaseTicksRemaining = randomInt(SUCCESS_PHASE_MIN_TICKS, SUCCESS_PHASE_MAX_TICKS)
    }
  }

  return phase
}

/**
 * Picks mostly high tier in SUCCESS phase and rarely inserts low tier.
 * @returns {'HIGH' | 'LOW'}
 */
function pickTierForSuccess() {
  return Math.random() < SUCCESS_HIGH_TIER_RATE ? 'HIGH' : 'LOW'
}

/**
 * Picks a product name from the requested tier.
 * @param {'HIGH' | 'LOW'} tier
 * @returns {{ name: string, tier: 'HIGH' | 'LOW' }}
 */
function pickProductByTier(tier) {
  const candidates = PRODUCTS.filter((product) => product.tier === tier)

  if (candidates.length === 0) {
    return randomFrom(PRODUCTS)
  }

  return randomFrom(candidates)
}

/**
 * Generates one sales payload used by the live dashboard stream.
 * @returns {{ timestamp: string, order_id: string, product: string, amount: number, quantity: number, channel: string, status: 'SUCCESS' | 'FAIL' }}
 */
function generateMockOrderPayload() {
  const phase = nextPhase()
  const isFailPhaseLowSuccess = phase === 'FAIL' && Math.random() < FAIL_PHASE_LOW_SUCCESS_RATE
  const isSuccess = phase === 'SUCCESS' || isFailPhaseLowSuccess
  const selectedTier = phase === 'SUCCESS' ? pickTierForSuccess() : 'LOW'
  const selectedProduct = pickProductByTier(selectedTier)
  const amount = isSuccess
    ? isFailPhaseLowSuccess
      ? generateFailPhaseSuccessAmountVND()
      : generateRoundedPriceVND(selectedTier)
    : 0

  return {
    timestamp: new Date().toISOString(),
    order_id: generateOrderId(),
    product: selectedProduct.name,
    amount,
    quantity: 1,
    channel: randomFrom(CHANNELS),
    status: isSuccess ? 'SUCCESS' : 'FAIL',
  }
}

module.exports = {
  generateMockOrderPayload,
}
