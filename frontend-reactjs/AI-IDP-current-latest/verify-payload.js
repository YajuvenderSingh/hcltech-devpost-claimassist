// VERIFY PAYLOAD - Run this in console to test

function verifyPayload() {
  console.log('🔍 VERIFYING PAYLOAD GENERATION');
  
  // Your exact entity structure
  const rawEntities = {
    "claim_details_section": {
      "employee_name": {"value": "Juan D'Souza", "confidence": "100%"},
      "claim_administrator_claim_number": {"value": "312-36-368870", "confidence": "100%"}
    },
    "employee_information_section": {
      "employee_first_name": {"value": "Juan", "confidence": "100%"},
      "employee_last_name": {"value": "D'Souza", "confidence": "100%"}
    }
  };
  
  // Test with modification
  const modifiedValues = {
    "CLAIM_DETAILS_SECTION_employee_name": "name-1"
  };
  
  // Field mapping (same as your code)
  const fieldMapping = {
    'claim_administrator_claim_number': 'ClaimNumber',
    'employee_name': 'employee_name',
    'employee_first_name': 'employee_first_name',
    'employee_last_name': 'employee_last_name'
  };
  
  // Generate payload (exact same logic as your updated code)
  const payload = {};
  
  Object.entries(rawEntities).forEach(([sectionName, sectionData]) => {
    Object.entries(sectionData).forEach(([fieldName, fieldData]) => {
      const originalValue = fieldData.value;
      const entityKey = `${sectionName.toUpperCase()}_${fieldName}`;
      const currentValue = modifiedValues[entityKey] || originalValue;
      const guidwireField = fieldMapping[fieldName] || fieldName;
      
      if (currentValue) {
        payload[guidwireField] = currentValue;
        console.log(`✅ ${guidwireField} = ${currentValue} ${modifiedValues[entityKey] ? '(MODIFIED)' : '(ORIGINAL)'}`);
      }
    });
  });
  
  console.log('\n📤 FINAL PAYLOAD:');
  console.log(JSON.stringify(payload, null, 2));
  
  // Check if it's correct
  const expected = {
    "ClaimNumber": "312-36-368870",
    "employee_name": "name-1", // Should be modified
    "employee_first_name": "Juan",
    "employee_last_name": "D'Souza"
  };
  
  const isCorrect = JSON.stringify(payload) === JSON.stringify(expected);
  console.log(`\n${isCorrect ? '✅ CORRECT' : '❌ WRONG'} - Payload matches expected structure`);
  
  return { payload, expected, isCorrect };
}

// Make available in console
window.verifyPayload = verifyPayload;

console.log('🧪 Verification loaded! Run: verifyPayload()');
