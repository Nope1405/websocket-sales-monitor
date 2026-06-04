import Dashboard from './components/dashboard/Dashboard'
import { useEffect } from 'react'
/**
 * Keeps application entry explicit and intentionally thin.
 *
 * Why this structure helps:
 * - Routing and shell concerns can be added here later without touching dashboard logic.
 * - The dashboard feature remains isolated and easy to reason about.
 */
function App() {
  useEffect(() => {
    // Hàm tính toán và cập nhật tỷ lệ
    const handleResize = () => {
      // Chiều rộng "Khung tranh" gốc của bạn. 
      // 2084 là con số ước tính từ tỷ lệ 0.737 trên màn hình Full HD (1920px).
      const BASE_WIDTH = 2084 
      
      // Tính tỷ lệ: Chiều rộng cửa sổ hiện tại / Chiều rộng chuẩn
      let currentScale = window.innerWidth / BASE_WIDTH

      // Chặn giới hạn để web không bị thu nhỏ quá mức hoặc phóng to quá lố
      currentScale = Math.min(Math.max(currentScale, 0.4), 1.5)

      // Bơm thẳng tỷ lệ này vào biến CSS
      document.documentElement.style.setProperty('--ui-scale', currentScale.toString())
    }

    // Chạy lần đầu tiên khi web load
    handleResize()

    // Lắng nghe sự kiện người dùng kéo thả thay đổi kích thước cửa sổ
    window.addEventListener('resize', handleResize)

    // Dọn dẹp sự kiện khi component unmount
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <Dashboard />
}

export default App
