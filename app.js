const newsUrl = 'data/news.json';
const geoUrl = 'https://geocoding-api.open-meteo.com/v1/search?name=Tbilisi&count=1&language=ru&format=json';

const state = {
  news: [],
  weather: null,
  lastRefresh: null,
  theme: localStorage.getItem('theme') || 'dark'
};

const el = id => document.getElementById(id);

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('theme', state.theme);
}

function formatTime(d = new Date()) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(d);
}

function formatDate(d = new Date()) {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).format(d);
}

function updateClock() {
  el('clock').textContent = formatTime();
  el('date').textContent = formatDate();
}

function renderNews(list) {
  const q = el('searchInput').value.trim().toLowerCase();
  const filtered = list.filter(item =>
    !q || `${item.title} ${item.summary} ${item.category}`.toLowerCase().includes(q)
  );

  el('newsCount').textContent = filtered.length;
  el('statusText').textContent = `Показано ${filtered.length}`;
  el('newsList').innerHTML = filtered.map(item => `
    <article class="news-item">
      <div class="meta">
        <span>${item.category}</span>
        <span>${item.time}</span>
        <span>${item.source}</span>
      </div>
      <h4>${item.title}</h4>
      <p>${item.summary}</p>
      <span class="tag">${item.tag}</span>
    </article>
  `).join('');

  const top = filtered[0] || list[0];
  if (top) {
    el('featuredTitle').textContent = top.title;
    el('featuredDesc').textContent = top.summary;
  }

  el('trendingList').innerHTML = filtered.slice(0, 4).map(item => `
    <div class="side-item">
      <h4>${item.title}</h4>
      <div class="meta"><span>${item.time}</span><span>${item.category}</span></div>
    </div>
  `).join('');

  el('aiSummary').innerHTML = filtered.length
    ? `Сегодня в центре внимания: <strong>${filtered[0].category}</strong>. 
       Главный тренд — ${filtered[0].tag}. 
       Портал показывает свежую ленту, собранную из файла <code>data/news.json</code>.`
    : 'Ничего не найдено по вашему запросу.';
}

async function loadNews() {
  const res = await fetch(newsUrl + '?v=' + Date.now());
  const data = await res.json();
  state.news = data.items || [];
  renderNews(state.news);
  state.lastRefresh = new Date();
  el('lastUpdate').textContent = formatTime(state.lastRefresh);
  el('worldBrief').textContent = data.brief || 'Мировая сводка пока недоступна.';
}

function weatherIcon(temp) {
  if (temp >= 28) return '☀️';
  if (temp >= 18) return '🌤️';
  if (temp >= 10) return '⛅';
  return '🌧️';
}

async function loadWeather() {
  const geo = await fetch(geoUrl).then(r => r.json());
  const city = geo.results?.[0];
  if (!city) return;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,wind_speed_10m,relative_humidity_2m&timezone=auto`;
  const data = await fetch(url).then(r => r.json());
  const current = data.current;

  el('weatherNow').textContent = `${Math.round(current.temperature_2m)}°C`;
  el('weatherTemp').textContent = `${Math.round(current.temperature_2m)}°`;
  el('weatherDesc').textContent = weatherIcon(current.temperature_2m) + ' Сейчас в Тбилиси';
  el('weatherWind').textContent = `${current.wind_speed_10m} км/ч`;
  el('weatherHumidity').textContent = `${current.relative_humidity_2m}%`;
  el('weatherTime').textContent = new Date(current.time).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});
  el('weatherIcon').textContent = weatherIcon(current.temperature_2m);
}

function wireEvents() {
  el('themeToggle').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
  });

  el('searchInput').addEventListener('input', () => renderNews(state.news));
  el('refreshBtn').addEventListener('click', async () => {
    await loadNews();
    await loadWeather();
  });
}

async function init() {
  applyTheme();
  updateClock();
  setInterval(updateClock, 1000);
  wireEvents();
  await loadNews();
  await loadWeather();
}

init();
