import axios from 'axios';

// In dev, same-origin /api is proxied to the Express server (see vite.config.js).
// Fallback to `/api` keeps local and same-origin deployments working even if env is unset.
const API = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // #region agent log
  fetch('http://127.0.0.1:7501/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ac4137'},body:JSON.stringify({sessionId:'ac4137',runId:'cleanup-baseline',hypothesisId:'H5_client_requests_reach_api_layer',location:'client/src/api.js:request_interceptor',message:'Client request interceptor fired',data:{method:config.method||null,url:config.url||null,baseURL:config.baseURL||API,hasAuthHeader:!!config.headers?.Authorization},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // #region agent log
    fetch('http://127.0.0.1:7501/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ac4137'},body:JSON.stringify({sessionId:'ac4137',runId:'cleanup-baseline',hypothesisId:'H6_client_receives_api_responses',location:'client/src/api.js:response_interceptor_success',message:'Client response interceptor success',data:{method:response?.config?.method||null,url:response?.config?.url||null,status:response?.status||null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return response;
  },
  (error) => {
    // #region agent log
    fetch('http://127.0.0.1:7501/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ac4137'},body:JSON.stringify({sessionId:'ac4137',runId:'cleanup-baseline',hypothesisId:'H6_client_receives_api_responses',location:'client/src/api.js:response_interceptor_error',message:'Client response interceptor error',data:{method:error?.config?.method||null,url:error?.config?.url||null,status:error?.response?.status||null,code:error?.code||null,errorMessage:error?.message||null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return Promise.reject(error);
  }
);

export default api;
