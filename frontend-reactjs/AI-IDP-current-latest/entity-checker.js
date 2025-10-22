// ENTITY CHECKER - Add this to browser console to check your entities

function checkExtractedEntities() {
  console.log('🔍 CHECKING EXTRACTED ENTITIES');
  console.log('================================');
  
  // Get entitiesBySection from React component state
  // You can access this in browser console when on the ContentExtraction page
  
  const sampleEntities = {
    "CLAIM DETAILS": [
      { entity_type: "CLAIM_NUMBER", entity_value: "CL123456", confidence: 0.95 },
      { entity_type: "EMPLOYEE_NAME", entity_value: "John Smith", confidence: 0.90 }
    ],
    "EMPLOYEE INFO": [
      { entity_type: "EMPLOYEE_FIRST_NAME", entity_value: "John", confidence: 0.92 },
      { entity_type: "EMPLOYEE_LAST_NAME", entity_value: "Smith", confidence: 0.88 }
    ]
  };
  
  console.log('📋 Sample Expected Structure:');
  console.log(JSON.stringify(sampleEntities, null, 2));
  
  console.log('\n🔧 To check your actual entities:');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Go to Console tab');
  console.log('3. Type: checkMyEntities()');
  console.log('4. Look for console logs with 🎠 entitiesBySection');
  
  return sampleEntities;
}

function checkMyEntities() {
  console.log('🔍 CHECKING YOUR ENTITIES');
  console.log('=========================');
  
  // This will show in console logs from ContentExtraction component
  console.log('Look for these console messages:');
  console.log('🎠 entitiesBySection changed: {...}');
  console.log('🎠 Section count: X');
  console.log('🎠 Section names: [...]');
  
  console.log('\n📊 Entity Structure Check:');
  console.log('- Each section should be an object key');
  console.log('- Each section should contain array of entities');
  console.log('- Each entity should have: entity_type, entity_value, confidence');
  
  console.log('\n🎯 Guidwire Mapping Check:');
  console.log('- CLAIM_NUMBER → ClaimNumber');
  console.log('- EMPLOYEE_NAME → employee_name');
  console.log('- EMPLOYEE_FIRST_NAME → employee_first_name');
  console.log('- DATE_OF_INJURY → date_of_injury');
  
  return 'Check console for 🎠 messages from ContentExtraction component';
}

// Make functions available globally
window.checkExtractedEntities = checkExtractedEntities;
window.checkMyEntities = checkMyEntities;

console.log('✅ Entity checker loaded!');
console.log('📞 Run: checkExtractedEntities() or checkMyEntities()');
