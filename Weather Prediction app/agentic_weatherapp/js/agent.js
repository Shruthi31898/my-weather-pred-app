// ============================================
// AI Weather Agent — Smart Analysis & Chat
// Rule-based NLP agent with weather intelligence
// ============================================

const WeatherAgent = {
  name: 'WeatherMind',

  // ---------- Generate Proactive Insight ----------
  generateInsight(weatherData) {
    if (!weatherData) return { title: 'Waiting for data...', text: 'Search a city to get started.', tags: [] };

    const { current, hourly, daily } = weatherData;
    const insights = [];
    const tags = [];

    // Heatwave / extreme heat insight (prioritize this)
    if (current.temp >= 40) {
      insights.push(`🔥 Extreme heatwave conditions at ${current.temp}${weatherData.unitSymbol}! Stay indoors, drink plenty of water, and avoid direct sun exposure. This is dangerously hot.`);
      tags.push('🥤 Hydrate frequently');
      tags.push('🏠 Stay indoors');
    } else if (current.temp >= 35) {
      insights.push(`High heat at ${current.temp}${weatherData.unitSymbol}. Avoid prolonged outdoor activity, stay hydrated, and seek shade when outside.`);
      tags.push('💧 Stay hydrated');
      tags.push('🕶️ Seek shade');
    }

    // Temperature changes
    if (hourly.length > 6) {
      const futureTemps = hourly.slice(3, 8).map(h => h.temp);
      const avgFuture = futureTemps.reduce((a, b) => a + b, 0) / futureTemps.length;
      const diff = avgFuture - current.temp;

      if (diff <= -5) {
        // Context-aware: don't say "bring layers" if it's still hot after the drop
        if (avgFuture >= 28) {
          insights.push(`Temperature will ease by ${Math.abs(Math.round(diff))}° in the coming hours, offering some relief from the heat.`);
          tags.push('🌡️ Slight relief ahead');
        } else if (avgFuture >= 15) {
          insights.push(`Temperature is expected to drop by ${Math.abs(Math.round(diff))}° in the next few hours. It'll be pleasant — a light layer might be handy.`);
          tags.push('👕 Light layer');
        } else {
          insights.push(`Temperature is expected to drop by ${Math.abs(Math.round(diff))}° in the next few hours. Consider layering up before heading out.`);
          tags.push('🧥 Bring layers');
        }
      } else if (diff >= 5) {
        insights.push(`It's going to warm up by about ${Math.round(diff)}° in the coming hours. Stay hydrated!`);
        tags.push('💧 Stay hydrated');
      }
    }

    // Rain & Outdoor Suitability analysis
    const rainHours = hourly.filter(h => h.precipProb > 50);
    const isVeryHot = current.temp >= 35;
    const isVeryCold = current.temp <= 5;
    const isVeryWindy = current.windSpeed > 40;
    const isRaining = rainHours.length > 0 && rainHours[0].isNow;

    if (rainHours.length > 0) {
      const firstRain = rainHours[0];
      if (firstRain.isNow) {
        insights.push(`Rain is falling right now with ${current.precipitation}${weatherData.precipSymbol} recorded. It's a good idea to stay indoors or carry an umbrella.`);
        tags.push('🏠 Stay indoors');
      } else {
        insights.push(`Rain is likely around ${firstRain.timeStr} with ${firstRain.precipProb}% probability. Plan your outdoor activities accordingly.`);
      }
      tags.push('☂️ Carry umbrella');
    } else {
      if (isVeryHot) {
        insights.push(`Although no rain is expected, the extreme temperature makes outdoor activities unsafe.`);
      } else if (isVeryCold) {
        insights.push(`No precipitation is expected, but freezing temperatures make it unsafe for outdoor stays.`);
      } else if (isVeryWindy) {
        insights.push(`No rain is expected, but high winds make it unsafe for outdoor activities.`);
      } else {
        insights.push(`No significant rain expected in the next 24 hours. Great conditions for outdoor activities!`);
        tags.push('🌞 Go outdoors');
      }
    }

    // UV Index warning
    if (current.uvIndex >= 8) {
      insights.push(`UV Index is very high at ${current.uvIndex}. Limit sun exposure between 10 AM - 4 PM and apply SPF 30+ sunscreen.`);
      tags.push('🕶️ High UV - Wear sunscreen');
    } else if (current.uvIndex >= 5) {
      tags.push('🧴 Moderate UV');
    }

    // Wind analysis
    if (current.windSpeed > 40) {
      insights.push(`Strong winds of ${current.windSpeed} ${weatherData.windSymbol} detected. Secure loose outdoor items.`);
      tags.push('💨 Strong winds');
    }

    // Weekend outlook
    const today = new Date().getDay();
    if (today >= 4 && today <= 5 && daily.length >= 3) { // Thursday or Friday
      const weekend = daily.slice(-2);
      const goodWeekend = weekend.every(d => d.precipProb < 40 && d.weatherCode < 50);
      if (goodWeekend) {
        insights.push(`Weekend outlook looks pleasant with clear skies. Perfect for outdoor plans! 🎉`);
        tags.push('🌴 Great weekend ahead');
      } else {
        insights.push(`Weekend may see some unsettled weather. Have backup indoor plans ready.`);
      }
    }

    // Feels like vs actual
    const feelsDiff = Math.abs(current.feelsLike - current.temp);
    if (feelsDiff >= 5) {
      if (current.feelsLike < current.temp) {
        insights.push(`It feels ${feelsDiff}° colder than the actual temperature due to wind chill.`);
        tags.push('🥶 Wind chill');
      } else {
        insights.push(`It feels ${feelsDiff}° warmer than the actual temperature due to humidity.`);
        tags.push('🥵 Feels warmer');
      }
    }

    // If no specific insights, give general one
    if (insights.length === 0) {
      insights.push(`Current conditions are moderate at ${current.temp}${weatherData.unitSymbol}. A comfortable day overall.`);
      tags.push('✅ Normal conditions');
    }

    // Deduplicate and resolve conflicting tags
    const uniqueTags = [...new Set(tags)];
    let finalTags = uniqueTags;
    if (finalTags.includes('🏠 Stay indoors')) {
      finalTags = finalTags.filter(t => t !== '🌞 Go outdoors' && t !== '🕶️ Seek shade');
    }

    return {
      title: this._getInsightTitle(current),
      text: insights.slice(0, 3).join(' '),
      tags: finalTags.slice(0, 4)
    };
  },

  _getInsightTitle(current) {
    if (current.weatherInfo.group === 'rainy') return '🌧️ Rainy Conditions Detected';
    if (current.weatherInfo.group === 'snowy') return '❄️ Snowfall Detected';
    if (current.temp >= 35) return '🔥 Extreme Heat Alert';
    if (current.temp <= 0) return '🥶 Freezing Conditions';
    if (current.uvIndex >= 8) return '☀️ High UV Warning';
    if (current.windSpeed > 40) return '💨 High Wind Advisory';
    if (!current.isDay) return '🌙 Evening Weather Brief';
    return '🤖 Today\'s Weather Intelligence';
  },

  // ---------- Generate Weather Alerts ----------
  generateAlerts(weatherData) {
    if (!weatherData) return [];
    const { current, hourly, daily } = weatherData;
    const alerts = [];

    // Extreme temperature
    if (current.temp >= 40) {
      alerts.push({ type: 'danger', icon: '🔥', title: 'Extreme Heat', text: `Temperature is ${current.temp}${weatherData.unitSymbol}. Stay indoors, hydrate frequently.` });
    } else if (current.temp >= 35) {
      alerts.push({ type: 'warning', icon: '🌡️', title: 'High Temperature', text: `Temperature is ${current.temp}${weatherData.unitSymbol}. Avoid prolonged outdoor exposure.` });
    }

    if (current.temp <= -10) {
      alerts.push({ type: 'danger', icon: '🥶', title: 'Extreme Cold', text: `Temperature is ${current.temp}${weatherData.unitSymbol}. Risk of frostbite. Limit time outdoors.` });
    } else if (current.temp <= 0) {
      alerts.push({ type: 'warning', icon: '❄️', title: 'Freezing', text: `Temperature is ${current.temp}${weatherData.unitSymbol}. Watch for icy conditions.` });
    }

    // High UV
    if (current.uvIndex >= 11) {
      alerts.push({ type: 'danger', icon: '☀️', title: 'Extreme UV Index', text: `UV Index is ${current.uvIndex}. Avoid sun exposure. Seek shade.` });
    } else if (current.uvIndex >= 8) {
      alerts.push({ type: 'warning', icon: '🕶️', title: 'Very High UV', text: `UV Index is ${current.uvIndex}. Wear sunscreen and protective clothing.` });
    }

    // Storm
    if ([95, 96, 99].includes(current.weatherCode)) {
      alerts.push({ type: 'danger', icon: '⛈️', title: 'Thunderstorm', text: 'Active thunderstorm in your area. Stay indoors and away from windows.' });
    }

    // Heavy rain coming
    const heavyRain = hourly.filter(h => h.precipProb >= 80 && h.precipitation > 5);
    if (heavyRain.length > 0) {
      alerts.push({ type: 'warning', icon: '🌧️', title: 'Heavy Rain Expected', text: `Heavy rainfall expected around ${heavyRain[0].timeStr}. Possible flooding in low areas.` });
    }

    // High winds
    if (current.windSpeed > 60 || current.windGusts > 80) {
      alerts.push({ type: 'danger', icon: '💨', title: 'Dangerous Winds', text: `Wind gusts up to ${current.windGusts} ${weatherData.windSymbol}. Secure outdoor items.` });
    } else if (current.windSpeed > 40) {
      alerts.push({ type: 'warning', icon: '🌬️', title: 'Strong Winds', text: `Winds at ${current.windSpeed} ${weatherData.windSymbol}. Be cautious outdoors.` });
    }

    return alerts;
  },

  // ---------- Chat Response System ----------
  handleChat(query, weatherData) {
    if (!weatherData) {
      return "I don't have weather data yet. Please search for a city first, then ask me anything! 🌍";
    }

    const q = query.toLowerCase().trim();
    const { current, hourly, daily } = weatherData;

    // --- Greeting ---
    if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))/.test(q)) {
      const greeting = current.isDay ? 'Good day' : 'Good evening';
      return `${greeting}! 👋 I'm your weather agent. Currently it's **${current.temp}${weatherData.unitSymbol}** with ${current.weatherInfo.desc.toLowerCase()}. How can I help you?`;
    }

    // --- Current temperature ---
    if (/what.*(temp|hot|cold|warm|cool)|how.*(hot|cold|warm)|temp.*now|current.*temp/.test(q)) {
      const feel = current.feelsLike !== current.temp
        ? ` It feels like **${current.feelsLike}${weatherData.unitSymbol}** due to ${current.feelsLike < current.temp ? 'wind chill' : 'humidity'}.`
        : '';
      return `The current temperature is **${current.temp}${weatherData.unitSymbol}** with ${current.weatherInfo.desc.toLowerCase()}.${feel}`;
    }

    // --- Rain / Umbrella ---
    if (/rain|umbrella|wet|pour|drizzle|shower|precip/.test(q)) {
      const rainHours = hourly.filter(h => h.precipProb > 40);
      if (rainHours.length === 0) {
        return `☀️ No rain expected in the next 24 hours! You can leave the umbrella at home.`;
      }
      const first = rainHours[0];
      if (first.isNow) {
        return `🌧️ It's currently raining (${current.precipitation}${weatherData.precipSymbol}). Definitely **carry an umbrella**! Rain is expected to continue for the next ${rainHours.length} hours.`;
      }
      return `🌂 Rain is expected around **${first.timeStr}** with **${first.precipProb}%** probability. I'd recommend carrying an umbrella just in case!`;
    }

    // --- Outdoor activity ---
    if (/outdoor|outside|walk|run|jog|exercise|picnic|park|hike|sport|play/.test(q)) {
      const goodConditions = current.weatherInfo.group === 'sunny' && current.temp > 10 && current.temp < 35 && current.uvIndex < 8 && current.windSpeed < 30;
      if (goodConditions) {
        return `✅ Great conditions for outdoor activities! **${current.temp}${weatherData.unitSymbol}** with ${current.weatherInfo.desc.toLowerCase()}. ${current.uvIndex >= 5 ? '🧴 Don\'t forget sunscreen (UV: ' + current.uvIndex + ').' : 'Enjoy your time outside!'}`;
      }

      let reason = '';
      if (current.weatherInfo.group === 'rainy') reason = 'it\'s currently raining';
      else if (current.temp >= 35) reason = 'it\'s too hot';
      else if (current.temp <= 5) reason = 'it\'s quite cold';
      else if (current.windSpeed > 30) reason = 'winds are strong';
      else if (current.uvIndex >= 8) reason = 'UV levels are very high';
      else reason = 'conditions aren\'t ideal';

      // Find a better time
      const betterHours = hourly.filter(h =>
        h.weatherInfo.group === 'sunny' && h.temp > 10 && h.temp < 35 && h.precipProb < 30
      );
      const suggestion = betterHours.length > 0
        ? ` A better time would be around **${betterHours[0].timeStr}** (${betterHours[0].temp}${weatherData.unitSymbol}).`
        : '';

      return `⚠️ Not the best time for outdoor activities — ${reason}.${suggestion}`;
    }

    // --- Best day this week ---
    if (/best\s*day|which\s*day|when.*go\s*out|perfect\s*day/.test(q)) {
      const bestDay = [...daily].sort((a, b) => {
        const scoreA = (a.precipProb < 30 ? 20 : 0) + (a.tempMax < 32 ? 10 : 0) + (a.uvMax < 7 ? 5 : 0);
        const scoreB = (b.precipProb < 30 ? 20 : 0) + (b.tempMax < 32 ? 10 : 0) + (b.uvMax < 7 ? 5 : 0);
        return scoreB - scoreA;
      })[0];

      return `📅 **${bestDay.dayName}** (${bestDay.dateStr}) looks like the best day this week! Expected **${bestDay.tempMax}${weatherData.unitSymbol}** high with ${bestDay.weatherInfo.desc.toLowerCase()} and only **${bestDay.precipProb}%** chance of rain.`;
    }

    // --- Tomorrow ---
    if (/tomorrow/.test(q)) {
      const tmrw = daily.find(d => d.dayName === 'Tomorrow');
      if (tmrw) {
        return `📅 Tomorrow's forecast: **${tmrw.weatherInfo.icon} ${tmrw.weatherInfo.desc}**\n🌡️ High: **${tmrw.tempMax}${weatherData.unitSymbol}** / Low: **${tmrw.tempMin}${weatherData.unitSymbol}**\n🌧️ Rain: **${tmrw.precipProb}%**\n💨 Wind: up to **${tmrw.windMax} ${weatherData.windSymbol}**\n🌅 Sunrise: ${tmrw.sunrise} | 🌇 Sunset: ${tmrw.sunset}`;
      }
      return `I don't have tomorrow's data right now. Try refreshing!`;
    }

    // --- Week / forecast ---
    if (/week|forecast|7.day|seven.day|next.*days|upcoming/.test(q)) {
      let response = `📊 **7-Day Forecast:**\n\n`;
      daily.forEach(d => {
        response += `${d.weatherInfo.icon} **${d.dayName}** (${d.dateStr}): ${d.tempMax}° / ${d.tempMin}° — ${d.weatherInfo.desc} (Rain: ${d.precipProb}%)\n`;
      });
      return response;
    }

    // --- Wind ---
    if (/wind|breez|gust/.test(q)) {
      const windDesc = current.windSpeed > 50 ? 'very strong' : current.windSpeed > 30 ? 'strong' : current.windSpeed > 15 ? 'moderate' : 'light';
      return `💨 Wind is currently **${windDesc}** at **${current.windSpeed} ${weatherData.windSymbol}** with gusts up to **${current.windGusts} ${weatherData.windSymbol}** from ${this._getWindDirection(current.windDir)}.`;
    }

    // --- Humidity ---
    if (/humid|moisture|dry/.test(q)) {
      const level = current.humidity > 80 ? 'very high' : current.humidity > 60 ? 'moderate' : current.humidity > 30 ? 'comfortable' : 'low';
      return `💧 Humidity is currently at **${current.humidity}%** (${level}). ${current.humidity > 70 ? 'It may feel muggy outside.' : current.humidity < 30 ? 'Air might feel dry — stay hydrated.' : 'Comfortable levels.'}`;
    }

    // --- UV ---
    if (/uv|sun.*burn|sunscreen|spf/.test(q)) {
      const uvLevel = current.uvIndex >= 11 ? 'Extreme ⛔' : current.uvIndex >= 8 ? 'Very High 🔴' : current.uvIndex >= 6 ? 'High 🟠' : current.uvIndex >= 3 ? 'Moderate 🟡' : 'Low 🟢';
      return `☀️ UV Index is **${current.uvIndex}** (${uvLevel}). ${current.uvIndex >= 6 ? '**Apply SPF 30+ sunscreen** and wear protective clothing.' : 'No special protection needed.'}`;
    }

    // --- Sunrise/Sunset ---
    if (/sunrise|sunset|golden\s*hour|dawn|dusk/.test(q)) {
      const today = daily[0];
      return `🌅 **Sunrise:** ${today.sunrise}\n🌇 **Sunset:** ${today.sunset}\n\n📸 Golden hour starts about 1 hour before sunset — perfect for photos!`;
    }

    // --- What to wear ---
    if (/wear|dress|cloth|outfit|jacket|coat/.test(q)) {
      return this._getOutfitRecommendation(current, weatherData);
    }

    // --- Pressure ---
    if (/pressure|barometer/.test(q)) {
      return `🔵 Atmospheric pressure is **${current.pressure} hPa**. ${current.pressure > 1020 ? 'High pressure — expect clear, stable weather.' : current.pressure < 1000 ? 'Low pressure — weather may become unsettled.' : 'Normal range.'}`;
    }

    // --- Thank you ---
    if (/thank|thanks|thx/.test(q)) {
      return `You're welcome! 😊 I'm always here to help with weather insights. Stay safe! 🌤️`;
    }

    // --- Help ---
    if (/help|what can you|what.*do|capabilities/.test(q)) {
      return `🤖 I'm your **Weather Agent**! Here's what I can help with:\n\n☁️ Current weather conditions\n🌧️ Rain forecasts & umbrella advice\n📅 Weekly forecast & best day finder\n🏃 Outdoor activity recommendations\n👕 Outfit suggestions\n☀️ UV index & sun protection\n💨 Wind conditions\n🌡️ Temperature trends\n🌅 Sunrise & sunset times\n\nJust ask naturally! For example: *"Should I carry an umbrella?"*`;
    }

    // --- Fallback: general weather summary ---
    return `Here's what I know right now:\n\n🌡️ **${current.temp}${weatherData.unitSymbol}** (feels like ${current.feelsLike}${weatherData.unitSymbol})\n${current.weatherInfo.icon} ${current.weatherInfo.desc}\n💧 Humidity: ${current.humidity}%\n💨 Wind: ${current.windSpeed} ${weatherData.windSymbol}\n☀️ UV: ${current.uvIndex}\n\nTry asking me something specific like *"Will it rain today?"* or *"What should I wear?"* 😊`;
  },

  // ---------- Helpers ----------
  _getWindDirection(deg) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  },

  _getOutfitRecommendation(current, weatherData) {
    let outfit = '👕 **Outfit Recommendation:**\n\n';

    if (current.temp >= 30) {
      outfit += '• Light, breathable fabrics (cotton, linen)\n• Short sleeves / tank top\n• Shorts or light pants\n• Sandals or open shoes\n';
    } else if (current.temp >= 20) {
      outfit += '• T-shirt or light long sleeve\n• Jeans or chinos\n• Light sneakers\n';
    } else if (current.temp >= 10) {
      outfit += '• Sweater or hoodie\n• Long pants\n• Closed shoes\n• Light jacket recommended\n';
    } else if (current.temp >= 0) {
      outfit += '• Warm coat or parka\n• Layered clothing\n• Warm pants\n• Boots, gloves, and scarf\n';
    } else {
      outfit += '• Heavy winter coat\n• Thermal underlayers\n• Insulated boots\n• Hat, thick gloves, and scarf 🧣\n';
    }

    if (current.weatherInfo.group === 'rainy') {
      outfit += '• ☂️ Rain jacket / waterproof layer\n• Waterproof shoes\n';
    }

    if (current.uvIndex >= 6) {
      outfit += '• 🕶️ Sunglasses\n• Hat for sun protection\n';
    }

    return outfit;
  }
};
