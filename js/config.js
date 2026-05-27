
// Blizedd Frontend — Configuration
// Update API_BASE to your deployed backend URL before going live

const CONFIG = {
  // Development: 'http://localhost:3000'
  // Production:  'https://blizedd-api.onrender.com'
  API_BASE: 'http://localhost:3000',

  // M-PESA payment number shown after checkout
  MPESA_NUMBER: '0700000000',

  // Product catalog — must match backend CATALOG in routes/orders.js
  PRODUCTS: [
    { id: 'foreign-1',  name: 'Foreign',  qty: 1,  price: 100,  tag: 'Single'    },
    { id: 'foreign-5',  name: 'Foreign',  qty: 5,  price: 400,  tag: 'Pack of 5' },
    { id: 'foreign-10', name: 'Foreign',  qty: 10, price: 900,  tag: 'Pack of 10'},
    { id: 'local-1',    name: 'Local',    qty: 1,  price: 50,   tag: 'Single'    },
    { id: 'local-10',   name: 'Local',    qty: 10, price: 400,  tag: 'Pack of 10'},
    { id: 'pack-15g',   name: '15g Pack', qty: 1,  price: 1000, tag: 'Premium'   },
  ],
};
