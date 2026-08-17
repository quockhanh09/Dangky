import { useState, useMemo } from 'react'
import './App.css'

import logoAppa from './assets/Appa-cmc-nen-toi - Copy.png'
import heroBg from './assets/Frame-1629.png'

// Thay đường dẫn URL dưới đây bằng Web App URL thu được từ Google Apps Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzD7AVwQoWvYkUyzHGVM9XFqvwAm8cX5C_kkn_MExe7u_S0EE-H7xsYJvw6JLrBB5ks/exec'

const MAX_SLOTS_PER_TIME = 3 // Giới hạn tối đa 3 lượt đăng ký cho 1 khung giờ

const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
]

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const INITIAL_TIME_SLOTS = [
  { id: 1, time: '08:30 - 09:30' },
  { id: 2, time: '09:30 - 10:30' },
  { id: 3, time: '10:30 - 11:30' },
  { id: 4, time: '13:30 - 14:30' },
  { id: 5, time: '14:30 - 15:30' },
  { id: 6, time: '15:30 - 16:30' },
]

function App() {
  const [currentMonth, setCurrentMonth] = useState(7) // Tháng 8 (index 7)
  const [currentYear, setCurrentYear] = useState(2026)
  const [selectedDate, setSelectedDate] = useState(14)
  const [selectedSlot, setSelectedSlot] = useState(1)

  const [artistName, setArtistName] = useState('')
  const [stageName, setStageName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Lưu trữ số lượt đăng ký theo ngày & slotId: { "14/08/2026": { 2: 3, 1: 1 } }
  // Mặc định giả lập khung giờ 2 (09:30 - 10:30) của ngày 14 đã full 3 slot để hiển thị màu xám
  const [bookings, setBookings] = useState({
    'Thứ sáu, 14/08/2026': { 2: 3 } 
  })

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const days = []
    
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate()
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, isCurrentMonth: true })
    }
    const remaining = 35 - days.length
    for (let d = 1; d <= (remaining > 0 ? remaining : remaining + 7); d++) {
      days.push({ day: d, isCurrentMonth: false })
    }
    return days
  }, [currentMonth, currentYear])

  const selectedDateStr = useMemo(() => {
    if (!selectedDate) return '--'
    const dayOfWeekNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
    const dateObj = new Date(currentYear, currentMonth, selectedDate)
    const dayName = dayOfWeekNames[dateObj.getDay()]
    const dayFormatted = String(selectedDate).padStart(2, '0')
    const monthFormatted = String(currentMonth + 1).padStart(2, '0')
    return `${dayName}, ${dayFormatted}/${monthFormatted}/${currentYear}`
  }, [selectedDate, currentMonth, currentYear])

  // Lấy số lượt đã đăng ký của 1 slot cụ thể trong ngày đang chọn
  const getSlotBookedCount = (slotId) => {
    if (!selectedDateStr || !bookings[selectedDateStr]) return 0
    return bookings[selectedDateStr][slotId] || 0
  }

  const handleSlotClick = (slot) => {
    const bookedCount = getSlotBookedCount(slot.id)
    if (bookedCount >= MAX_SLOTS_PER_TIME) return // Đã đủ 3 slot thì không thể chọn
    setSelectedSlot(slot.id)
  }

  const validate = () => {
    const newErrors = {}
    if (!selectedDate) newErrors.date = 'Vui lòng chọn ngày'
    if (!selectedSlot) newErrors.slot = 'Vui lòng chọn khung giờ'
    if (!artistName.trim()) newErrors.artistName = 'Vui lòng nhập họ và tên nghệ sĩ'
    if (!stageName.trim()) newErrors.stageName = 'Vui lòng nhập nghệ danh'
    if (!phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9]{10}$/.test(phone.trim())) {
      newErrors.phone = 'Số điện thoại phải có 10 chữ số'
    }
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Email không hợp lệ'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const activeSlotObj = INITIAL_TIME_SLOTS.find(s => s.id === selectedSlot)

  // HÀM XỬ LÝ GỬI DỮ LIỆU SANG GOOGLE SHEETS
  const handleSubmit = async () => {
    if (!validate()) return

    // Kiểm tra lại lần cuối trước khi bấm gửi
    const currentBooked = getSlotBookedCount(selectedSlot)
    if (currentBooked >= MAX_SLOTS_PER_TIME) {
      alert('Khung giờ này vừa mới hết chỗ, vui lòng chọn khung giờ khác!')
      return
    }

    setLoading(true)

    const payload = {
      bookingDate: selectedDateStr,
      timeSlot: activeSlotObj ? activeSlotObj.time : '',
      artistName: artistName,
      stageName: stageName,
      phone: phone,
      email: email
    }

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      })

      // Tăng số lượt đăng ký của khung giờ này lên 1
      setBookings(prev => {
        const dateBookings = prev[selectedDateStr] || {}
        const currentSlotCount = dateBookings[selectedSlot] || 0
        return {
          ...prev,
          [selectedDateStr]: {
            ...dateBookings,
            [selectedSlot]: currentSlotCount + 1
          }
        }
      })

      setLoading(false)
      setShowModal(true)
    } catch (error) {
      console.error('Lỗi khi gửi dữ liệu:', error)
      setLoading(false)
      alert('Đã xảy ra lỗi khi gửi đăng ký. Vui lòng thử lại!')
    }
  }

  return (
    <div className="page">
      {/* ===== HEADER ===== */}
      <header className="header">
        <div className="header-brand">
          <img src={logoAppa} alt="APPA CMC Logo" className="header-logo-img" />
          <div className="header-text-block">
            <span className="header-title-vn">
              TRUNG TÂM KHAI THÁC QUYỀN BIỂU DIỄN ÂM NHẠC VIỆT NAM (APPA - CMC)
            </span>
            <span className="header-title-en">
              Vietnam association for rights performance of music performing artists - Collective management center
            </span>
          </div>
        </div>

        <div className="header-action-wrapper">
          <a href="https://www.appa.org.vn/" className="header-back">VỀ TRANG CHỦ</a>
        </div>
      </header>

      {/* ===== HERO BANNER ===== */}
      <section 
        className="hero" 
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="hero-content">
          <h1>ĐĂNG KÝ LỊCH LÀM VIỆC</h1>
          <p className="hero-desc">
            Chủ động đặt lịch để được hỗ trợ nhanh chóng khi đến làm việc.
            <br />
            Nghệ sĩ có thể tra cứu trước dữ liệu các ca khúc của mình trên hệ thống của trung tâm.
          </p>
        </div>

        <div className="hero-cta-wrapper">
          <a href="https://works.search.appa.org.vn/" className="hero-cta">
            TRA CỨU BÀI HÁT
          </a>
        </div>
      </section>

      {/* ===== MAIN BODY LAYOUT ===== */}
      <main className="main-layout">
        <div className="left-column">
          
          {/* SECTION 1: CHỌN LỊCH HẸN */}
          <div className="booking-card">
            <div className="card-section-title">
              <span className="icon-calendar-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f52ba" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
              <h2>1. Chọn lịch hẹn</h2>
            </div>

            <div className="booking-picker-grid">
              <div className="calendar-box">
                <div className="cal-sub-label">Ngày đến làm việc</div>
                
                <div className="mini-calendar">
                  <div className="mini-cal-header">
                    <div className="select-group">
                      <select 
                        value={currentMonth} 
                        onChange={(e) => setCurrentMonth(Number(e.target.value))}
                      >
                        {MONTHS.map((m, idx) => (
                          <option key={idx} value={idx}>{m}</option>
                        ))}
                      </select>
                      <select 
                        value={currentYear} 
                        onChange={(e) => setCurrentYear(Number(e.target.value))}
                      >
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                      </select>
                    </div>
                  </div>

                  <div className="mini-cal-weekdays">
                    {WEEKDAYS.map((wd) => (
                      <div key={wd} className="weekday-cell">{wd}</div>
                    ))}
                  </div>

                  <div className="mini-cal-days">
                    {calendarDays.map((item, index) => {
                      const isSelected = item.isCurrentMonth && item.day === selectedDate
                      return (
                        <button
                          key={index}
                          className={`day-cell ${!item.isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''}`}
                          onClick={() => item.isCurrentMonth && setSelectedDate(item.day)}
                        >
                          {item.day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="slots-box">
                <div className="cal-sub-label">Khung giờ làm việc (Tối đa 3 slot/khung giờ)</div>
                
                <div className="slots-grid-2col">
                  {INITIAL_TIME_SLOTS.map((slot) => {
                    const bookedCount = getSlotBookedCount(slot.id)
                    const isFull = bookedCount >= MAX_SLOTS_PER_TIME
                    const isSelected = selectedSlot === slot.id && !isFull

                    let slotClass = 'slot-item'
                    if (isFull) slotClass += ' is-booked'
                    else if (isSelected) slotClass += ' is-selected'

                    return (
                      <button
                        key={slot.id}
                        className={slotClass}
                        disabled={isFull}
                        onClick={() => handleSlotClick(slot)}
                      >
                        <div>{slot.time}</div>
                        <span style={{ fontSize: '11px', opacity: 0.85, fontWeight: 'normal' }}>
                          {isFull ? '(Đã kín)' : `(Còn ${MAX_SLOTS_PER_TIME - bookedCount}/${MAX_SLOTS_PER_TIME} slot)`}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="slots-legend">
                  <div className="legend-item">
                    <span className="legend-box available"></span>
                    <span>Còn trống</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-box selected"></span>
                    <span>Đã chọn</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-box booked"></span>
                    <span>Đã kín (Đủ 3 slot)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: THÔNG TIN NGHỆ SĨ */}
          <div className="booking-card">
            <div className="card-section-title">
              <span className="icon-user-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f52ba" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <h2>2. Anh/chị tới đăng ký cho nghệ sĩ nào?</h2>
            </div>

            <div className="form-grid-2col">
              <div className="form-field">
                <label><span className="star">*</span> Họ và tên nghệ sĩ</label>
                <input
                  type="text"
                  placeholder="Nhập họ và tên nghệ sĩ"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className={errors.artistName ? 'input-error' : ''}
                />
                {errors.artistName && <span className="error-text">{errors.artistName}</span>}
              </div>

              <div className="form-field">
                <label><span className="star">*</span> Nghệ danh</label>
                <input
                  type="text"
                  placeholder="Nhập nghệ danh nghệ sĩ"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  className={errors.stageName ? 'input-error' : ''}
                />
                {errors.stageName && <span className="error-text">{errors.stageName}</span>}
              </div>
            </div>
          </div>

          {/* SECTION 3: THÔNG TIN NGƯỜI TỚI LÀM VIỆC */}
          <div className="booking-card">
            <div className="card-section-title">
              <span className="icon-user-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f52ba" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <h2>3. Thông tin người tới làm việc</h2>
            </div>

            <div className="form-grid-2col">
              <div className="form-field">
                <label><span className="star">*</span> Số điện thoại</label>
                <input
                  type="text"
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={errors.phone ? 'input-error' : ''}
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>

              <div className="form-field">
                <label><span className="star">*</span> Email</label>
                <input
                  type="email"
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
            </div>
          </div>

        </div>

        {/* ===== RIGHT SIDEBAR ===== */}
        <div className="right-column">
          <div className="sidebar-card">
            <div className="sidebar-card-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f52ba" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Thông tin lịch hẹn</span>
            </div>

            <div className="summary-section">
              <div className="summary-label">Ngày đến làm việc</div>
              <div className="summary-value-highlight">{selectedDateStr}</div>

              <div className="summary-label" style={{ marginTop: 16 }}>Khung giờ</div>
              <div className="summary-value-highlight">
                {activeSlotObj && getSlotBookedCount(activeSlotObj.id) < MAX_SLOTS_PER_TIME 
                  ? activeSlotObj.time 
                  : 'Chưa chọn'}
              </div>
            </div>

            <div className="summary-divider" />

            <div className="summary-notes">
              <div className="notes-title">Lưu ý</div>
              <div className="note-item">
                <span className="check-icon">✓</span>
                <span>Vui lòng đến đúng giờ đã đăng ký</span>
              </div>
              <div className="note-item">
                <span className="check-icon">✓</span>
                <span>Mỗi khung giờ chỉ nhận tối đa 3 lượt đăng ký</span>
              </div>
              <div className="note-item">
                <span className="check-icon">✓</span>
                <span>Trung tâm sẽ liên hệ xác nhận qua điện thoại hoặc email</span>
              </div>
            </div>
          </div>

          <div className="contact-card">
            <div className="contact-title">Liên hệ</div>
            <div className="contact-list">
              <div className="contact-row">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f52ba" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span className="contact-text font-bold">0989 115 323</span>
              </div>

              <div className="contact-row">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f52ba" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span className="contact-text font-bold">info@appa.org.vn</span>
              </div>

              <div className="contact-row">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f52ba" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span className="contact-text font-bold">8:00 - 17:00 (T2 - T6)</span>
              </div>
            </div>
          </div>

          <button 
            className="btn-submit-booking"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ LỊCH HẸN'}
          </button>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand-center">
              <div className="footer-logo-title-row">
                <img src={logoAppa} alt="APPA CMC Logo" className="footer-logo" />
                <div className="footer-titles">
                  <h2 className="footer-title-main">
                    TRUNG TÂM KHAI THÁC QUYỀN BIỂU DIỄN ÂM NHẠC VIỆT NAM (APPA - CMC)
                  </h2>
                  <p className="footer-title-sub">
                    Vietnam association for rights performance of music performing artists - Collective management center
                  </p>
                </div>
              </div>

              <div className="footer-policy-links">
                <a href="#">Điều khoản sử dụng</a>
                <span className="footer-policy-divider">|</span>
                <a href="#">Chính sách bảo mật dữ liệu cá nhân</a>
              </div>
            </div>
          </div>

          <div className="footer-main-grid">
            <div className="footer-col-info">
              <div className="footer-socials">
                <a href="#" className="social-icon" aria-label="Facebook">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="Instagram">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="YouTube">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="LinkedIn">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>

              <div className="footer-address-block">
                <p className="address-label">Địa chỉ:</p>
                <p className="address-line">Hà Nội: Tòa W1, Vinhomes Westpoint, Đỗ Đức Dục, Phường Từ Liêm, Hà Nội</p>
                <p className="address-line">TP. HCM: 22A Cộng Hoà, Phường Tân Sơn Nhất, Tp. Hồ Chí Minh</p>
                <p className="address-line"><span className="address-bold">TEL:</span> (+84) 989 115 323</p>
                <p className="address-line"><span className="address-bold">E-MAIL:</span> info@appa.org.vn</p>
              </div>

              <div className="footer-copyright">
                Bản quyền thuộc về © 2026 APPA - CMC.
              </div>
            </div>

            <div className="footer-col-nav">
              <h3 className="footer-col-title">Hạng mục</h3>
              <ul className="footer-menu">
                <li><a href="#">Về Trung tâm</a></li>
                <li><a href="#">Tin tức & Sự kiện</a></li>
                <li><a href="#">Hướng dẫn gia nhập</a></li>
                <li><a href="#">Dành cho hội viên</a></li>
                <li><a href="#">Thư viện</a></li>
              </ul>
            </div>

            <div className="footer-col-nav">
              <h3 className="footer-col-title">Truy cập nhanh</h3>
              <ul className="footer-menu">
                <li><a href="#">Hướng dẫn gia nhập</a></li>
                <li><a href="#">Đăng ký hội viên</a></li>
                <li><a href="#">Đăng ký thông tin biểu diễn</a></li>
                <li><a href="#">Pháp luật Việt Nam</a></li>
                <li><a href="#">Các loại biểu mẫu</a></li>
              </ul>
            </div>

            <div className="footer-col-nav">
              <h3 className="footer-col-title">Hỗ trợ</h3>
              <ul className="footer-menu">
                <li><a href="#">Câu hỏi thường gặp</a></li>
                <li><a href="#">Đăng câu hỏi</a></li>
                <li><a href="#">Liên hệ</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL KHI THÀNH CÔNG */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">&#10003;</div>
            <h3>Đăng ký thành công!</h3>
            <p>Lịch hẹn của bạn đã được ghi nhận thành công.</p>
            <button className="modal-close" onClick={() => setShowModal(false)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App