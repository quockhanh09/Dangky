import { useState, useMemo } from 'react'
import './App.css'

const MONTHS = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'
]

const WEEKDAYS = ['CN','T2','T3','T4','T5','T6','T7']

const TIME_SLOTS = [
  { id: 1, time: '08:30 - 09:30', booked: false },
  { id: 2, time: '09:30 - 10:30', booked: true },
  { id: 3, time: '10:30 - 11:30', booked: false },
  { id: 4, time: '11:30 - 12:30', booked: false },
  { id: 5, time: '13:30 - 14:30', booked: true },
  { id: 6, time: '14:30 - 15:30', booked: false },
  { id: 7, time: '15:30 - 16:30', booked: false },
  { id: 8, time: '16:30 - 17:30', booked: false },
]

function App() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [artistName, setArtistName] = useState('')
  const [stageName, setStageName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const yearRange = useMemo(() => {
    const years = []
    for (let y = currentYear - 5; y <= currentYear + 5; y++) years.push(y)
    return years
  }, [currentYear])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push({ empty: true })
    for (let d = 1; d <= daysInMonth; d++) days.push({ day: d, empty: false })
    return days
  }, [currentMonth, currentYear])

  const isDateDisabled = (day) => {
    const date = new Date(currentYear, currentMonth, day)
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return date < start
  }

  const isToday = (day) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    )
  }

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
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

  const handleSubmit = () => {
    if (!validate()) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setShowModal(true)
    }, 1500)
  }

  const selectedDateStr = selectedDate
    ? `Thứ ${['CN','T2','T3','T4','T5','T6','T7'][new Date(currentYear, currentMonth, selectedDate).getDay()]}, ${String(selectedDate).padStart(2,'0')}/${String(currentMonth+1).padStart(2,'0')}/${currentYear}`
    : '--'

  const allStepsValid = selectedDate && selectedSlot && artistName.trim() && stageName.trim() && phone.trim() && email.trim()

  return (
    <div className="page">
      {/* ===== HEADER ===== */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">APPA</div>
          <span>APPA - CMC</span>
        </div>
        <a href="#" className="header-back">VỀ TRANG CHỦ</a>
      </header>

      {/* ===== HERO ===== */}
      <section className="hero">
        <h1>ĐẶNG KÝ LỊCH LÀM VIỆC</h1>
        <p className="hero-desc">
          Nghệ sĩ đăng ký lịch hẹn hoặc tra cứu bài hát. Vui lòng điền đầy đủ thông tin bên dưới để đăng ký.
        </p>
        <a href="#" className="hero-cta">
          <span>TRA CỨU BÀI HÁT</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </section>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="main-layout">
        <div className="left-column">
          {/* STEPS BAR */}
          <div className="steps-bar">
            <div className={`step ${selectedDate || selectedSlot ? 'active' : ''}`}>
              <span className="step-num">1</span>
              <span>Chọn lịch hẹn</span>
            </div>
            <div className="step-sep" />
            <div className={`step ${artistName || stageName ? 'active' : ''}`}>
              <span className="step-num">2</span>
              <span>Thông tin nghệ sĩ</span>
            </div>
            <div className="step-sep" />
            <div className={`step ${phone || email ? 'active' : ''}`}>
              <span className="step-num">3</span>
              <span>Thông tin liên hệ</span>
            </div>
          </div>

          {/* STEP 1: CALENDAR */}
          <div className="card">
            <div className="card-title">1. Chọn lịch hẹn</div>
            <div className="card-subtitle">Chọn ngày và khung giờ phù hợp</div>

            <div className="cal-header">
              <div className="cal-title">
                {MONTHS[currentMonth]} / {currentYear}
              </div>
              <div className="cal-nav">
                <select
                  className="cal-select"
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <select
                  className="cal-select"
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                >
                  {yearRange.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button className="cal-nav-btn" onClick={prevMonth}>&lt;</button>
                <button className="cal-nav-btn" onClick={nextMonth}>&gt;</button>
              </div>
            </div>

            <div className="cal-weekdays">
              {WEEKDAYS.map((d) => (
                <div key={d} className="cal-weekday">{d}</div>
              ))}
            </div>

            <div className="cal-grid">
              {calendarDays.map((d, i) => {
                if (d.empty) return <div key={`e${i}`} className="cal-day empty" />
                const disabled = isDateDisabled(d.day)
                const selected = selectedDate === d.day && currentMonth === today.getMonth() && currentYear === today.getFullYear()
                const todayFlag = isToday(d.day)
                return (
                  <button
                    key={i}
                    className={`cal-day ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${todayFlag ? 'today' : ''}`}
                    onClick={() => !disabled && setSelectedDate(d.day)}
                    disabled={disabled}
                  >
                    {d.day}
                  </button>
                )
              })}
            </div>

            {errors.date && <div className="form-error" style={{marginTop: 8}}>{errors.date}</div>}

            <div style={{marginTop: 24}}>
              <div style={{fontWeight: 600, fontSize: 14, marginBottom: 12, color: '#334155'}}>Khung giờ làm việc</div>
              <div className="slots-grid">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot.id}
                    className={`slot-btn ${selectedSlot === slot.id ? 'selected' : ''} ${slot.booked ? 'booked' : ''}`}
                    onClick={() => !slot.booked && setSelectedSlot(slot.id)}
                    disabled={slot.booked}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
              {errors.slot && <div className="form-error" style={{marginTop: 8}}>{errors.slot}</div>}
            </div>
          </div>

          {/* STEP 2: ARTIST INFO */}
          <div className="card">
            <div className="card-title">2. Anh/chị tới đăng ký cho nghệ sĩ nào?</div>
            <div className="card-subtitle">Vui lòng điền thông tin nghệ sĩ</div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Họ và tên nghệ sĩ <span className="required">*</span></label>
                <input
                  type="text"
                  className={`form-input ${errors.artistName ? 'error' : ''}`}
                  placeholder="Nhập họ và tên nghệ sĩ"
                  value={artistName}
                  onChange={(e) => { setArtistName(e.target.value); if (errors.artistName) setErrors({...errors, artistName: ''}) }}
                />
                <div className="form-error">{errors.artistName}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Nghệ danh <span className="required">*</span></label>
                <input
                  type="text"
                  className={`form-input ${errors.stageName ? 'error' : ''}`}
                  placeholder="Nhập nghệ danh nghệ sĩ"
                  value={stageName}
                  onChange={(e) => { setStageName(e.target.value); if (errors.stageName) setErrors({...errors, stageName: ''}) }}
                />
                <div className="form-error">{errors.stageName}</div>
              </div>
            </div>
          </div>

          {/* STEP 3: CONTACT INFO */}
          <div className="card">
            <div className="card-title">3. Thông tin người tới làm việc</div>
            <div className="card-subtitle">Thông tin liên hệ để xác nhận lịch hẹn</div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Số điện thoại <span className="required">*</span></label>
                <input
                  type="tel"
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0,10)); if (errors.phone) setErrors({...errors, phone: ''}) }}
                />
                <div className="form-error">{errors.phone}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Email <span className="required">*</span></label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({...errors, email: ''}) }}
                />
                <div className="form-error">{errors.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT SIDEBAR ===== */}
        <div className="right-column">
          <div className="sidebar-card">
            <div className="sidebar-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Thông tin lịch hẹn
            </div>

            <div className="summary-row">
              <span className="summary-label">Ngày hẹn</span>
              <span className="summary-value">{selectedDateStr}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Khung giờ</span>
              <span className="summary-value">
                {selectedSlot ? TIME_SLOTS.find(s => s.id === selectedSlot)?.time : '--'}
              </span>
            </div>

            <div className="summary-note">
              <strong>Lưu ý:</strong>
              <ul>
                <li>Vui lòng đến đúng giờ hẹn</li>
                <li>Xác nhận lịch hẹn qua SĐT/Email</li>
                <li>Mang theo giấy tờ tùy thân</li>
              </ul>
            </div>
          </div>

          <div className="sidebar-card">
            <div className="sidebar-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Liên hệ
            </div>

            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">H</div>
                <span>0989 115 323</span>
              </div>
              <div className="contact-item">
                <div className="contact-icon">@</div>
                <span>info@appa.org.vn</span>
              </div>
              <div className="contact-item">
                <div className="contact-icon">G</div>
                <span>8:00 - 17:00, T2 - T6</span>
              </div>
            </div>
          </div>

          <button
            className={`submit-btn ${loading ? 'loading' : ''}`}
            onClick={handleSubmit}
            disabled={!allStepsValid || loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite'}} />
                Đang xử lý...
              </>
            ) : (
              'ĐĂNG KÝ LỊCH HẸN'
            )}
          </button>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">APPA - CMC</div>
              <p className="footer-desc">
                Hà Nội: Tầng 5, Tòa nhà CMC, 11 Duy Tân, Cầu Giấy<br />
                TP.HCM: Tầng 3, Tòa nhà CMC, 180 Điện Biên Phủ, Q. Bình Thạnh<br />
                Tel: (024) 7300 1866 &nbsp;|&nbsp; Email: info@appa.org.vn
              </p>
            </div>
            <div>
              <div className="footer-heading">Hạng mục</div>
              <ul className="footer-links">
                <li><a href="#">Đăng ký lịch làm việc</a></li>
                <li><a href="#">Tra cứu bài hát</a></li>
                <li><a href="#">Quy định & Điều khoản</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-heading">Truy cập nhanh</div>
              <ul className="footer-links">
                <li><a href="#">Về chúng tôi</a></li>
                <li><a href="#">Dịch vụ</a></li>
                <li><a href="#">Tin tức</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-heading">Hỗ trợ</div>
              <ul className="footer-links">
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Hướng dẫn sử dụng</a></li>
                <li><a href="#">Liên hệ hỗ trợ</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">&copy; 2026 APPA - CMC. All rights reserved.</div>
            <div className="footer-social">
              <a href="#" aria-label="Facebook">F</a>
              <a href="#" aria-label="Instagram">I</a>
              <a href="#" aria-label="YouTube">Y</a>
              <a href="#" aria-label="LinkedIn">L</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">&#10003;</div>
            <h3>Đăng ký thành công!</h3>
            <p>
              Lịch hẹn của bạn đã được ghi nhận. Chúng tôi sẽ gửi xác nhận qua SĐT/Email của bạn.
            </p>
            <button className="modal-close" onClick={() => setShowModal(false)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
