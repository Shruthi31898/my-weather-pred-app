// ============================================
// Storage Module — localStorage persistence
// ============================================

const Storage = {
  KEYS: {
    CITIES: 'agentic_weather_cities',
    UNIT: 'agentic_weather_unit',
    LAST_CITY: 'agentic_weather_last_city',
    CHAT_HISTORY: 'agentic_weather_chat'
  },

  // ---------- Favorite Cities ----------
  getCities() {
    try {
      const data = localStorage.getItem(this.KEYS.CITIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCity(city) {
    const cities = this.getCities();
    // Avoid duplicates by lat/lon
    const exists = cities.some(
      c => Math.abs(c.latitude - city.latitude) < 0.01 &&
           Math.abs(c.longitude - city.longitude) < 0.01
    );
    if (!exists) {
      cities.push({
        name: city.name,
        country: city.country || '',
        admin1: city.admin1 || '',
        latitude: city.latitude,
        longitude: city.longitude
      });
      localStorage.setItem(this.KEYS.CITIES, JSON.stringify(cities));
    }
    return !exists;
  },

  removeCity(latitude, longitude) {
    let cities = this.getCities();
    cities = cities.filter(
      c => !(Math.abs(c.latitude - latitude) < 0.01 &&
             Math.abs(c.longitude - longitude) < 0.01)
    );
    localStorage.setItem(this.KEYS.CITIES, JSON.stringify(cities));
  },

  // ---------- Temperature Unit ----------
  getUnit() {
    return localStorage.getItem(this.KEYS.UNIT) || 'celsius';
  },

  setUnit(unit) {
    localStorage.setItem(this.KEYS.UNIT, unit);
  },

  toggleUnit() {
    const current = this.getUnit();
    const next = current === 'celsius' ? 'fahrenheit' : 'celsius';
    this.setUnit(next);
    return next;
  },

  // ---------- Last Searched City ----------
  getLastCity() {
    try {
      const data = localStorage.getItem(this.KEYS.LAST_CITY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setLastCity(city) {
    localStorage.setItem(this.KEYS.LAST_CITY, JSON.stringify({
      name: city.name,
      country: city.country || '',
      admin1: city.admin1 || '',
      latitude: city.latitude,
      longitude: city.longitude
    }));
  },

  // ---------- Chat History ----------
  getChatHistory() {
    try {
      const data = sessionStorage.getItem(this.KEYS.CHAT_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addChatMessage(role, text) {
    const history = this.getChatHistory();
    history.push({ role, text, time: Date.now() });
    sessionStorage.setItem(this.KEYS.CHAT_HISTORY, JSON.stringify(history));
  },

  clearChatHistory() {
    sessionStorage.removeItem(this.KEYS.CHAT_HISTORY);
  }
};
