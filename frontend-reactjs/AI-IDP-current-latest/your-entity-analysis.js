// YOUR EXTRACTED ENTITIES ANALYSIS

const yourEntities = {
  "claim_details_section": {
    "employee_name": {"value": "Juan D'Souza", "confidence": "100%"},
    "wcb_case_number_jcn": {"value": "JCN1", "confidence": "100%"},
    "date_of_injury": {"value": "08/25/2025", "confidence": "100%"},
    "claim_administrator_claim_number": {"value": "312-36-368870", "confidence": "100%"}
  },
  "insurer_claim_administrator_information_section": {
    "insurer_name": {"value": "ADA Insurance Company", "confidence": "100%"},
    "insurer_id": {"value": "NM12", "confidence": "100%"}
  },
  "employee_information_section": {
    "employee_first_name": {"value": "Juan", "confidence": "100%"},
    "employee_last_name": {"value": "D'Souza", "confidence": "100%"},
    "mailing_address": {"value": "2800 BACO NOIR DR", "confidence": "100%"},
    "city": {"value": "ALBUQUERQUE", "confidence": "100%"},
    "state": {"value": "NM", "confidence": "100%"},
    "postal_code": {"value": "87121", "confidence": "100%"},
    "date_of_birth": {"value": "01/01/1980", "confidence": "100%"}
  },
  "employee_injury_section": {
    "nature_of_injury": {"value": "Strain", "confidence": "100%"},
    "part_of_body": {"value": "Left Hand", "confidence": "100%"}
  },
  "work_status_section": {
    "initial_return_to_work_date": {"value": "10/25/2025", "confidence": "100%"}
  },
  "insured_information_section": {
    "policy_number_id": {"value": "34-12346", "confidence": "100%"}
  }
};

// GUIDWIRE PAYLOAD MAPPING
function mapToGuidwirePayload(entities) {
  const payload = {};
  
  // Process each section
  Object.entries(entities).forEach(([sectionName, sectionData]) => {
    Object.entries(sectionData).forEach(([fieldName, fieldData]) => {
      const value = fieldData.value;
      
      // Map field names to Guidwire format
      switch(fieldName) {
        case 'claim_administrator_claim_number':
          payload.ClaimNumber = value;
          break;
        case 'employee_name':
          payload.employee_name = value;
          break;
        case 'wcb_case_number_jcn':
          payload.wcb_case_number_jcn = value;
          break;
        case 'date_of_injury':
          payload.date_of_injury = value;
          break;
        case 'employee_first_name':
          payload.employee_first_name = value;
          break;
        case 'employee_last_name':
          payload.employee_last_name = value;
          break;
        case 'mailing_address':
          payload.mailing_address = value;
          break;
        case 'city':
          payload.city = value;
          break;
        case 'state':
          payload.state = value;
          break;
        case 'postal_code':
          payload.postal_code = value;
          break;
        case 'date_of_birth':
          payload.date_of_birth = value;
          break;
        case 'nature_of_injury':
          payload.nature_of_injury = value;
          break;
        case 'part_of_body':
          payload.part_of_body = value;
          break;
        case 'initial_return_to_work_date':
          payload.initial_return_to_work_date = value;
          break;
        case 'policy_number_id':
          payload.policy_number_id = value;
          break;
        case 'insurer_name':
          payload.insurer_name = value;
          break;
        case 'insurer_id':
          payload.insurer_id = value;
          break;
      }
    });
  });
  
  return payload;
}

// EXPECTED GUIDWIRE PAYLOAD FROM YOUR ENTITIES
const expectedPayload = mapToGuidwirePayload(yourEntities);

console.log('🎯 YOUR GUIDWIRE PAYLOAD:');
console.log(JSON.stringify(expectedPayload, null, 2));

/* EXPECTED OUTPUT:
{
  "ClaimNumber": "312-36-368870",
  "employee_name": "Juan D'Souza",
  "wcb_case_number_jcn": "JCN1",
  "date_of_injury": "08/25/2025",
  "employee_first_name": "Juan",
  "employee_last_name": "D'Souza",
  "mailing_address": "2800 BACO NOIR DR",
  "city": "ALBUQUERQUE",
  "state": "NM",
  "postal_code": "87121",
  "date_of_birth": "01/01/1980",
  "nature_of_injury": "Strain",
  "part_of_body": "Left Hand",
  "initial_return_to_work_date": "10/25/2025",
  "policy_number_id": "34-12346",
  "insurer_name": "ADA Insurance Company",
  "insurer_id": "NM12"
}
*/
