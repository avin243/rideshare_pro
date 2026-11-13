/* ============================================================
   STATE & API Configuration
   ============================================================ */
let state = {
  currentUser: null,
  selectedRole: 'admin',
  currentFilter: 'all',
  currentRating: 4,
  pendingBooking: null,
  uploadedImage: null,
  darkMode: true,
  csrfToken: '',
  currentChatBookingId: null,
  chatPollInterval: null
};

const API_BASE = '/api';

// Fetch CSRF Token on load
async function initCsrf() {
  try {
    const res = await fetch(`${API_BASE}/csrf/`);
    if(res.ok) {
        // Django sets csrftoken in cookies
        const name = "csrftoken=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for(let i = 0; i <ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') { c = c.substring(1); }
            if (c.indexOf(name) == 0) { state.csrfToken = c.substring(name.length, c.length); }
        }
    }
  } catch(e) { console.error("CSRF Init Error", e); }
}

async function apiCall(endpoint, method='GET', body=null) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.csrfToken) headers['X-CSRFToken'] = state.csrfToken;
    
    const config = { method, headers };
    if (body && method !== 'GET') config.body = JSON.stringify(body);
    
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'API Error');
    return data;
}

/* ============================================================
   LOGIN / AUTH
   ============================================================ */
function selectRole(role, el) {
  state.selectedRole = role;
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

async function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value.trim();
  const err = document.getElementById('loginError');
  try {
      const res = await apiCall('/auth/login/', 'POST', { username: u, password: p });
      err.classList.add('hidden');
      state.currentUser = { id: res.user.id, username: res.user.username, name: res.user.username, role: res.user.role.toLowerCase() };
      
      // CRITICAL: Django rotates the CSRF token on login for security! We must re-fetch it.
      await initCsrf();
      
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById('appLayout').style.display = 'block';
      initApp();
  } catch(error) {
      err.classList.remove('hidden');
      err.textContent = '❌ Invalid credentials or backend is not active.';
  }
}

async function doLogout() {
  try {
     await apiCall('/auth/logout/', 'POST');
  } catch(e) {}
  state.currentUser = null;
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('appLayout').style.display = 'none';
}

/* ============================================================
   APP INIT
   ============================================================ */
function initApp() {
  const u = state.currentUser;
  document.getElementById('sidebarAvatar').textContent = u.name[0].toUpperCase();
  document.getElementById('sidebarName').textContent = u.name;
  document.getElementById('sidebarRole').textContent = u.role.charAt(0).toUpperCase()+u.role.slice(1);
  buildNav();
  if (u.role==='client') { showPanel('search'); setTitle('Find a Ride'); }
  else if (u.role==='driver') { showPanel('drivertrip'); setTitle('My Trips'); buildDriverTrips(); }
  else { showPanel('adminoverview'); setTitle('Admin Overview'); }
}

function buildNav() {
  const r = state.currentUser.role;
  const nav = document.getElementById('sidebarNav');
  let html = '';
  if (r==='client') {
    html = `
      <div class="nav-section"><div class="nav-section-label">Main</div>
        <div class="nav-item active" onclick="showPanel('search');setTitle('Find a Ride');setActive(this)"><span class="nav-icon">🔍</span>Find Rides</div>
        <div class="nav-item" onclick="showPanel('mybookings');setTitle('My Bookings');setActive(this);buildMyBookings()"><span class="nav-icon">📋</span>My Bookings</div>
        <div class="nav-item" onclick="showPanel('history');setTitle('Ride History');setActive(this);buildHistory()"><span class="nav-icon">🕐</span>History</div>
      </div>
      <div class="nav-section"><div class="nav-section-label">More</div>
        <div class="nav-item" onclick="showPanel('safety');setTitle('Safety');setActive(this)"><span class="nav-icon">🛡️</span>Safety</div>
        <div class="nav-item" onclick="showPanel('chat');setTitle('Chat');setActive(this)"><span class="nav-icon">💬</span>Chat</div>
        <div class="nav-item" onclick="showPanel('notifications');setTitle('Notifications');setActive(this)"><span class="nav-icon">🔔</span>Notifications</div>
      </div>`;
  } else if (r==='driver') {
    html = `
      <div class="nav-section"><div class="nav-section-label">Driver</div>
        <div class="nav-item active" onclick="showPanel('drivertrip');setTitle('My Trips');setActive(this);buildDriverTrips()"><span class="nav-icon">🚗</span>My Trips</div>
        <div class="nav-item" onclick="showPanel('passengers');setTitle('Passengers');setActive(this);buildPassengers()"><span class="nav-icon">👥</span>Passengers</div>
        <div class="nav-item" onclick="showPanel('earnings');setTitle('Earnings');setActive(this)"><span class="nav-icon">💰</span>Earnings</div>
        <div class="nav-item" onclick="showPanel('chat');setTitle('Chat');setActive(this)"><span class="nav-icon">💬</span>Chat</div>
      </div>`;
  } else {
    html = `
      <div class="nav-section"><div class="nav-section-label">Admin</div>
        <div class="nav-item active" onclick="showPanel('adminoverview');setTitle('Overview');setActive(this)"><span class="nav-icon">📊</span>Overview</div>
        <div class="nav-item" onclick="showPanel('adminusers');setTitle('Users');setActive(this);buildAdminUsers()"><span class="nav-icon">👥</span>Users</div>
        <div class="nav-item" onclick="showPanel('adminrides');setTitle('All Rides');setActive(this);buildAdminRides()"><span class="nav-icon">🚗</span>All Rides</div>
      </div>`;
  }
  nav.innerHTML = html;
}

function setActive(el) {
  document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
  el.classList.add('active');
  closeSidebar();
}

function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  const p = document.getElementById('panel-'+name);
  if (p) p.classList.add('active');
  
  if (name !== 'chat' && state.chatPollInterval) {
      clearInterval(state.chatPollInterval);
      state.chatPollInterval = null;
  } else if (name === 'chat' && state.currentChatBookingId && !state.chatPollInterval) {
      loadChatMessages();
      state.chatPollInterval = setInterval(loadChatMessages, 3000);
  }
}

function setTitle(t) { document.getElementById('topbarTitle').textContent = t; }

function toggleTheme() {
  state.darkMode = !state.darkMode;
  document.documentElement.setAttribute('data-theme', state.darkMode?'dark':'light');
  document.querySelector('.theme-toggle').textContent = state.darkMode?'🌙':'☀️';
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebarOverlay').classList.toggle('show'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('show'); }

/* ============================================================
   SEARCH AND MATCHING
   ============================================================ */
async function searchRides() {
  const pickup = document.getElementById('searchPickup').value;
  const dest = document.getElementById('searchDest').value;
  const seats = parseInt(document.getElementById('searchSeats').value) || 1;
  
  if (!pickup || !dest) { return showNotif('Error', 'Please enter pickup and destination', 'red'); }

  try {
      const res = await apiCall('/rides/match/', 'POST', { pickup_location: pickup, destination: dest, required_seats: seats });
      
      const single = res.matches.filter(m => m.match_type === 'Single Car');
      const combos = res.matches.filter(m => m.match_type !== 'Single Car');
      
      renderCarResults({single, combos}, seats);
      showNotif('Search Complete', `Found ${res.matches.length} rides`, 'green');
  } catch(e) {
      showNotif('Error', e.message, 'red');
  }
}

function renderCarResults(results, seats) {
  const grid = document.getElementById('carsGrid');
  const header = document.getElementById('resultsHeader');
  header.style.display = 'flex';
  const totalResults = results.single.length + results.combos.length;
  document.getElementById('resultsCount').textContent = `${totalResults} ride${totalResults!==1?'s':''} found`;

  let html = '';
  results.single.forEach(car => {
    html += `
    <div class="glass-card car-card slide-in">
      <div class="car-card-header">
         <div class="car-info">
          <div class="car-model">${car.car}</div>
          <div class="driver-row">
            <span class="driver-name">${car.driver}</span>
          </div>
        </div>
      </div>
      <div class="car-meta">
        <div class="meta-item"><div class="meta-label">Departure</div><div class="meta-value">${new Date(car.departure).toLocaleString()}</div></div>
      </div>
      <div class="car-card-footer" style="margin-top:20px;">
        <div class="price-tag">₹${car.price} <span>for ${seats} seat${seats>1?'s':''}</span></div>
        <button class="btn btn-primary btn-sm" onclick='openBooking("${car.id}", "${car.car}", ${seats}, ${car.price})'>Book Now</button>
      </div>
    </div>`;
  });
  
  results.combos.forEach(combo => {
     html += `
    <div class="glass-card car-card combo-card slide-in">
      <div class="combo-label">MULTI-CAR COMBINATION</div>
      <div style="font-weight:700;margin-top:4px;margin-bottom:10px;">Drivers: ${combo.drivers}</div>
      <div class="car-card-footer">
        <div class="price-tag">~₹${combo.price}</div>
        <button class="btn btn-primary btn-sm" onclick='openBooking("${combo.id}", "Multi-Car Combo", ${seats}, ${combo.price})'>Book Combo</button>
      </div>
    </div>`;
  });

  if (!html) html = `<div class="glass-card" style="padding:2rem;text-align:center;grid-column:1/-1"><div style="font-size:3rem">🔍</div><div style="font-weight:700;margin-top:1rem">No rides found</div><div class="text-muted">Try different locations or fewer seats</div></div>`;
  grid.innerHTML = html;
  grid.classList.add('fade-in');
}

/* ============================================================
   BOOKING
   ============================================================ */
function openBooking(ride_id, title, seats, price) {
  state.pendingBooking = { ride_id, seats, price };
  document.getElementById('bookingSummaryContent').innerHTML = `
    <div class="summary-row"><span class="label">Trip</span><span>${title}</span></div>
    <div class="summary-row"><span class="label">💺 Seats</span><span>${seats}</span></div>
    <div class="summary-row"><span class="label">Total Amount</span><span class="text-accent">₹${price}</span></div>`;
  openModal('bookingModal');
}

async function confirmBooking() {
  closeModal('bookingModal');
  if (state.pendingBooking) {
      try {
          const res = await apiCall('/bookings/create/', 'POST', { ride_id: state.pendingBooking.ride_id, seats_booked: state.pendingBooking.seats });
          showNotif('🎉 Booking Confirmed!', 'Proceeding to payment', 'green');
          
          // Auto Simulate Payment
          const payRes = await apiCall('/payments/create/', 'POST', { booking_id: res.booking_id });
          setTimeout(()=>showNotif('💳 Payment Successful', `Transaction: ${payRes.transaction_id}`, 'purple'), 1500);
          
      } catch(e) { showNotif('Error', e.message, 'red'); }
  }
}

async function buildMyBookings() {
   try {
       const res = await apiCall('/bookings/my/');
       const grid = document.getElementById('myBookingsList');
       if (!res.bookings.length) { grid.innerHTML='<div class="glass-card" style="padding:2rem;text-align:center;grid-column:1/-1">No bookings yet</div>'; return; }
       
       grid.innerHTML = res.bookings.map(b=>`
        <div class="glass-card car-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
            <div style="font-weight:700">Driver: ${b.driver}</div>
            <span class="badge ${b.status==='Confirmed'?'badge-green':'badge-warn'}">${b.status}</span>
          </div>
          <div class="car-meta">
            <div class="meta-item"><div class="meta-label">Seats</div><div class="meta-value">💺 ${b.seats}</div></div>
            <div class="meta-item"><div class="meta-label">Total</div><div class="meta-value text-warn">₹${b.price}</div></div>
             <div class="meta-item"><div class="meta-label">Payment</div><div class="meta-value">${b.payment}</div></div>
          </div>
          ${b.status!=='cancelled' ? `<button class="btn btn-secondary btn-sm w-full" style="margin-top:0.75rem" onclick="openChat(${b.id}, '${b.driver}', 'Driver')">💬 Chat with Driver</button>` : ''}
        </div>`).join('');
   } catch (e) { showNotif('Error', 'Could not load bookings', 'red'); }
}

async function buildHistory() {
   try {
       const res = await apiCall('/bookings/my/');
       const tbody = document.getElementById('historyBody');
       const completed = res.bookings.filter(b => b.status === "Confirmed" && b.payment === "Completed");
       tbody.innerHTML = completed.map(b=>`
        <tr>
          <td>${new Date(b.departure).toLocaleDateString()}</td><td>${b.driver}</td><td>${b.destination}</td>
          <td>${b.seats}</td>
          <td class="text-warn">₹${b.price}</td>
          <td><span class="badge badge-green">Completed</span></td>
        </tr>`).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--text3)">No completed rides yet</td></tr>`;
       
       const co2 = completed.reduce((sum,b)=>sum+(b.seats*0.8),0);
       document.getElementById('co2Value').textContent = co2.toFixed(1)+' kg';
   } catch(e){}
}

/* ============================================================
   DRIVER FUNCTIONS
   ============================================================ */
async function createTrip() {
  const model = document.getElementById('d_model').value;
  const number = document.getElementById('d_number').value;
  const seats = parseInt(document.getElementById('d_seats').value);
  const price = parseInt(document.getElementById('d_price').value);
  const pickup = document.getElementById('d_pickup').value;
  const dest = document.getElementById('d_dest').value;
  
  try {
      // 1. Create Car
      const carRes = await apiCall('/driver/add-car/', 'POST', { car_model: model, car_number: number, total_seats: seats, seat_price: price, pickup_location: pickup, destination: dest });
      // 2. Schedule Ride
      await apiCall('/rides/create/', 'POST', { car_id: carRes.car_id, departure_time: new Date().toISOString() });
      
      showNotif('Trip Created!', `Your ${model} trip offer is live`, 'green');
      buildDriverTrips();
  } catch(e) { showNotif('Error', e.message, 'red'); }
}

async function buildDriverTrips() {
   try {
       const res = await apiCall('/driver/cars/');
       document.getElementById('driverTrips').innerHTML = res.cars.map(c=>`
        <div class="glass-card car-card">
          <div style="font-weight:700">${c.car_model}</div>
          <div class="font-mono text-sm text-muted">${c.car_number}</div>
          <div class="car-meta">
            <div class="meta-item"><div class="meta-label">Available Seats</div><div class="meta-value text-accent">${c.available_seats}</div></div>
            <div class="meta-item"><div class="meta-label">Price/Seat</div><div class="meta-value text-warn">₹${c.seat_price}</div></div>
          </div>
        </div>`).join('');
   } catch(e) {}
}

async function buildPassengers() {
   try {
       const res = await apiCall('/driver/passengers/');
       document.getElementById('passengerBody').innerHTML = res.passengers.map(p=>`
        <tr>
          <td><div style="font-weight:600">${p.name}</div></td>
          <td><span class="badge badge-purple">${p.gender}</span></td>
          <td>💺 ${p.seats}</td>
          <td>${p.pickup}</td>
          <td>${p.dest}</td>
          <td><span class="badge ${p.status==='confirmed'?'badge-green':p.status==='pending'?'badge-warn':'badge-red'}">${p.status}</span></td>
          <td>
            ${p.status==='pending'?`<button class="btn btn-sm btn-primary" onclick="acceptPassenger('${p.id}')">✓ Accept</button>`:''}
            ${p.status==='confirmed'?`<button class="btn btn-sm btn-secondary" onclick="openChat(${p.id}, '${p.name}', 'Client')">💬 Chat</button>`:''}
          </td>
        </tr>`).join('');
   } catch (e) { console.error(e); }
}

async function acceptPassenger(id) {
    try {
        await apiCall(`/bookings/${id}/accept/`, 'POST');
        showNotif('Passenger Accepted', 'Client has been confirmed', 'green');
        buildPassengers();
    } catch(e) { showNotif('Error', e.message, 'red'); }
}

/* ============================================================
   ADMIN FUNCTIONS
   ============================================================ */
async function loadAdminData() {
    try {
        const res = await apiCall('/admin-overview/');
        return res;
    } catch(e) { console.error(e); return {users:[], rides_admin:[]}; }
}

async function buildAdminUsers() {
   const data = await loadAdminData();
   document.getElementById('adminUsersBody').innerHTML = data.users.map(u=>`
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="user-avatar" style="width:32px;height:32px;font-size:0.8rem">${u.name[0].toUpperCase()}</div><div style="font-weight:600">${u.name}</div></div></td>
      <td><span class="badge ${u.role==='admin'?'badge-red':u.role==='driver'?'badge-purple':'badge-green'}">${u.role}</span></td>
      <td class="text-muted">${u.email}</td>
      <td><span class="status-dot ${u.status}"></span>${u.status}</td>
      <td>${u.rides}</td>
      <td><button class="btn btn-sm btn-secondary" onclick="showNotif('User Action','Admin settings not fully implemented','purple')">⚙️ Manage</button></td>
    </tr>`).join('');
}

async function buildAdminRides() {
   const data = await loadAdminData();
   document.getElementById('adminRidesBody').innerHTML = data.rides_admin.map(r=>`
    <tr>
      <td class="font-mono text-accent">${r.id}</td>
      <td>${r.driver}</td><td>${r.client}</td><td>${r.route}</td>
      <td>💺 ${r.seats}</td><td class="text-warn">₹${r.amount}</td>
      <td><span class="badge ${r.status==='completed'?'badge-green':r.status==='active'?'badge-purple':'badge-warn'}">${r.status}</span></td>
    </tr>`).join('');
}

/* ============================================================
   CHAT FUNCTIONS
   ============================================================ */
async function openChat(booking_id, other_name, other_role) {
    state.currentChatBookingId = booking_id;
    document.getElementById('chatHeaderAvatar').textContent = other_name[0].toUpperCase();
    document.getElementById('chatHeaderName').textContent = other_name;
    document.getElementById('chatHeaderSub').textContent = `🟢 Online · Your ${other_role}`;
    
    // Enable Chat Input
    document.getElementById('chatInputRow').style.opacity = '1';
    document.getElementById('chatInputRow').style.pointerEvents = 'auto';
    
    // Auto click chat tab if it exists to make it active, or just show panel natively
    document.querySelectorAll('.nav-item').forEach(i => {
        if(i.textContent.includes('Chat')) setActive(i);
    });
    showPanel('chat');
    setTitle('Chat');
    
    await loadChatMessages();
    if(state.chatPollInterval) clearInterval(state.chatPollInterval);
    state.chatPollInterval = setInterval(loadChatMessages, 3000);
}

async function loadChatMessages() {
    if(!state.currentChatBookingId) {
        document.getElementById('chatMessages').innerHTML = '<div style="text-align:center;color:var(--text3);margin-top:2rem">Select a booking to start chatting</div>';
        return;
    }
    try {
        const res = await apiCall(`/chat/${state.currentChatBookingId}/`);
        const messagesDiv = document.getElementById('chatMessages');
        let html = '';
        res.messages.forEach(m => {
            const isMe = m.sender_id === state.currentUser.id;
            const time = new Date(m.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
            if(isMe){
               html += `<div class="chat-msg sent"><div class="chat-avatar" style="background:linear-gradient(135deg,var(--accent),#00B87C);color:#0A0E1A">${m.sender_name[0].toUpperCase()}</div><div><div class="chat-bubble">${m.message}</div><div class="chat-time">${time}</div></div></div>`;
            } else {
               html += `<div class="chat-msg received"><div class="chat-avatar" style="background:linear-gradient(135deg,#6C63FF,#4A44CC)">${m.sender_name[0].toUpperCase()}</div><div><div class="chat-bubble">${m.message}</div><div class="chat-time">${time}</div></div></div>`;
            }
        });
        if(!html) html = '<div style="text-align:center;color:var(--text3);margin-top:2rem">Say hi! 👋</div>';
        
        messagesDiv.innerHTML = html;
        if(!messagesDiv.classList.contains('user-scrolled')) messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch(e) { console.error(e); }
}

async function sendChat() {
    if(!state.currentChatBookingId) return showNotif('Error', 'No chat selected', 'warn');
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if(!msg) return;
    input.value = '';
    
    try {
        await apiCall(`/chat/${state.currentChatBookingId}/send/`, 'POST', { message: msg });
        await loadChatMessages();
        const messagesDiv = document.getElementById('chatMessages');
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch(e) { showNotif('Error', e.message, 'red'); }
}

/* ============================================================
   UTILITIES & NOTIFS
   ============================================================ */
function showNotif(title, body, type='green') {
  const stack = document.getElementById('notifStack');
  const el = document.createElement('div');
  el.className = 'notif-popup';
  el.style.borderLeft = `4px solid var(--${type=== 'green' ? 'accent' : type})`;
  el.innerHTML = `<div class="notif-text"><div class="notif-title">${title}</div><div class="notif-body">${body}</div></div><span class="notif-close" onclick="this.parentElement.remove()">✕</span>`;
  stack.appendChild(el);
  setTimeout(()=>{el.classList.add('leaving');setTimeout(()=>el.remove(),300)},4000);
}

function selectPayment(el) { document.querySelectorAll('.payment-option').forEach(o=>o.classList.remove('selected')); el.classList.add('selected'); }
function setFilter(type, el) { document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active')); el.classList.add('active'); }
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function triggerSOS() { showNotif('🆘 SOS ACTIVATED', 'Police alerted.', 'red'); }
function previewCarImage(input) { document.getElementById('uploadPlaceholder').classList.add('hidden'); document.getElementById('carImagePreview').classList.remove('hidden'); }

/* ============================================================
   STARTUP
   ============================================================ */
window.addEventListener('load', () => { initCsrf(); });
document.addEventListener('keydown', e => {
  if (e.key==='Escape') document.querySelectorAll('.modal-backdrop').forEach(m=>m.classList.add('hidden'));
  if (e.key==='Enter' && document.getElementById('loginPage').style.display!=='none') doLogin();
});