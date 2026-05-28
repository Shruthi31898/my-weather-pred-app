// ============================================
// Charts Module — Chart.js Visualizations
// ============================================

const WeatherCharts = {
  instances: {},

  // Global Chart.js defaults
  init() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded');
      return;
    }

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
  },

  // Destroy existing chart before creating new one
  _destroy(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  },

  // ---------- Hourly Temperature Chart ----------
  renderHourlyTemp(canvasId, hourlyData, unitSymbol) {
    this._destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = hourlyData.map(h => h.timeStr);
    const temps = hourlyData.map(h => h.temp);

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: temps,
          borderColor: '#38bdf8',
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#38bdf8',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y}${unitSymbol}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 8 }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              callback: (v) => `${v}°`
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  },

  // ---------- Precipitation Probability Chart ----------
  renderPrecipitation(canvasId, hourlyData) {
    this._destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = hourlyData.map(h => h.timeStr);
    const precip = hourlyData.map(h => h.precipProb);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: precip,
          backgroundColor: precip.map(p =>
            p >= 70 ? 'rgba(56, 189, 248, 0.7)' :
            p >= 40 ? 'rgba(56, 189, 248, 0.4)' :
            'rgba(56, 189, 248, 0.15)'
          ),
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.6
        }]
      },
      options: {
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y}% chance`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 8 }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            max: 100,
            ticks: {
              callback: (v) => `${v}%`
            }
          }
        }
      }
    });
  },

  // ---------- 7-Day Temperature Range Chart ----------
  renderDailyTemp(canvasId, dailyData, unitSymbol) {
    this._destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = dailyData.map(d => d.dayName);
    const highs = dailyData.map(d => d.tempMax);
    const lows = dailyData.map(d => d.tempMin);

    const gradientHigh = ctx.getContext('2d').createLinearGradient(0, 0, 0, 220);
    gradientHigh.addColorStop(0, 'rgba(251, 146, 60, 0.3)');
    gradientHigh.addColorStop(1, 'rgba(251, 146, 60, 0)');

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'High',
            data: highs,
            borderColor: '#fb923c',
            backgroundColor: gradientHigh,
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#fb923c',
            pointBorderColor: 'rgba(17,24,39,0.8)',
            pointBorderWidth: 2
          },
          {
            label: 'Low',
            data: lows,
            borderColor: '#38bdf8',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#38bdf8',
            pointBorderColor: 'rgba(17,24,39,0.8)',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              boxHeight: 2,
              padding: 16,
              usePointStyle: false
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}${unitSymbol}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              callback: (v) => `${v}°`
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  },

  // ---------- Wind Speed Chart ----------
  renderWindSpeed(canvasId, hourlyData, windSymbol) {
    this._destroy(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = hourlyData.map(h => h.timeStr);
    const wind = hourlyData.map(h => h.windSpeed);

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(167, 139, 250, 0.3)');
    gradient.addColorStop(1, 'rgba(167, 139, 250, 0)');

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: wind,
          borderColor: '#a78bfa',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#a78bfa'
        }]
      },
      options: {
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} ${windSymbol}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 8 }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              callback: (v) => `${v}`
            }
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });
  },

  // Destroy all charts (for cleanup)
  destroyAll() {
    Object.keys(this.instances).forEach(id => this._destroy(id));
  }
};
