import json
import logging
import re
import copy
from typing import Dict, Any, List
import boto3
from botocore.exceptions import ClientError

logging.basicConfig(level=logging.INFO)

def invoke_claude_model(prompt: str, model_id: str, region: str, max_tokens: int = 8000, temperature: float = 0.5) -> str:
    client = boto3.client("bedrock-runtime", region_name=region)
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [
            {"role": "user", "content": [{"type": "text", "text": prompt}]}
        ]
    }
    try:
        response = client.invoke_model(
            modelId=model_id,
            body=json.dumps(request_body),
            accept="application/json",
            contentType="application/json"
        )
        model_response = json.loads(response["body"].read())
        return model_response["content"][0]["text"]
    except (ClientError, Exception) as e:
        logging.error(f"Failed to invoke model '{model_id}': {e}")
        return ""

def call_nova(prompt: str, model_id: str, region: str, max_tokens: int = 8000) -> str:
    client = boto3.client("bedrock-runtime", region_name=region)
    try:
        response = client.converse(
            modelId=model_id,
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            inferenceConfig={"temperature": 0.5, "maxTokens": max_tokens, "topP": 0.9}
        )
        return response["output"]["message"]["content"][0]["text"]
    except (ClientError, Exception) as e:
        logging.error(f"Failed to invoke Nova '{model_id}': {e}")
        return ""

def dispatch_llm_call(prompt: str, model_name: str, model_id: str, region: str, max_tokens: int = 8000) -> str:
    if model_name in ["haiku", "sonnet"]:
        return invoke_claude_model(prompt, model_id, region, max_tokens)
    elif model_name == "nova":
        return call_nova(prompt, model_id, region, max_tokens)
    else:
        raise ValueError(f"Unsupported model_name: {model_name}")

def extract_fields_for_scoring(template: Dict[str, Any]) -> List[Dict[str, str]]:
    fields = []
    for tab, content in template.items():
        if not isinstance(content, dict):
            continue
        for key, value in content.items():
            if isinstance(value, dict):
                v = value.get("extracted_text", "")
                if isinstance(v, str) and v.strip():
                    fields.append({"tab": tab, "field": key, "value": v.strip()})
    return fields

def extract_fields_for_scoring(entities: Dict[str, Any]) -> List[Dict[str, str]]:
    """Extract fields from extracted_entities structure"""
    fields = []
    print(entities.items())
    def traverse_dict(obj, path=""):
        for key, value in obj.items():
            current_path = f"{path}.{key}" if path else key
            
            if isinstance(value, dict):
                # Check if this is a leaf node with 'value' attribute
                if 'value' in value:
                    val = value.get('value', '')
                    
                    # Handle complex value structure (current_value/previous_value)
                    if isinstance(val, dict) and 'current_value' in val:
                        actual_val = val.get('current_value', '')
                    else:
                        actual_val = val
                    
                    if isinstance(actual_val, str) and actual_val.strip():
                        fields.append({
                            "path": current_path,
                            "field": key,
                            "value": actual_val.strip()
                        })
                else:
                    # Recurse deeper
                    traverse_dict(value, current_path)
    
    traverse_dict(entities)
    return fields

def build_confidence_prompt(text: str, fields: List[Dict[str, str]]) -> str:
    prompt = (
        "You are a clinical validation AI.\n"
        "Assign a confidence score in the closed interval [0, 1] for each extracted field value,\n"
        "reflecting how strongly the source text supports it (consider context like entity names, dates, units).\n\n"
        "Return ONLY a valid JSON object. Keys must be field names. Values must be numeric (floats).\n"
        "No explanations, no extra text. Example: {\"field1\": 0.85, \"field2\": 0.62}\n\n"
        "Scoring guidance:\n"
        "- Use the upper end of the scale only when the text explicitly supports the value and its context aligns.\n"
        "- If support is strong but minor uncertainty remains, choose a high value below the upper end.\n"
        "- If support is implied/ambiguous/partial, choose a mid value.\n"
        "- If weakly supported or not supported, choose a low value near 0; if contradicted, use 0.\n\n"
        f"Clinical Text:\n{text}\n\n"
        "Extracted Fields:\n"
    )
    for f in fields:
        prompt += f"- {f['field']}: {f['value']}\n"
    return prompt + "\nReturn JSON only:"

def parse_llm_scores(raw: str) -> Dict[str, float]:
    if not raw:
        return {}
    try:
        obj = json.loads(raw)
        return obj if isinstance(obj, dict) else {}
    except Exception:
        m = re.search(r"\{[\s\S]*\}", raw)
        if m:
            try:
                obj = json.loads(m.group(0))
                return obj if isinstance(obj, dict) else {}
            except Exception:
                return {}
        return {}

def score_entity_confidence(text: str,entities: Dict[str, Any], model_name: str, model_id: str, region: str, batch_size: int) -> Dict[str, Any]:
    """Score confidence for  extracted_entities structure"""
    fields = extract_fields_for_scoring(entities)
    print("extracted fileds", fields)
    if not fields:
        logging.info("No fields with 'value' found; nothing to score.")
        return entities

    for i in range(0, len(fields), batch_size):
        batch = fields[i:i + batch_size]
        prompt = build_confidence_prompt(text, batch)

        try:
            raw = dispatch_llm_call(prompt, model_name, model_id, region)
            scores = parse_llm_scores(raw)
        except Exception as e:
            logging.warning(f"Failed to obtain/parse LLM output for batch {i//batch_size + 1}: {e}")
            continue

        for item in batch:
            field_name = item["field"]
            path = item["path"]
            score = scores.get(field_name)
            
            if score is not None:
                # Convert to percentage (0-100%)
                percentage = f"{int(round(score * 100))}%"
                
                # Navigate to the correct location and update confidence
                path_parts = path.split('.')
                current = entities
                
                # Navigate to the parent of the target field
                for part in path_parts[:-1]:
                    if part in current and isinstance(current[part], dict):
                        current = current[part]
                    else:
                        break
                else:
                    # Update confidence if the field exists
                    final_field = path_parts[-1]
                    if final_field in current and isinstance(current[final_field], dict):
                        current[final_field]["confidence"] = percentage

    return entities

def run_confidence_scorer(text: str, extracted_entities: Dict[str, Any], model_name: str, model_id: str, region: str = "us-east-1", batch_size: int = 20) -> Dict[str, Any]:
    """Run confidence scoring for  extracted_entities"""
    try:
        safe_entities = copy.deepcopy(extracted_entities)
        print("inside score entity ", safe_entities)
        updated = score_entity_confidence(safe_entities, text, model_name, model_id, region, batch_size)
        return updated
    except Exception as e:
        logging.error(f"Error in  confidence scoring module: {str(e)}")
        return extracted_entities


# Document-level confidence score function
def percent_to_decimal(value):
    """Convert percentage string to decimal (0-1 range)"""
    if isinstance(value, str) and '%' in value:
        return float(value.replace('%', '')) / 100
    return float(value) if value else 0.0

def calculate_document_confidence_score(
    template: Dict[str, Any], 
    field_weights: Dict[str, float] = None
) -> float:
    """
    Calculate document-level confidence score based on weighted average of entity scores.
    
    Args:
        template: Updated template with entity_confidence_score values
        field_weights: Dict mapping field names to weights. If None, uses default weights.
    
    Returns:
        Document confidence score [0,1]
    """
    # Default weights - adjust based on your domain requirements
    default_weights = {
        "Patient Name": 0.25,
        "DOB": 0.20,
        "Sex": 0.10,
        "Mailbox": 0.15,
        "Safety Received Date": 0.15,
        "Due Date": 0.10,
        "Day of initiation": 0.05
    }
    
    weights = field_weights or default_weights
    
    weighted_sum = 0.0
    total_weight = 0.0
    
    for tab_name, tab_data in template.items():
        if not isinstance(tab_data, dict):
            continue
            
        for field_name, field_data in tab_data.items():
            if not isinstance(field_data, dict):
                continue
                
            score_str = field_data.get("confidence", "")
            score_num=percent_to_decimal(score_str)
            print(field_name,score_str,score_num)
            if not score_num or score_num == "":
                continue
                
            try:
                score = float(score_num)
                print(field_name,score)
                weight = weights.get(field_name, 0.05)  # default low weight for unknown fields
                weighted_sum += score * weight
                print("weiged sum",weighted_sum)
                total_weight += weight
            except (ValueError, TypeError):
                continue
    
    return weighted_sum / total_weight if total_weight > 0 else 0.0


# Updated run_confidence_scorer with document score
def run_confidence_scorer_with_doc_score(
    text: str,
    extracted_entities: Dict[str, Any],
    model_name: str,
    model_id: str,
    field_weights: Dict[str, float] = None,
    region: str = "us-east-1",
    batch_size: int = 20
) -> Dict[str, Any]:
    """
    Enhanced version that includes document-level confidence score.
    """
    try:
        #batch_size = confidence_config.get("field_batch_size", 20)
        #safe_template = copy.deepcopy(validated_template)
        print("inside conf scoering")
        updated = score_entity_confidence(text, extracted_entities, model_name, model_id, region, batch_size)
        print("updated",updated)
        # Add document-level confidence score
        doc_score = calculate_document_confidence_score(updated, field_weights)
        doc_score_perc= f"{int(round(doc_score * 100))}%"
        #updated["document_confidence_score"] = doc_score_perc        
        return updated,doc_score_perc
    except Exception as e:
        logging.error(f"Error in confidence scoring module: {str(e)}")
        #logging.error(traceback.format_exc())
        return {}

def get_entity_weights(classification):
    """Get entity weights based on document classification for confidence scoring"""
    
    if classification == 'ClaimForm':
        return {
            # Claim Details Section - High Priority
            "employee_name": 1,
            "wcb_case_number_jcn": 1,
            "date_of_injury": 1,
            "claim_administrator_claim_number": 1,
            
            # Employee Information - Critical
            "employee_first_name": 1,
            "employee_last_name": 1,
            "date_of_birth": 1,
            "mailing_address": 1,
            "city": 1,
            "state": 1,
            "postal_code": 1,
            
            # Insurer Information - Medium Priority
            "insurer_name": 1,
            "insurer_id": 1,
            
            # Injury Details - High Priority
            "nature_of_injury": 1,
            "part_of_body": 1,
            
            # Work Status - Medium Priority
            "initial_return_to_work_date": 1,
            
            # Policy Information - Low Priority
            "policy_number_id": 1
        }
    
    elif classification == 'MedicalReport':
        return {
            "employee_name": 1,
            "diagnosis": 1,
            "date_of_injury": 1
        }
    
    elif classification == 'DoctorReportMMI':
        return {
            # Claim Details
            "claim_admin_claim_number": 1,
            
            # Patient Information - Critical
            "patients_name": 1,
            "date_of_injury_illness": 1,
            
            # Diagnosis - High Priority
            "enter_icd10_code": 1,
            "icd10_descriptor": 1,
            
            # MMI Status - Critical
            "has_the_patient_reached_maximum_medical_improvement": 1,
            
            # Functional Capabilities
            "has_the_patient_had_an_injury_illness_since_the_date_of_injury_which_impacts_residual_functional_capacity": 1
        }
    
    elif classification == 'PhysicalTherapy':
        return {
            "date": 1,
            "frequency": 1,
            "per_wk_for": 1
        }
    
    elif classification == 'Prescription':
        return {
            "name": 1,
            "date": 1
        }
    
    # Default weights for unknown classification
    return {}


# def update_doc_status(docid):
#     dynamodb = boto3.resource('dynamodb')
#     table = dynamodb.Table('email_reader_v1')

#     # Find the item first
#     response = table.scan(
#         FilterExpression=boto3.dynamodb.conditions.Attr('docid').eq(docid)
#     )

#     # Update each matching item
#     for item in response['Items']:
#         table.update_item(
#             Key={k: item[k] for k in table.key_schema},  # Use actual primary key
#             UpdateExpression='SET doc_status = :status',
#             ExpressionAttributeValues={':status': "Completed"}
#         )
    
#     return "Updated Email Reader Status to Completed for docid"

def update_doc_status_new(docid, new_status):
    print("inside update_doc_status_new()  docid and new_status  = ", docid, new_status)
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('email_reader_v1')
    print("table  = ", table)
    # First, find the item by docid (assuming it's a GSI or you need to scan)
    response = table.scan(
        FilterExpression=boto3.dynamodb.conditions.Attr('doc_id').eq(docid)
    )
    print("before updating the record is  = ", response['Items'])

    if response['Items']:
        item = response['Items'][0]
        # Get the partition key from the found item
        partition_key = item['seqid']  # Replace with actual partition key name
        print("partition_key = ", partition_key)
        seqid_sort = item['seqid_sort']  # Replace with actual partition key name
        print("seqid_sort = ", seqid_sort)
        

        # Update only the doc_status field
        table.update_item(
            Key={'seqid': partition_key, 'seqid_sort': seqid_sort},  # Replace with actual partition key name
            UpdateExpression='SET doc_status = :status',
            ExpressionAttributeValues={':status': new_status}
        )
        return "Updated Email Reader Status to Completed for docid"
    return "Could not Update Email Reader Status for docid"