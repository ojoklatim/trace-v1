export async function onRequestGet(context) {
  const { env } = context;

  const lat = 0.3476;
  const lon = 32.5825;
  const sourceReadings = [];

  const classifyRain = (mmPerHour) => {
    if (mmPerHour >= 7) return 'critical';
    if (mmPerHour >= 2) return 'warning';
    return 'normal';
  };

  const fetchOpenMeteo = async () => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=precipitation,rain,temperature_2m,wind_speed_10m`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo status ${res.status}`);
    const data = await res.json();
    const rain = Number(data?.current?.rain ?? data?.current?.precipitation ?? 0);
    sourceReadings.push({
      id: 'open-meteo',
      name: 'Open-Meteo',
      value: Number.isFinite(rain) ? rain : 0,
      status: classifyRain(Number.isFinite(rain) ? rain : 0),
      unit: 'mm/h',
    });
  };

  const fetchOpenWeather = async () => {
    if (!env.OPENWEATHER_API_KEY) return;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${env.OPENWEATHER_API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OpenWeather status ${res.status}`);
    const data = await res.json();
    const rain = Number(data?.rain?.['1h'] ?? 0);
    sourceReadings.push({
      id: 'openweather',
      name: 'OpenWeather',
      value: Number.isFinite(rain) ? rain : 0,
      status: classifyRain(Number.isFinite(rain) ? rain : 0),
      unit: 'mm/h',
    });
  };

  const fetchMetNo = async () => {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'flow-iq-weather/1.0',
      },
    });
    if (!res.ok) throw new Error(`Met.no status ${res.status}`);
    const data = await res.json();
    const firstTimeseries = data?.properties?.timeseries?.[0];
    const rain = Number(
      firstTimeseries?.data?.next_1_hours?.details?.precipitation_amount ?? 0
    );
    sourceReadings.push({
      id: 'met-no',
      name: 'MET Norway',
      value: Number.isFinite(rain) ? rain : 0,
      status: classifyRain(Number.isFinite(rain) ? rain : 0),
      unit: 'mm/h',
    });
  };

  const fetchWeatherApi = async () => {
    if (!env.WEATHERAPI_KEY) return;
    const url = `https://api.weatherapi.com/v1/current.json?key=${env.WEATHERAPI_KEY}&q=${lat},${lon}&aqi=no`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`WeatherAPI status ${res.status}`);
    const data = await res.json();
    const rain = Number(data?.current?.precip_mm ?? 0);
    sourceReadings.push({
      id: 'weatherapi',
      name: 'WeatherAPI',
      value: Number.isFinite(rain) ? rain : 0,
      status: classifyRain(Number.isFinite(rain) ? rain : 0),
      unit: 'mm/h',
    });
  };

  await Promise.allSettled([
    fetchOpenMeteo(),
    fetchOpenWeather(),
    fetchMetNo(),
    fetchWeatherApi(),
  ]);

  const validRainReadings = sourceReadings
    .map((source) => source.value)
    .filter((value) => Number.isFinite(value));

  const realRain =
    validRainReadings.length > 0
      ? validRainReadings.reduce((sum, value) => sum + value, 0) / validRainReadings.length
      : 0;

  const rainfallSpiked = env.STATE
    ? (await env.STATE.get('rainfall_spiked')) === 'true'
    : false;
  const adjustedRain = rainfallSpiked ? Math.max(realRain, 10) : realRain;

  const sensors = sourceReadings.map((source, index) => ({
    id: index + 1,
    name: source.name,
    source_id: source.id,
    value: Number(source.value.toFixed(2)),
    status: source.status,
    unit: source.unit,
  }));

  return new Response(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      sensors,
      source_count: sensors.length,
      real_rain_mm: Number(adjustedRain.toFixed(2)),
      alert_active: adjustedRain >= 7,
    }),
    {
      status: sensors.length > 0 ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
