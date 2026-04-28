import { onRequestPost as __api_reset_sensors_js_onRequestPost } from "/Users/ucctestbed/Desktop/trace-v1/trace-v1/flow-iq/functions/api/reset-sensors.js"
import { onRequestGet as __api_sensors_js_onRequestGet } from "/Users/ucctestbed/Desktop/trace-v1/trace-v1/flow-iq/functions/api/sensors.js"
import { onRequestPost as __api_trigger_rain_js_onRequestPost } from "/Users/ucctestbed/Desktop/trace-v1/trace-v1/flow-iq/functions/api/trigger-rain.js"

export const routes = [
    {
      routePath: "/api/reset-sensors",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_reset_sensors_js_onRequestPost],
    },
  {
      routePath: "/api/sensors",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_sensors_js_onRequestGet],
    },
  {
      routePath: "/api/trigger-rain",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_trigger_rain_js_onRequestPost],
    },
  ]