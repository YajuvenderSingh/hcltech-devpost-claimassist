// TEST DYNAMIC PAYLOAD SYSTEM

// Add this to browser console to test
function testDynamicPayload() {
  console.log('🧪 TESTING DYNAMIC PAYLOAD SYSTEM');
  console.log('==================================');
  
  // Your actual entities structure
  const testEntities = {
    "claim_details_section": {
      "employee_name": {"value": "Juan D'Souza", "confidence": "100%"},
      "claim_administrator_claim_number": {"value": "312-36-368870", "confidence": "100%"}
    },
    "employee_information_section": {
      "employee_first_name": {"value": "Juan", "confidence": "100%"},
      "employee_last_name": {"value": "D'Souza", "confidence": "100%"}
    }
  };
  
  // Test with modifications
  const testModifiedValues = {
    "CLAIM_DETAILS_SECTION_employee_name": "name-1",
    "EMPLOYEE_INFORMATION_SECTION_employee_first_name": "John"
  };
  
  // Field mapping (same as in your code)
  const fieldMapping = {
    'claim_administrator_claim_number': 'ClaimNumber',
    'employee_name': 'employee_name',
    'employee_first_name': 'employee_first_name',
    'employee_last_name': 'employee_last_name'
  };
  
  // Build payload (same logic as your code)
  const payload = {};
  
  Object.entries(testEntities).forEach(([sectionName, sectionData]) => {
    Object.entries(sectionData).forEach(([fieldName, fieldData]) => {
      const originalValue = fieldData?.value || fieldData;
      const entityKey = `${sectionName.toUpperCase()}_${fieldName}`;
      const currentValue = testModifiedValues[entityKey] || originalValue;
      const guidwireField = fieldMapping[fieldName] || fieldName;
      
      if (currentValue) {
        payload[guidwireField] = currentValue;
        console.log(`📝 ${guidwireField} = ${currentValue} ${testModifiedValues[entityKey] ? '(MODIFIED)' : '(ORIGINAL)'}`);
      }
    });
  });
  
  console.log('\n🎯 FINAL PAYLOAD:');
  console.log(JSON.stringify(payload, null, 2));
  
  return payload;
}

// Make available in console
window.testDynamicPayload = testDynamicPayload;

console.log('✅ Test function loaded!');
console.log('📞 Run: testDynamicPayload()');
