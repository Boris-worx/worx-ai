// Test Apicurio Registry Connection
// Run with: node test-apicurio.js
// Based on documentation from APICURIO-DATA-SOURCES.md

(async () => {
  const registryUrl = "http://apicurio.52.158.160.62.nip.io/apis/registry/v2";
  
  console.log("\n🔍 Testing Apicurio Registry Connection...\n");
  console.log("Registry API:", registryUrl);
  console.log("Registry UI:", "http://apicurio.52.158.160.62.nip.io/ui");
  console.log("\n" + "=".repeat(80) + "\n");
  
  // Test 0: Get all groups
  try {
    console.log("📡 Fetching all groups from registry...");
    
    const response = await fetch(`${registryUrl}/groups`);
    const data = await response.json();
    
    console.log(`✅ Found ${data.count} group(s) in registry:\n`);
    
    data.groups.forEach((group, index) => {
      console.log(`${index + 1}. ${group.id}`);
      if (group.description) {
        console.log(`   Description: ${group.description}`);
      }
    });
    
    console.log("\n" + "=".repeat(80) + "\n");
  } catch (error) {
    console.error("❌ Error fetching groups:", error.message);
  }
  
  // Test 1: BFS group
  try {
    const groupId1 = "bfs.online";
    console.log(`📡 Fetching artifacts from group: ${groupId1}`);
    
    const response1 = await fetch(`${registryUrl}/groups/${groupId1}/artifacts`);
    const data1 = await response1.json();
    
    console.log(`✅ Found ${data1.count} artifacts in group "${groupId1}":`);
    
    // Filter JSON schemas
    const jsonSchemas1 = data1.artifacts.filter(a => a.type === 'JSON');
    console.log(`   📄 JSON schemas (${jsonSchemas1.length}):`);
    jsonSchemas1.forEach(schema => {
      console.log(`      - ${schema.id}`);
    });
    
    console.log(`   🔧 AVRO schemas (${data1.count - jsonSchemas1.length}):`);
    data1.artifacts.filter(a => a.type === 'AVRO').slice(0, 5).forEach(schema => {
      console.log(`      - ${schema.id}`);
    });
    
  } catch (error) {
    console.error(`❌ Error fetching from bfs.online:`, error.message);
  }
  
  console.log("\n");
  
  // Test 2: Bidtools group
  try {
    const groupId2 = "paradigm.mybldr.bidtools";
    console.log(`📡 Fetching artifacts from group: ${groupId2}`);
    
    const response2 = await fetch(`${registryUrl}/groups/${groupId2}/artifacts`);
    const data2 = await response2.json();
    
    console.log(`✅ Found ${data2.count} artifacts in group "${groupId2}":`);
    
    // Filter JSON schemas
    const jsonSchemas2 = data2.artifacts.filter(a => a.type === 'JSON');
    console.log(`   📄 JSON schemas (${jsonSchemas2.length}):`);
    jsonSchemas2.forEach(schema => {
      console.log(`      - ${schema.id}`);
    });
    
    console.log(`   🔧 AVRO schemas (${data2.count - jsonSchemas2.length}):`);
    data2.artifacts.filter(a => a.type === 'AVRO').slice(0, 5).forEach(schema => {
      console.log(`      - ${schema.id}`);
    });
    
  } catch (error) {
    console.error(`❌ Error fetching from paradigm.mybldr.bidtools:`, error.message);
  }
  
  console.log("\n");
  
  // Test 3: Fetch specific JSON schema
  try {
    const groupId = "paradigm.mybldr.bidtools";
    const artifactId = "bfs.QuoteDetails.json";
    
    console.log(`📡 Fetching schema content: ${groupId}/${artifactId}`);
    
    const response = await fetch(`${registryUrl}/groups/${groupId}/artifacts/${artifactId}`);
    const schemaContent = await response.json();
    
    console.log(`✅ Schema loaded successfully!`);
    console.log(`   Schema title: ${schemaContent.title || 'N/A'}`);
    console.log(`   Schema type: ${schemaContent.type || 'N/A'}`);
    console.log(`   Properties count: ${schemaContent.properties ? Object.keys(schemaContent.properties).length : 'N/A'}`);
    console.log(`   Sample properties:`, Object.keys(schemaContent.properties || {}).slice(0, 5).join(', '));
    
  } catch (error) {
    console.error(`❌ Error fetching schema content:`, error.message);
  }
  
  console.log("\n✨ Test complete!\n");
})();
