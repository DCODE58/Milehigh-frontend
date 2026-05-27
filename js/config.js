// Blizedd — Config
const CONFIG = {
  API_BASE: 'http://localhost:3000',
  MPESA_NUMBER: '0700115476',

  SECTIONS: [
    {
      id: 'foreign',
      label: 'FOREIGN',
      iconId: 'icon-leaf',
      description: 'Premium imported — smooth & curated',
      products: [
        { id: 'foreign-1',  name: 'Foreign',  qty: 1,  price: 100, tag: 'Single',      hasQty: true  },
        { id: 'foreign-5',  name: 'Foreign',  qty: 5,  price: 400, tag: 'Pack of 5',   hasQty: false },
        { id: 'foreign-10', name: 'Foreign',  qty: 10, price: 900, tag: 'Pack of 10',  hasQty: false },
      ],
    },
    {
      id: 'shash',
      label: 'SHASH',
      iconId: 'icon-sprout',
      description: 'Local selection — solid & affordable',
      products: [
        { id: 'local-1',  name: 'Shash', qty: 1,  price: 50,  tag: 'Single',     hasQty: false },
        { id: 'local-10', name: 'Shash', qty: 10, price: 400, tag: 'Pack of 10', hasQty: false },
      ],
    },
    {
      id: 'bags',
      label: 'BAGS',
      iconId: 'icon-package',
      description: 'Premium 15g bags — bulk done right',
      products: [
        { id: 'pack-15g', name: '15g Bag', qty: 1, price: 1000, tag: 'Premium 15g', hasQty: false },
      ],
    },
  ],
};
