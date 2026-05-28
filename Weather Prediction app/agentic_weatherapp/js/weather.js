// ============================================
// Weather API Module — Open-Meteo Integration
// No API key required!
// ============================================

const WeatherAPI = {
  BASE_URL: 'https://api.open-meteo.com/v1/forecast',
  GEO_URL: 'https://geocoding-api.open-meteo.com/v1/search',

  // Weather code mapping to descriptions & icons
  WEATHER_CODES: {
    0:  { desc: 'Clear Sky',           icon: '☀️', group: 'sunny' },
    1:  { desc: 'Mainly Clear',        icon: '🌤️', group: 'sunny' },
    2:  { desc: 'Partly Cloudy',       icon: '⛅',  group: 'cloudy' },
    3:  { desc: 'Overcast',            icon: '☁️', group: 'cloudy' },
    45: { desc: 'Fog',                 icon: '🌫️', group: 'cloudy' },
    48: { desc: 'Depositing Rime Fog', icon: '🌫️', group: 'cloudy' },
    51: { desc: 'Light Drizzle',       icon: '🌦️', group: 'rainy' },
    53: { desc: 'Moderate Drizzle',    icon: '🌦️', group: 'rainy' },
    55: { desc: 'Dense Drizzle',       icon: '🌧️', group: 'rainy' },
    56: { desc: 'Freezing Drizzle',    icon: '🌧️', group: 'rainy' },
    57: { desc: 'Heavy Freezing Drizzle', icon: '🌧️', group: 'rainy' },
    61: { desc: 'Slight Rain',         icon: '🌦️', group: 'rainy' },
    63: { desc: 'Moderate Rain',       icon: '🌧️', group: 'rainy' },
    65: { desc: 'Heavy Rain',          icon: '🌧️', group: 'rainy' },
    66: { desc: 'Freezing Rain',       icon: '🌧️', group: 'rainy' },
    67: { desc: 'Heavy Freezing Rain', icon: '🌧️', group: 'rainy' },
    71: { desc: 'Slight Snowfall',     icon: '🌨️', group: 'snowy' },
    73: { desc: 'Moderate Snowfall',   icon: '🌨️', group: 'snowy' },
    75: { desc: 'Heavy Snowfall',      icon: '❄️', group: 'snowy' },
    77: { desc: 'Snow Grains',         icon: '❄️', group: 'snowy' },
    80: { desc: 'Slight Rain Showers', icon: '🌦️', group: 'rainy' },
    81: { desc: 'Moderate Rain Showers', icon: '🌧️', group: 'rainy' },
    82: { desc: 'Violent Rain Showers', icon: '⛈️', group: 'rainy' },
    85: { desc: 'Slight Snow Showers', icon: '🌨️', group: 'snowy' },
    86: { desc: 'Heavy Snow Showers',  icon: '❄️', group: 'snowy' },
    95: { desc: 'Thunderstorm',        icon: '⛈️', group: 'rainy' },
    96: { desc: 'Thunderstorm with Hail', icon: '⛈️', group: 'rainy' },
    99: { desc: 'Thunderstorm with Heavy Hail', icon: '⛈️', group: 'rainy' },
  },

  getWeatherInfo(code) {
    return this.WEATHER_CODES[code] || { desc: 'Unknown', icon: '🌡️', group: 'cloudy' };
  },

  // ---------- Geocoding ----------
  async geocodeCity(name) {
    try {
      const res = await fetch(`${this.GEO_URL}?name=${encodeURIComponent(name)}&count=5&language=en&format=json`);
      if (!res.ok) throw new Error('Geocoding failed');
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.error('Geocode error:', err);
      return [];
    }
  },

  // ---------- Get User Location ----------
  getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  },

  // ---------- Reverse geocode (coordinates → city name) ----------
  async reverseGeocode(lat, lon) {
    // Try BigDataCloud
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      if (!res.ok) throw new Error('BigDataCloud failed');
      const data = await res.json();
      
      const cityName = data.city || data.locality || data.principalSubdivision || 'My Location';
      const admin1 = data.city ? data.principalSubdivision : '';
      const country = data.countryName || '';
      
      return {
        name: cityName,
        country: country,
        admin1: admin1,
        latitude: lat,
        longitude: lon
      };
    } catch (err) {
      console.warn('BigDataCloud geocoder failed, trying OpenStreetMap Nominatim...', err);
      
      // Fallback: OpenStreetMap Nominatim
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        if (!res.ok) throw new Error('OSM Nominatim failed');
        const data = await res.json();
        
        const addr = data.address || {};
        const cityName = addr.city || addr.town || addr.village || addr.suburb || 'My Location';
        const admin1 = addr.state || '';
        const country = addr.country || '';
        
        return {
          name: cityName,
          country: country,
          admin1: admin1,
          latitude: lat,
          longitude: lon
        };
      } catch (err2) {
        console.error('All reverse geocoders failed:', err2);
        return { 
          name: 'My Location', 
          country: '', 
          admin1: '', 
          latitude: lat, 
          longitude: lon 
        };
      }
    }
  },

  // ---------- Fetch Complete Weather Data ----------
  async fetchWeather(latitude, longitude, unit = 'celsius') {
    const tempUnit = unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    const windUnit = unit === 'fahrenheit' ? 'mph' : 'kmh';
    const precipUnit = unit === 'fahrenheit' ? 'inch' : 'mm';

    const params = new URLSearchParams({
      latitude,
      longitude,
      current: [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
        'is_day', 'precipitation', 'rain', 'weather_code',
        'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
        'surface_pressure', 'cloud_cover', 'uv_index'
      ].join(','),
      hourly: [
        'temperature_2m', 'relative_humidity_2m', 'precipitation_probability',
        'precipitation', 'weather_code', 'wind_speed_10m',
        'uv_index', 'is_day'
      ].join(','),
      daily: [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min',
        'apparent_temperature_max', 'apparent_temperature_min',
        'sunrise', 'sunset', 'uv_index_max',
        'precipitation_sum', 'precipitation_probability_max',
        'wind_speed_10m_max'
      ].join(','),
      temperature_unit: tempUnit,
      wind_speed_unit: windUnit,
      precipitation_unit: precipUnit,
      timezone: 'auto',
      forecast_days: 7
    });

    try {
      const res = await fetch(`${this.BASE_URL}?${params}`);
      if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
      const data = await res.json();
      return this.processWeatherData(data, unit);
    } catch (err) {
      console.error('Weather fetch error:', err);
      throw err;
    }
  },

  // ---------- Process Raw API Data ----------
  processWeatherData(raw, unit) {
    const unitSymbol = unit === 'fahrenheit' ? '°F' : '°C';
    const windSymbol = unit === 'fahrenheit' ? 'mph' : 'km/h';
    const precipSymbol = unit === 'fahrenheit' ? 'in' : 'mm';

    // Current weather
    const current = {
      temp: Math.round(raw.current.temperature_2m),
      feelsLike: Math.round(raw.current.apparent_temperature),
      humidity: raw.current.relative_humidity_2m,
      windSpeed: Math.round(raw.current.wind_speed_10m),
      windGusts: Math.round(raw.current.wind_gusts_10m || 0),
      windDir: raw.current.wind_direction_10m,
      pressure: Math.round(raw.current.surface_pressure),
      cloudCover: raw.current.cloud_cover,
      uvIndex: raw.current.uv_index || 0,
      isDay: raw.current.is_day === 1,
      precipitation: raw.current.precipitation,
      weatherCode: raw.current.weather_code,
      weatherInfo: this.getWeatherInfo(raw.current.weather_code),
      unitSymbol,
      windSymbol,
      precipSymbol
    };

    // Hourly (next 24 hours)
    const now = new Date();
    const currentHourIndex = raw.hourly.time.findIndex(t => new Date(t) >= now);
    const startIdx = Math.max(0, currentHourIndex);
    const hourly = [];
    for (let i = startIdx; i < Math.min(startIdx + 24, raw.hourly.time.length); i++) {
      const time = new Date(raw.hourly.time[i]);
      hourly.push({
        time: time,
        timeStr: time.getHours() === new Date().getHours() && time.getDate() === new Date().getDate()
          ? 'Now'
          : time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        temp: Math.round(raw.hourly.temperature_2m[i]),
        precipProb: raw.hourly.precipitation_probability[i] || 0,
        precipitation: raw.hourly.precipitation[i] || 0,
        weatherCode: raw.hourly.weather_code[i],
        weatherInfo: this.getWeatherInfo(raw.hourly.weather_code[i]),
        windSpeed: Math.round(raw.hourly.wind_speed_10m[i]),
        uvIndex: raw.hourly.uv_index[i] || 0,
        isDay: raw.hourly.is_day[i] === 1,
        isNow: i === startIdx
      });
    }

    // Daily (7 days)
    const daily = raw.daily.time.map((dateStr, i) => {
      const date = new Date(dateStr);
      const isToday = date.toDateString() === now.toDateString();
      const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

      return {
        date: date,
        dayName: isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString([], { weekday: 'short' }),
        dateStr: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        tempMax: Math.round(raw.daily.temperature_2m_max[i]),
        tempMin: Math.round(raw.daily.temperature_2m_min[i]),
        feelsMax: Math.round(raw.daily.apparent_temperature_max[i]),
        feelsMin: Math.round(raw.daily.apparent_temperature_min[i]),
        weatherCode: raw.daily.weather_code[i],
        weatherInfo: this.getWeatherInfo(raw.daily.weather_code[i]),
        sunrise: new Date(raw.daily.sunrise[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        sunset: new Date(raw.daily.sunset[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        uvMax: raw.daily.uv_index_max[i],
        precipSum: raw.daily.precipitation_sum[i],
        precipProb: raw.daily.precipitation_probability_max[i] || 0,
        windMax: Math.round(raw.daily.wind_speed_10m_max[i])
      };
    });

    // Temp range for bar scaling
    const allTemps = daily.flatMap(d => [d.tempMax, d.tempMin]);
    const globalMin = Math.min(...allTemps);
    const globalMax = Math.max(...allTemps);

    daily.forEach(d => {
      const range = globalMax - globalMin || 1;
      d.barLeft = ((d.tempMin - globalMin) / range) * 100;
      d.barWidth = ((d.tempMax - d.tempMin) / range) * 100;
    });

    return { current, hourly, daily, unitSymbol, windSymbol, precipSymbol, raw };
  }
};
