import axios from 'axios';

const providers = {
  '711': {
    buy: async (service, apiKey) => {
      const { data } = await axios.get('https://api.711.so/order/buy', {
        params: {
          apiKey,
          country: service.providerData.country,
          package: service.providerData.packageType,
        },
      });
      return data;
    },
    extend: async (orderId, apiKey) => {
      const { data } = await axios.get('https://api.711.so/order/extend', {
        params: { apiKey, order: orderId },
      });
      return data;
    },
    traffic: async (orderId, apiKey) => {
      const { data } = await axios.get('https://api.711.so/order/traffic', {
        params: { apiKey, order: orderId },
      });
      return data;
    },
  },
  'proxyseller': {
    buy: async (service, apiKey) => {
      const { data } = await axios.post(
        'https://api.proxyseller.com/v1/order',
        {
          api_key: apiKey,
          type: service.providerData.type || 'http',
          country: service.providerData.country || 'US',
          quantity: 1,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return data;
    },
    extend: async (orderId, apiKey) => {
      const { data } = await axios.post(
        'https://api.proxyseller.com/v1/order/extend',
        {
          api_key: apiKey,
          order_id: orderId,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return data;
    },
    traffic: async (orderId, apiKey) => {
      const { data } = await axios.get('https://api.proxyseller.com/v1/order/status', {
        params: { api_key: apiKey, order_id: orderId },
      });
      return data;
    },
  },
  'lightning': {
    buy: async (service, apiKey) => {
      const { data } = await axios.post('https://api.lightning.com/order', {
        apiKey,
        plan: service.providerData.plan || 'basic',
      });
      return data;
    },
    extend: async (orderId, apiKey) => {
      const { data } = await axios.post('https://api.lightning.com/order/extend', {
        apiKey,
        orderId,
      });
      return data;
    },
    traffic: async (orderId, apiKey) => {
      const { data } = await axios.get('https://api.lightning.com/order/traffic', {
        params: { apiKey, orderId },
      });
      return data;
    },
  },
  'goproxy': {
    buy: async (service, apiKey) => {
      const { data } = await axios.get('https://api.goproxy.com/buy', {
        params: {
          key: apiKey,
          location: service.providerData.location || 'US',
        },
      });
      return data;
    },
    extend: async (orderId, apiKey) => {
      const { data } = await axios.post('https://api.goproxy.com/extend', {
        key: apiKey,
        order: orderId,
      });
      return data;
    },
    traffic: async (orderId, apiKey) => {
      const { data } = await axios.get('https://api.goproxy.com/traffic', {
        params: { key: apiKey, order: orderId },
      });
      return data;
    },
  },
};

export default providers;