// Temporary debug file to test API response
export const debugAPIResponse = async () => {
  const API_BASE_URL = 'https://dp-eastus-poc-txservices-apis.azurewebsites.net/1.0';
  const AUTH_TOKEN = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  
  try {
    const response = await fetch(`${API_BASE_URL}/txns?TxnType=keyi`, {
      method: 'GET',
      headers: {
        'X-BFS-Auth': AUTH_TOKEN,
      },
    });
    
    const data = await response.json();
    console.log('🌐 Full API Response:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data.Txns) {
      console.log('📦 Number of transactions:', data.data.Txns.length);
      console.log('📊 First transaction:', JSON.stringify(data.data.Txns[0], null, 2));
      
      data.data.Txns.forEach((txn: any, i: number) => {
        console.log(`\n🔍 Transaction ${i}:`);
        console.log('  - id:', txn.id);
        console.log('  - _ts:', txn._ts);
        console.log('  - Keys:', Object.keys(txn).join(', '));
      });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
  }
};
