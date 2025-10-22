import boto3
import json
import time
import traceback
from botocore.exceptions import ClientError

# Initialize DynamoDB resource
dynamodb_resource = boto3.resource("dynamodb")

def get_docs_extract(docid):
    """Retrieve document extract details from DynamoDB"""
    print('in get_docs_extract begin', docid)
    
    dynamodb_tbl_nm = "nmm-doc-extraction"
    dbtable = dynamodb_resource.Table(dynamodb_tbl_nm)
    
    return dbtable.get_item(Key={'docid': docid})

def get_legal_entities_template(classification):
    """Get entity extraction template based on document classification"""
    if classification == 'Legal':
        return """
                Extraction Instructions:
                1. Carefully analyze the entire document text
                2. Extract entities exactly as they appear in the document
                3. For fields with no information, use "EMPTY"
                4. Provide DATE fields ONLY in MM/DD/YYYY format.

                Gather all the following information:
                1. What is the Case Number?
                2. What is the Name?
                3. Whether this document Category is 'Legal' or 'Non Legal'
                4. Whether this document is related to which 'Matter Type' from the following items ['Lawsuit', 'Arbitration','Hearng','Mediation']
                5. Whether this document is related to which 'Court Type' from the following items ['Federal','County']
                6. Whether this document is related to which 'Legal Speciality' from the following items ['Personal Injury','Motor Vehicle Liability', 'General Liability', 'Worker Compensation']
                7. What is the 'Primary Cause' in the document, pick from the following items ['Court Approval','Statute of Limitation', 'Valuation Dispute', 'Negotiation at Impasse', 'Unreasonable Demand', 'Blind Suit / First Notice', 'Low Settlement Offer', 'Predetermined', 'Delay or insufficient claimant']
                8. Whether this document sensitivity type is 'Sensitive' or 'Non Sensitive Document'
                9. What is the Claim Administration Claim Number?
                10. Provide the confidence for each entity.

                After gathering all the above information, respond in the form of following JSON along with confidence score for each entity:

                Required JSON Output Format:
                {
                "legal_section": {
                    "case_number": {
                    "value": "STRING",
                    "confidence": "FLOAT"
                    },
                    "name": {
                    "value": "STRING",
                    "confidence": "FLOAT"
                    },
                    "category": {
                    "value": "STRING",
                    "confidence": "FLOAT"
                    },
                    "matter_type": {
                    "value": "STRING",
                    "confidence": "FLOAT"
                    },
                    "court_type": {
                    "value": "STRING",
                    "confidence": "FLOAT"
                    },
                    "legal_speciality": {
                    "value": "STRING",
                    "confidence": "FLOAT"
                    },
                    "primary_cause": {
                    "value": "STRING",
                    "confidence": "FLOAT"
                    },
                    "sensitivity_type": {
                    "value": "STRING",
                    "confidence": "FLOAT"
                    },
                    "claim_administrator_claim_number": {
                    "value": "STRING",
                    "confidence": "FLOAT"
                    }
                }
                }

                CRITICAL: Return ONLY valid JSON. No explanations, no prefixes, no suffixes.
                Generate only a perfect JSON till end.
                Do not provide any supporting or explanation text beyond generating the perfect JSON.
                Skip any preamble text and generate the final JSON ONLY. 

                """
    return ""
    ###########################

def get_entities_template(classification):
    """Get entity extraction template based on document classification"""
    if classification == 'ClaimForm':
        return """
                Extraction Instructions:
                    1. Carefully analyze the entire document text
                    2. Extract entities exactly as they appear in the document
                    3. For fields with no information, use "EMPTY"
                    4. Provide DATE fields ONLY in MM/DD/YYYY format.

                    Required JSON Output Format:
                    {
                        "claim_details_section": {
                            "employee_name": {
                                "value": "STRING",
                                "confidence": FLOAT
                            },
                            "wcb_case_number_jcn": {
                                "value": "STRING", 
                                "confidence": FLOAT
                            },
                            "date_of_injury": {
                                "value": "STRING", 
                                "confidence": FLOAT
                            },
                            "claim_administrator_claim_number": {
                                "value": "STRING", 
                                "confidence": FLOAT
                            }
                        },
                        "insurer_claim_administrator_information_section": {
                            "insurer_name": {
                                "value": "STRING",
                                "confidence": FLOAT
                            },
                            "insurer_id": {
                                "value": "STRING", 
                                "confidence": FLOAT
                            }
                        },
                        "employee_information_section": {
                            "employee_first_name": {
                                "value": "STRING",
                                "confidence": FLOAT
                            },
                            "employee_last_name": {
                                "value": "STRING", 
                                "confidence": FLOAT
                            },
                            "mailing_address": {
                                "value": "STRING",
                                "confidence": FLOAT
                            },
                            "city": {
                                "value": "STRING",
                                "confidence": FLOAT
                            },
                            "state": {
                                "value": "STRING",
                                "confidence": FLOAT
                            },
                            "postal_code": {
                                "value": "STRING",
                                "confidence": FLOAT
                            },
                            "date_of_birth": {
                                "value": "STRING",
                                "confidence": FLOAT
                            }
                        } ,
                        "employee_injury_section": {
                            "nature_of_injury": {
                                "value": "STRING",
                                "confidence": FLOAT
                            },
                            "part_of_body": {
                                "value": "STRING", 
                                "confidence": FLOAT
                            } 
                        },
                        "work_status_section": {
                            "initial_return_to_work_date": {
                                "value": "STRING",
                                "confidence": FLOAT
                            } 
                        },
                        "insured_information_section": {
                            "policy_number_id": {
                                "value": "STRING",
                                "confidence": FLOAT
                            } 
                        }       
                    }
                    CRITICAL: Return ONLY valid JSON. No explanations, no prefixes, no suffixes.
                    Generate only a perfect JSON till end.
                    Do not provide any supporting or explanation text beyond generating the perfect JSON.
                    Skip any preamble text and generate the final JSON ONLY. 
                    
                """
    elif classification == 'MedicalReport':
        return """
                Extraction Instructions:
                    1. Carefully analyze the entire document text
                    2. Extract entities exactly as they appear in the document
                    3. For fields with no information, use "EMPTY"
                    4. Provide DATE fields ONLY in MM/DD/YYYY format.

                    Required JSON Output Format:
                    {
                        "medical_report_section": {
                            "employee_name": {
                                "value": "STRING",
                                "confidence": FLOAT
                            },
                            "diagnosis": {
                                "value": "STRING", 
                                "confidence": FLOAT
                            },
                            "date_of_injury": {
                                "value": "STRING", 
                                "confidence": FLOAT
                            } 
                        }
                    }

                    CRITICAL: Return ONLY valid JSON. No explanations, no prefixes, no suffixes. 
                    Generate only a perfect JSON till end.
                    Do not provide any supporting or explanation text beyond generating the perfect JSON.
                    Skip any preamble text and generate the final JSON ONLY. 
                """
    elif classification == 'DoctorReportMMI':
        return """
                Extraction Instructions:
                    1. Carefully analyze the entire document text
                    2. Extract entities exactly as they appear in the document
                    3. For fields with no information, use "EMPTY"
                    4. Provide DATE fields ONLY in MM/DD/YYYY format.

                    Required JSON Output Format:
                    {
                        "claim_details_section": {
                            "claim_admin_claim_number": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            }
                        },
                        "patients_information_section": {
                            "patients_name": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            },
                            "date_of_injury_illness": {
                                "value": "STRING", 
                                "confidence": "FLOAT"
                            }
                        },
                        "diagnosis_information_section": [{
                            "enter_icd10_code": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            },
                            "icd10_descriptor": {
                                "value": "STRING", 
                                "confidence": "FLOAT"
                            }
                        } ] ,
                        "maximum_medical_improvement_section": {
                            "has_the_patient_reached_maximum_medical_improvement": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            }
                        },
                        "functional_capabilities_section": {
                            "has_the_patient_had_an_injury_illness_since_the_date_of_injury_which_impacts_residual_functional_capacity": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            }
                        }
                        
                    }

                    CRITICAL: Return ONLY valid JSON. No explanations, no prefixes, no suffixes. 
                    Generate only a perfect JSON till end.
                    Do not provide any supporting or explanation text beyond generating the perfect JSON.
                    Skip any preamble text and generate the final JSON ONLY. 
                """
    elif classification == 'PhysicalTherapy':
        return """
                Extraction Instructions:
                    1. Carefully analyze the entire document text
                    2. Extract entities exactly as they appear in the document
                    3. For fields with no information, use "EMPTY"
                    4. Provide DATE fields ONLY in MM/DD/YYYY format.

                    Required JSON Output Format:
                    {
                        "physical_therapy_order_section": {
                            "date": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            },
                            "frequency": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            }
                            ,
                            "per_wk_for": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            }
                        }
                        
                    }

                    CRITICAL: Return ONLY valid JSON. No explanations, no prefixes, no suffixes. 
                    Generate only a perfect JSON till end.
                    Do not provide any supporting or explanation text beyond generating the perfect JSON.
                    Skip any preamble text and generate the final JSON ONLY. 

                """
    elif classification == 'Prescription':
        return """
                Extraction Instructions:
                    1. Carefully analyze the entire document text
                    2. Extract entities exactly as they appear in the document
                    3. For fields with no information, use "EMPTY"
                    4. Provide DATE fields ONLY in MM/DD/YYYY format.

                    Required JSON Output Format:
                    {
                        "prescription_section": {                            
                            "name": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            },
                            "date": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            }
                            
                        }
                        
                    }
                    CRITICAL: Return ONLY valid JSON. No explanations, no prefixes, no suffixes.
                    Generate only a perfect JSON till end.
                    Do not provide any supporting or explanation text beyond generating the perfect JSON.
                    Skip any preamble text and generate the final JSON ONLY. 

                """
    
    elif classification == 'CMS1500':
        return """
                Extraction Instructions:
                    1. Carefully analyze the entire document text
                    2. Extract entities exactly as they appear in the document
                    3. For fields with no information, use "EMPTY"
                    4. Provide DATE fields ONLY in MM/DD/YYYY format.

                    Required JSON Output Format:
                    {
                        "CMS1500_section": {                            
                            "patients_name": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            },
                            "patients_birth_date": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            },
                            "other_claim_id": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            },
                            "insureds_policy_group_or_feca_number": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            },
                            "date_of_current_illness_injury": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            },
                            "total_charge": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            },
                            "cpt_hcpcs": {
                                "value": "STRING",
                                "confidence": "FLOAT"
                            }                            
                            
                        }
                        
                    }

                    CRITICAL: Return ONLY valid JSON. No explanations, no prefixes, no suffixes. 
                    Generate only a perfect JSON till end.
                    Do not provide any supporting or explanation text beyond generating the perfect JSON.
                    Skip any preamble text and generate the final JSON ONLY. 

                """
    #####################
    return ""

def get_prompt_ready(classification, raw_text, tabletext, key_value_pair_data, entities_to_be_extracted):
    """Generate prompt for entity extraction"""
    prompt = f"""Human: 
    
    You are an expert document information extraction assistant specializing in parsing Worker Compensation {classification} document. Your task is to extract all key entities with precision.

    You are provided with '{classification}' document within the <raw_text>,  <key_value_pair_data> and <table_text> xml tags.
   
    <raw_text>{raw_text}</raw_text> , 
    <key_value_pair_data>{key_value_pair_data}</key_value_pair_data> , 
    <table_text>{tabletext}</table_text> 

    The raw text of '{classification}' document is within <raw_text> xml tag.
    The key value pair of '{classification}' document are mentioned as a list within <key_value_pair_data> xml tag.
    The tabular data of the '{classification}' document are mentioned as a json array with objects within <table_text> xml tag.     

    {entities_to_be_extracted} 

    Additional Guidelines:
    - Be extremely precise in extraction
    - If unsure about a value, still provide best possible guess
    - Confidence score should reflect extraction accuracy
    - Prioritize direct text matches over interpretations
    - Consider context and surrounding text for validation
    - Do not provide any supporting or explanation text beyond generating the perfect JSON.
    - Skip any preamble text and generate the final JSON ONLY. 
    - Generate only a perfect JSON till end.

    Provide the extracted information in the specified JSON format, ensuring comprehensive coverage of all document entities.

    
    Assistant:"""
    
    return prompt

def get_legal_prompt_ready(classification, raw_text, tabletext, key_value_pair_data, entities_to_be_extracted):
    """Generate prompt for entity extraction"""
    prompt = f"""Human: 
    
    You are an expert ai validation legal person of United States (both County and Federal) and an expert 
    document information extraction assistant specializing in parsing Worker Compensation {classification} documents. 
    Your task is to extract all key entities with precision.
    
    You are provided with '{classification}' document within the <raw_text>,  <key_value_pair_data> and <table_text> xml tags.
   
    <raw_text>{raw_text}</raw_text> , 
    <key_value_pair_data>{key_value_pair_data}</key_value_pair_data> , 
    <table_text>{tabletext}</table_text> 

    The raw text of '{classification}' document is within <raw_text> xml tag.
    The key value pair of '{classification}' document are mentioned as a list within <key_value_pair_data> xml tag.
    The tabular data of the '{classification}' document are mentioned as a json array with objects within <table_text> xml tag.     

    {entities_to_be_extracted} 

    Additional Guidelines:
    - Be extremely precise in extraction
    - If unsure about a value, still provide best possible guess
    - Confidence score should reflect extraction accuracy
    - Prioritize direct text matches over interpretations
    - Consider context and surrounding text for validation
    - Do not provide any supporting or explanation text beyond generating the perfect JSON.
    - Skip any preamble text and generate the final JSON ONLY. 
    - Generate only a perfect JSON till end.

    Provide the extracted information in the specified JSON format, ensuring comprehensive coverage of all document entities.

    
    Assistant:"""
    
    return prompt

def execute_model(prompt, bedrock):
    """Execute Claude model for entity extraction"""
    try:
        print("inside execute_model() method. Please wait Large Language Model (Haiku) is preparing your JSON....")
        
        start_time = time.time()
        model_id = "anthropic.claude-3-haiku-20240307-v1:0"
        response = bedrock.invoke_model(
            modelId=model_id,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 5000,
                "messages": [{
                    "role": "user",
                    "content": [{"type": "text", "text": prompt}],
                }]
            }),
        )
        
        end_time = time.time()
        print(f"Time taken by execute_model() {end_time - start_time} sec")
        
        result = json.loads(response.get("body").read())
        output_list = result["content"]
        for output in output_list:
            return output["text"]
            
    except Exception as error:
        print(f"Exception in execute_model(): {error}")
        print('Exception Details:', traceback.format_exc())
        return ""

def extract_empty_keys(data):
    """Extracts the keys from a JSON object whose values are empty or not filled."""
    empty_keys = []
    for key, value in data.items():
        if not value or value == "None":
            empty_keys.append(key)
        elif isinstance(value, dict):
            nested_empty_keys = extract_empty_keys(value)
            if nested_empty_keys:
                empty_keys.extend([f"{key}.{nested_key}" for nested_key in nested_empty_keys])
    return empty_keys

def calculate_stats(data):
    """Calculates the total number of keys and the percentage of keys with empty values."""
    total_keys = 0
    empty_keys = extract_empty_keys(data)
    empty_keys_count = len(empty_keys)

    def count_keys(d):
        nonlocal total_keys
        total_keys += len(d)
        for value in d.values():
            if isinstance(value, dict):
                count_keys(value)

    count_keys(data)
    empty_keys_percentage = (empty_keys_count / total_keys) * 100 if total_keys > 0 else 0

    return total_keys, empty_keys_count, empty_keys_percentage

def upsert_dashboard_record(tablename, docid, **kwargs):
    """
    Update existing record or insert new record in specified DynamoDB table

    Args:
        tablename (str): Name of the DynamoDB table
        docid (str): Document ID (primary key)
        **kwargs: Additional fields to update/insert

    Returns:
        dict: Response from DynamoDB operation
    """
    table = dynamodb_resource.Table(tablename)

    # Build update expression and attribute values
    update_expression = "SET "
    expression_attribute_values = {}

    for key, value in kwargs.items():
        update_expression += f"{key} = :{key}, "
        expression_attribute_values[f":{key}"] = value

    # Remove trailing comma and space
    update_expression = update_expression.rstrip(", ")
    print("update_expression =", update_expression)
    
    try:
        response = table.update_item(
            Key={'docid': docid},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues='ALL_NEW'
        )
        print("response =", response)
        return response
    except ClientError as e:
        print(f"Error updating record: {e}")
        raise
