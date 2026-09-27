const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzlH_TqkyG8Z1NUb4Qv9hN-UYlEUbi7DlmZbIj_pFxUTGjgYh35qosSNIV77IqWDNlnuA/exec'; 

const intakeForm = document.getElementById('intakeForm');

const APP_TRANSLATIONS = window.APP_TRANSLATIONS = {
  is: { brandSubtitle:'Skólaþjónusta', eyebrow:'Stuðningur fyrir skóladaginn', title:'Hvað getum við<br><em>leyst saman?</em>', intro:'Veldu það sem þú þarft. Skýr beiðni í dag skilar hraðari lausn á morgun.', meta:'Póst-IT þjónustuborð · Kópavogur', problemTitle:'IT vandamál', problemText:'Láttu okkur vita þegar eitthvað bilar eða hagar sér undarlega.', startRequest:'Senda inn beiðni', avTitle:'A/V viðburður', avText:'Bókaðu tæki og tækniaðstoð fyrir fundi, sýningar og viðburði.', bookNow:'Bóka núna', gearTitle:'Lána tæki', gearText:'Skoðaðu laus tæki og finndu þau í geymslunni áður en þú leggur af stað.', viewGear:'Skoða tæki', guidesTitle:'Leiður & FAQ', guidesText:'Stuttar leiðbeiningar fyrir AirPlay, Teams, skjái og algeng verkefni.', openLibrary:'Opna safnið', footer:'Einföld tækni. Betri skóladagur.', inventoryEyebrow:'BÚNAÐUR Í LÁNI', inventoryTitle:'Hvað vantar þig?', inventoryIntro:'Laus búnaður í skólanum í dag.', contact:'Þarfðu aðstoð?', loading:'Sæki lagerstöðu…', available:'laus', unavailable:'í láni', cached:'Uppfært', empty:'Engin gögn fundust.' },
  en: { brandSubtitle:'School support', eyebrow:'Support for the school day', title:'What can we<br><em>solve together?</em>', intro:'Choose what you need. A clear request today means a faster fix tomorrow.', meta:'Póst-IT service desk · Kópavogur', problemTitle:'IT problem', problemText:'Tell us when something is broken or behaving strangely.', startRequest:'Send a request', avTitle:'A/V event', avText:'Book equipment and technical support for meetings, shows, and events.', bookNow:'Book now', gearTitle:'Borrow gear', gearText:'See what is available and find it in storage before you set off.', viewGear:'View equipment', guidesTitle:'Guides & FAQ', guidesText:'Short guides for AirPlay, Teams, displays, and everyday tasks.', openLibrary:'Open library', footer:'Simple technology. Better school days.', inventoryEyebrow:'EQUIPMENT LOAN', inventoryTitle:'What do you need?', inventoryIntro:'Equipment available at school today.', contact:'Need help?', loading:'Checking inventory…', available:'available', unavailable:'on loan', cached:'Updated', empty:'No inventory found.' },
  pl: { brandSubtitle:'Wsparcie szkoły', eyebrow:'Wsparcie na każdy dzień', title:'Co możemy<br><em>rozwiązać razem?</em>', intro:'Wybierz, czego potrzebujesz. Jasne zgłoszenie dziś oznacza szybsze rozwiązanie jutro.', meta:'Punkt obsługi Póst-IT · Kópavogur', problemTitle:'Problem IT', problemText:'Poinformuj nas, gdy coś nie działa lub zachowuje się nietypowo.', startRequest:'Wyślij zgłoszenie', avTitle:'Wydarzenie A/V', avText:'Zarezerwuj sprzęt i pomoc techniczną na spotkania i wydarzenia.', bookNow:'Zarezerwuj', gearTitle:'Wypożycz sprzęt', gearText:'Sprawdź dostępny sprzęt i znajdź go w magazynie.', viewGear:'Zobacz sprzęt', guidesTitle:'Poradniki i FAQ', guidesText:'Krótkie poradniki dotyczące AirPlay, Teams, ekranów i codziennych zadań.', openLibrary:'Otwórz bibliotekę', footer:'Prosta technologia. Lepszy dzień w szkole.', inventoryEyebrow:'WYPOŻYCZALNIA', inventoryTitle:'Czego potrzebujesz?', inventoryIntro:'Sprzęt dostępny dzisiaj.', contact:'Potrzebujesz pomocy?', loading:'Sprawdzanie sprzętu…', available:'dostępne', unavailable:'wypożyczone', cached:'Zaktualizowano', empty:'Brak sprzętu.' },
  pt: { brandSubtitle:'Suporte escolar', eyebrow:'Suporte para o dia escolar', title:'O que podemos<br><em>resolver juntos?</em>', intro:'Escolha o que precisa. Um pedido claro hoje traz uma solução mais rápida amanhã.', meta:'Central Póst-IT · Kópavogur', problemTitle:'Problema de TI', problemText:'Avise-nos quando algo estiver avariado ou a funcionar de forma estranha.', startRequest:'Enviar pedido', avTitle:'Evento A/V', avText:'Reserve equipamento e apoio técnico para reuniões e eventos.', bookNow:'Reservar agora', gearTitle:'Pedir equipamento', gearText:'Veja o que está disponível e encontre-o no armazém.', viewGear:'Ver equipamento', guidesTitle:'Guias e FAQ', guidesText:'Guias curtos para AirPlay, Teams, ecrãs e tarefas diárias.', openLibrary:'Abrir biblioteca', footer:'Tecnologia simples. Dias escolares melhores.', inventoryEyebrow:'EMPRÉSTIMO DE EQUIPAMENTO', inventoryTitle:'O que precisa?', inventoryIntro:'Equipamento disponível hoje.', contact:'Precisa de ajuda?', loading:'A consultar inventário…', available:'disponível', unavailable:'emprestado', cached:'Atualizado', empty:'Nenhum equipamento encontrado.' }
};

Object.assign(APP_TRANSLATIONS.is, { back:'← Til baka', adminAccess:'Admin ↗', serviceDesk:'IT þjónustuborð', ticketIntroTitle:'Segðu okkur<br><em>hvað gerðist.</em>', ticketIntroText:'Skýr lýsing hjálpar okkur að leysa vandamálið fyrr. Við sendum þér Ticket ID þegar beiðnin hefur verið skráð.', intakeStep:'01 / INTAKE', newRequest:'Ný IT beiðni', userType:'User type', selectUserType:'Veldu notendategund', student:'Student', staff:'Staff', roomNumber:'Room number', selectRoom:'Veldu stofu', assetCategory:'Asset category', selectAsset:'Veldu búnað', projector:'Projector', appleTv:'Apple TV', ipad:'iPad', laptop:'Laptop', dockingScreen:'Docking Screen', phone:'Phone', wifi:'Wi-Fi', symptom:'Symptom', submitTicket:'Skrá beiðni', secureWorkspace:'Secure workspace', ticketControl:'Ticket<br><em>control.</em>', ticketControlText:'View the live queue, move work forward, and keep the self-service library current.', addGear:'Add gear', addGuide:'Add guide', signOut:'Sign out', activeQueue:'Active queue', loadingTickets:'Loading tickets...', refresh:'↻ Refresh', tableTicket:'Ticket', roomAsset:'Room / asset', tableSymptom:'Symptom', tableStatus:'Status', tableAction:'Action', noActiveTickets:'No active tickets found.', privateArea:'PRIVATE AREA', adminAccessTitle:'Admin access', adminPasswordPrompt:'Enter the operations password stored in Google Sheets to open controls.', password:'Password', unlockWorkspace:'Unlock workspace', quickInventory:'QUICK ADD / INVENTORY', newLoanerGear:'New loaner gear', itemName:'Item name', stockCount:'Stock count', storageLocation:'Storage location', category:'Category', cancel:'Cancel', addItem:'Add item', quickLibrary:'QUICK ADD / LIBRARY', newGuide:'New guide', guideTitle:'Guide title', guideUrl:'Guide URL', audience:'Audience', addGuideAction:'Add guide' });
Object.assign(APP_TRANSLATIONS.en, { back:'← Back', adminAccess:'Admin ↗', serviceDesk:'IT service desk', ticketIntroTitle:'Tell us<br><em>what happened.</em>', ticketIntroText:'A clear description helps us solve the problem sooner. We will send you a Ticket ID when the request is logged.', intakeStep:'01 / INTAKE', newRequest:'New IT request', userType:'User type', selectUserType:'Select user type', student:'Student', staff:'Staff', roomNumber:'Room number', selectRoom:'Select room', assetCategory:'Asset category', selectAsset:'Select equipment', projector:'Projector', appleTv:'Apple TV', ipad:'iPad', laptop:'Laptop', dockingScreen:'Docking Screen', phone:'Phone', wifi:'Wi-Fi', symptom:'Symptom', submitTicket:'Submit request', secureWorkspace:'Secure workspace', ticketControl:'Ticket<br><em>control.</em>', ticketControlText:'View the live queue, move work forward, and keep the self-service library current.', addGear:'Add gear', addGuide:'Add guide', signOut:'Sign out', activeQueue:'Active queue', loadingTickets:'Loading tickets...', refresh:'↻ Refresh', tableTicket:'Ticket', roomAsset:'Room / asset', tableSymptom:'Symptom', tableStatus:'Status', tableAction:'Action', noActiveTickets:'No active tickets found.', privateArea:'PRIVATE AREA', adminAccessTitle:'Admin access', adminPasswordPrompt:'Enter the operations password stored in Google Sheets to open controls.', password:'Password', unlockWorkspace:'Unlock workspace', quickInventory:'QUICK ADD / INVENTORY', newLoanerGear:'New loaner gear', itemName:'Item name', stockCount:'Stock count', storageLocation:'Storage location', category:'Category', cancel:'Cancel', addItem:'Add item', quickLibrary:'QUICK ADD / LIBRARY', newGuide:'New guide', guideTitle:'Guide title', guideUrl:'Guide URL', audience:'Audience', addGuideAction:'Add guide' });
Object.assign(APP_TRANSLATIONS.pl, { back:'← Wstecz', adminAccess:'Admin ↗', serviceDesk:'Punkt obsługi IT', ticketIntroTitle:'Powiedz nam<br><em>co się stało.</em>', ticketIntroText:'Jasny opis pomoże nam szybciej rozwiązać problem. Po zapisaniu zgłoszenia otrzymasz Ticket ID.', intakeStep:'01 / ZGŁOSZENIE', newRequest:'Nowe zgłoszenie IT', userType:'Typ użytkownika', selectUserType:'Wybierz typ użytkownika', student:'Uczeń', staff:'Pracownik', roomNumber:'Numer sali', selectRoom:'Wybierz salę', assetCategory:'Kategoria sprzętu', selectAsset:'Wybierz sprzęt', projector:'Projektor', appleTv:'Apple TV', ipad:'iPad', laptop:'Laptop', dockingScreen:'Ekran dokujący', phone:'Telefon', wifi:'Wi-Fi', symptom:'Objaw', submitTicket:'Wyślij zgłoszenie', secureWorkspace:'Strefa bezpieczna', ticketControl:'Panel<br><em>zgłoszeń.</em>', ticketControlText:'Przeglądaj kolejkę i prowadź zadania do rozwiązania.', addGear:'Dodaj sprzęt', addGuide:'Dodaj poradnik', signOut:'Wyloguj', activeQueue:'Aktywna kolejka', loadingTickets:'Ładowanie zgłoszeń...', refresh:'↻ Odśwież', tableTicket:'Zgłoszenie', roomAsset:'Sala / sprzęt', tableSymptom:'Objaw', tableStatus:'Status', tableAction:'Akcja', noActiveTickets:'Brak aktywnych zgłoszeń.', privateArea:'STREFA PRYWATNA', adminAccessTitle:'Dostęp administratora', adminPasswordPrompt:'Wpisz hasło zapisane w Arkuszu Google.', password:'Hasło', unlockWorkspace:'Odblokuj panel', quickInventory:'SZYBKIE DODAWANIE / SPRZĘT', newLoanerGear:'Nowy sprzęt do wypożyczenia', itemName:'Nazwa sprzętu', stockCount:'Liczba sztuk', storageLocation:'Miejsce przechowywania', category:'Kategoria', cancel:'Anuluj', addItem:'Dodaj przedmiot', quickLibrary:'SZYBKIE DODAWANIE / BIBLIOTEKA', newGuide:'Nowy poradnik', guideTitle:'Tytuł poradnika', guideUrl:'Adres poradnika', audience:'Odbiorcy', addGuideAction:'Dodaj poradnik' });
Object.assign(APP_TRANSLATIONS.pt, { back:'← Voltar', adminAccess:'Admin ↗', serviceDesk:'Central de suporte TI', ticketIntroTitle:'Diga-nos<br><em>o que aconteceu.</em>', ticketIntroText:'Uma descrição clara ajuda-nos a resolver o problema mais depressa. Enviaremos um Ticket ID quando o pedido for registado.', intakeStep:'01 / PEDIDO', newRequest:'Novo pedido de TI', userType:'Tipo de utilizador', selectUserType:'Escolha o tipo de utilizador', student:'Aluno', staff:'Funcionário', roomNumber:'Número da sala', selectRoom:'Escolha a sala', assetCategory:'Categoria do equipamento', selectAsset:'Escolha o equipamento', projector:'Projetor', appleTv:'Apple TV', ipad:'iPad', laptop:'Portátil', dockingScreen:'Ecrã de base', phone:'Telefone', wifi:'Wi-Fi', symptom:'Sintoma', submitTicket:'Enviar pedido', secureWorkspace:'Área segura', ticketControl:'Controlo de<br><em>pedidos.</em>', ticketControlText:'Veja a fila ativa e avance os trabalhos até à solução.', addGear:'Adicionar equipamento', addGuide:'Adicionar guia', signOut:'Sair', activeQueue:'Fila ativa', loadingTickets:'A carregar pedidos...', refresh:'↻ Recarregar', tableTicket:'Pedido', roomAsset:'Sala / equipamento', tableSymptom:'Sintoma', tableStatus:'Estado', tableAction:'Ação', noActiveTickets:'Nenhum pedido ativo.', privateArea:'ÁREA PRIVADA', adminAccessTitle:'Acesso de administrador', adminPasswordPrompt:'Insira a palavra-passe armazenada nas Folhas do Google.', password:'Palavra-passe', unlockWorkspace:'Desbloquear área', quickInventory:'ADICIONAR / INVENTÁRIO', newLoanerGear:'Novo equipamento', itemName:'Nome do item', stockCount:'Quantidade', storageLocation:'Local de armazenamento', category:'Categoria', cancel:'Cancelar', addItem:'Adicionar item', quickLibrary:'ADICIONAR / BIBLIOTECA', newGuide:'Novo guia', guideTitle:'Título do guia', guideUrl:'URL do guia', audience:'Público-alvo', addGuideAction:'Adicionar guia' });

const ROOMS = [
  'Info', 'Matsalur', 'Starfsmannastofa',
  '1001', '1002', '1010', '1011', '1019', '1020', '1021', '1023', '1024', '1025', '1026', '1048', '1049', '1053', '1062', '1068', '1069', '1070', '1071', '1075', '1076', '1087',
  '2001', '2002', '2010', '2011', '2019', '2020', '2021', '2023', '2024', '2025', '2026', '2047', '2048', '2049', '2053', '2059', '2060', '2061', '2062', '2077', '2083', '2084', '2086', '2089', '2091', '2092', '2093'
];

function populateRoomDatalists() {
  const roomDatalist = document.getElementById('roomOptions');
  const bookingDatalist = document.getElementById('bookingRoomOptions');

  const optionsHtml = ROOMS.map(room => `<option value="${room}"></option>`).join('');
  
  if (roomDatalist) roomDatalist.innerHTML = optionsHtml;
  if (bookingDatalist) bookingDatalist.innerHTML = optionsHtml;
}

function prefillIntakeFormFromUrl() {
  if (!intakeForm) return;
  const urlParams = new URLSearchParams(window.location.search);
  
  const userType = urlParams.get('userType');
  const room = urlParams.get('room');
  const category = urlParams.get('category');
  const symptom = urlParams.get('symptom');

  if (userType && intakeForm.elements['userType']) {
    intakeForm.elements['userType'].value = userType;
  }

  if (category && intakeForm.elements['category']) {
    let option = [...intakeForm.elements['category'].options].find(o => o.value === category);
    if (!option) {
      option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      intakeForm.elements['category'].appendChild(option);
    }
    intakeForm.elements['category'].value = category;
  }

  if (room && intakeForm.elements['room']) {
    intakeForm.elements['room'].value = room;
  }

  if (symptom && intakeForm.elements['symptom']) {
    intakeForm.elements['symptom'].value = symptom;
  }
}

function initializeRooms() {
  prefillIntakeFormFromUrl();
  populateRoomDatalists();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRooms);
} else {
  initializeRooms();
}

function populateTimeSelects() {
  document.querySelectorAll('select[data-time-select]').forEach(select => {
    const defaultValue = select.dataset.timeDefault || '08:00';
    select.innerHTML = '';
    for (let minutes = 8 * 60; minutes <= 22 * 60; minutes += 30) {
      const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
      const remainder = String(minutes % 60).padStart(2, '0');
      const value = `${hours}:${remainder}`;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      option.selected = value === defaultValue;
      select.appendChild(option);
    }
  });
  window.updateTranslations?.();
}

populateTimeSelects();

if (intakeForm) {
  const formMessage = document.getElementById('formMessage');
  const submitButton = intakeForm.querySelector('.submit-button');

  function createTicketId() {
    const date = new Date();
    const stamp = date.toISOString().slice(0, 10).replaceAll('-', '');
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `PIT-${stamp}-${suffix}`;
  }

  async function submitTicket(payload) {
    if (!APPS_SCRIPT_URL) {
      await new Promise(resolve => setTimeout(resolve, 450));
      return { ticketId: payload.ticketId, demo: true };
    }
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('The ticket could not be saved.');
    const result = await response.json();
    if (result.status === 'busy') throw new Error('System busy. Please try submitting again in a moment.');
    if (result.ok !== true && result.result !== 'success') throw new Error(result.error || 'The ticket could not be saved.');
    return result;
  }

  intakeForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!intakeForm.reportValidity()) return;

    let lastSubmit = null;
    try {
      lastSubmit = sessionStorage.getItem('lastTicketSubmit');
    } catch (_) {}

    if (lastSubmit && (Date.now() - Number(lastSubmit) < 30000)) {
      formMessage.className = 'form-message is-error';
      formMessage.textContent = 'A ticket was submitted recently. Please wait a moment before submitting again.';
      return;
    }

    const data = new FormData(intakeForm);
    const payload = { 
      ticketId: createTicketId(), 
      timestamp: new Date().toISOString(), 
      userType: data.get('userType'), 
      room: data.get('room'), 
      category: data.get('category'), 
      symptom: data.get('symptom'), 
      status: 'New', 
      notes: '' 
    };
    
    submitButton.disabled = true;
    formMessage.className = 'form-message is-loading';
    formMessage.textContent = 'Skrái beiðni…';
    try {
      const result = await submitTicket(payload);
      try {
        sessionStorage.setItem('lastTicketSubmit', Date.now().toString());
      } catch (_) {}
      formMessage.className = 'form-message is-success';
      formMessage.textContent = `${result.demo ? 'Demo: ' : ''}Beiðni skráð · ${payload.ticketId}`;
      intakeForm.reset();
    } catch (error) {
      formMessage.className = 'form-message is-error';
      formMessage.textContent = error.message;
    } finally { 
      submitButton.disabled = false; 
    }
  });
}

const ADMIN_SESSION_KEY = 'postItAdminSession';
const adminShell = document.getElementById('adminShell');

if (adminShell) {
  const loginModal = document.getElementById('loginModal');
  const ticketRows = document.getElementById('ticketRows');
  const adminEmpty = document.getElementById('adminEmpty');
  const queueSummary = document.getElementById('queueSummary');
  const loginError = document.getElementById('loginError');
  let adminTickets = [];
  let isFetchingTickets = false;

  const isAdmin = () => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'active';
    } catch (_) {
      return false;
    }
  };

  const formatDate = value => { 
    const date = new Date(value); 
    return Number.isNaN(date.valueOf()) ? value || '—' : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); 
  };
  
  const statusOptions = current => ['New', 'In Progress', 'Escalated', 'Complete'].map(status => `<option ${status === current ? 'selected' : ''}>${status}</option>`).join('');

  function openAdmin() { 
    adminShell.hidden = false; 
    const ticketShell = document.querySelector('.ticket-shell');
    if (ticketShell) ticketShell.hidden = true; 
    loadAdminTickets(); 
  }

  function renderAdminTickets() { 
    ticketRows.innerHTML = adminTickets.map((ticket, index) => { 
      const status = ticket.Status || ticket.status || 'New'; 
      return `<tr data-index="${index}">
        <td><strong>${ticket.TicketID || ticket.ticketId || '—'}</strong><small>${formatDate(ticket.Timestamp || ticket.timestamp)}</small></td>
        <td><strong>${ticket.Room || ticket.room || '—'}</strong><small>${ticket.Category || ticket.category || '—'}</small></td>
        <td class="symptom-cell">${ticket.Symptom || ticket.symptom || '—'}</td>
        <td><select class="status-select" aria-label="Ticket status">${statusOptions(status)}</select></td>
        <td>
          <button class="save-status" type="button">Save</button>
          ${status === 'Complete' ? '<button class="clear-ticket" type="button">Clear</button>' : ''}
        </td>
      </tr>`; 
    }).join(''); 
    window.updateTranslations?.();
    adminEmpty.hidden = adminTickets.length > 0; 
    queueSummary.textContent = `${adminTickets.length} active ticket${adminTickets.length === 1 ? '' : 's'}`; 
  }

    async function adminPost(action, payload = {}) { 
    const pass = sessionStorage.getItem('postItAdminPass');
    const response = await fetch(APPS_SCRIPT_URL, { 
      method: 'POST', 
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
      body: JSON.stringify({ action, pass, ...payload }) 
    }); 
    if (!response.ok) throw new Error('The request failed.'); 
    const result = await response.json(); 
    if (result.status === 'busy') throw new Error('Server busy. Please try again.');
    if (result.ok !== true && result.result !== 'success') throw new Error(result.error || 'The request failed.'); 
    return result; 
  }

  async function loadAdminTickets() { 
    if (isFetchingTickets) return;
    isFetchingTickets = true;
    queueSummary.textContent = 'Loading tickets...'; 
    try { 
      const pass = sessionStorage.getItem('postItAdminPass');
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getTickets&pass=${pass}`, { cache: 'default' }); 
      if (!response.ok) throw new Error('Unable to load tickets.'); 
      const data = await response.json(); 
      adminTickets = Array.isArray(data) ? data : data.tickets || data.data || []; 
      renderAdminTickets(); 
    } catch (error) { 
      queueSummary.textContent = error.message; 
      adminTickets = []; 
      renderAdminTickets(); 
    } finally {
      isFetchingTickets = false;
    }
  }

  const adminTrigger = document.getElementById('adminTrigger');
  if (adminTrigger) {
    adminTrigger.addEventListener('click', () => { 
      if (isAdmin()) openAdmin(); 
      else loginModal.showModal(); 
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async event => { 
      event.preventDefault(); 
      const passwordInput = document.getElementById('adminPassword'); 
      loginError.textContent = 'Verifying password...';
      
      try {
        const pass = passwordInput.value;
        const res = await adminPost('verifyPassword', { password: pass });
        if (res.ok) {
          try {
            sessionStorage.setItem(ADMIN_SESSION_KEY, 'active'); 
            sessionStorage.setItem('postItAdminPass', pass);
          } catch (_) {}
          passwordInput.value = ''; 
          loginError.textContent = ''; 
          loginModal.close(); 
          openAdmin(); 
        } else {
          loginError.textContent = res.error || 'Incorrect password.';
        }
      } catch (err) {
        loginError.textContent = 'Password verification error.';
      }
    });
  }

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => { 
      try {
        sessionStorage.removeItem(ADMIN_SESSION_KEY); 
      } catch (_) {}
      adminShell.hidden = true; 
      const ticketShell = document.querySelector('.ticket-shell');
      if (ticketShell) ticketShell.hidden = false; 
    });
  }

  const refreshAdmin = document.getElementById('refreshAdmin');
  if (refreshAdmin) refreshAdmin.addEventListener('click', loadAdminTickets);

  ticketRows.addEventListener('click', async event => { 
    const button = event.target.closest('button');
    if (!button) return;

    const row = button.closest('tr'); 
    if (!row) return; 

    const ticket = adminTickets[Number(row.dataset.index)]; 
    const ticketId = ticket.TicketID || ticket.ticketId; 
    
    try { 
      button.disabled = true; 
      if (button.classList.contains('save-status')) {
        const selectedStatus = row.querySelector('.status-select').value;
        await adminPost('updateTicket', { ticketId, status: selectedStatus }); 
      }
      if (button.classList.contains('clear-ticket')) {
        await adminPost('clearTicket', { ticketId }); 
      }
      await loadAdminTickets(); 
    } catch (error) { 
      queueSummary.textContent = error.message; 
      button.disabled = false; 
    } 
  });

  document.querySelectorAll('[data-modal]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.modal).showModal()));
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));

  document.querySelectorAll('.quick-form').forEach(form => form.addEventListener('submit', async event => { 
    event.preventDefault(); 
    const submit = form.querySelector('.submit-button'); 
    const data = Object.fromEntries(new FormData(form)); 
    submit.disabled = true; 
    try { 
      await adminPost(form.dataset.action, data); 
      form.closest('dialog').close(); 
      form.reset(); 
      queueSummary.textContent = 'Saved successfully'; 
    } catch (error) { 
      queueSummary.textContent = error.message; 
    } finally { 
      submit.disabled = false; 
    } 
  }));

  if (isAdmin()) openAdmin();
  else if (window.location.hash === '#adminShell') loginModal.showModal();
}

const settingsForm = document.getElementById('settingsForm');
if (settingsForm) {
  const settingsMessage = document.getElementById('settingsMessage');
  const emailInput = settingsForm.elements.AdminNotificationEmail;
  
    async function loadSettings() {
    const pass = sessionStorage.getItem('postItAdminPass');
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getSettings&pass=${pass}`, { cache: 'default' });
      if (!response.ok) throw new Error('Unable to load settings.');
      const settings = await response.json();
      emailInput.value = settings.AdminNotificationEmail || '';
    } catch (error) {
      settingsMessage.textContent = error.message;
      settingsMessage.className = 'form-message is-error';
    }
  }

  settingsForm.addEventListener('submit', async event => {
    event.preventDefault();
    const saveButton = settingsForm.querySelector('button[type="submit"]');
    const pass = sessionStorage.getItem('postItAdminPass');
    saveButton.disabled = true;
    settingsMessage.textContent = 'Saving settings...';
    try {
      const response = await fetch(APPS_SCRIPT_URL, { 
        method: 'POST', 
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
        body: JSON.stringify({ 
          action: 'saveSettings', 
          pass: pass,
          settings: { 
            AdminNotificationEmail: emailInput.value.trim()
          } 
        }) 
      });
      const result = await response.json();
      if (result.ok !== true) throw new Error(result.error || 'Unable to save settings.');
      
      settingsMessage.textContent = 'Settings saved.';
      settingsMessage.className = 'form-message is-success';
    } catch (error) {
      settingsMessage.textContent = error.message;
      settingsMessage.className = 'form-message is-error';
    } finally {
      saveButton.disabled = false;
    }
  });
  loadSettings();
}