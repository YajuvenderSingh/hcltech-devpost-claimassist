import json
import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Attr
import uuid

def convert_dynamodb_to_json(item):
    """Convert DynamoDB item to regular JSON"""
    def convert_value(value):
        if isinstance(value, dict):
            if 'S' in value:
                return value['S']
            elif 'N' in value:
                return int(value['N']) if value['N'].isdigit() else float(value['N'])
            elif 'L' in value:
                return [convert_value(v) for v in value['L']]
            elif 'M' in value:
                return {k: convert_value(v) for k, v in value['M'].items()}
        return value
    
    return {k: convert_value(v) for k, v in item.items()}

def convert_decimals(obj):
    """Convert Decimal types to regular numbers"""
    if isinstance(obj, dict):
        return {k: convert_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimals(v) for v in obj]
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    else:
        return obj

def singleclaimfetch(claimid):
    """Fetch a single claim by claim ID"""
    dynamodb_tbl_nm = "claimassistv2-claimdetails"
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_tbl_nm)
    
    print(f"Searching for claimid: {claimid}")
    
    try:
        # Instead of using FilterExpression, let's scan all and filter in Python
        print("Scanning database for the specific claim...")
        
        response = table.scan()
        all_items = response['Items']
        
        # Handle pagination
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            all_items.extend(response['Items'])
        
        print(f"Total items scanned: {len(all_items)}")
        
        # Find the specific claim in Python (more reliable)
        matching_items = []
        for item in all_items:
            if item.get('claimid') == claimid:
                matching_items.append(item)
        
        print(f"Found {len(matching_items)} matching items for claimid: {claimid}")
        
        if len(matching_items) > 0:
            item = matching_items[0]
            converted_item = convert_decimals(item)
            
            print(f"✅ Returning data for claimid: {claimid}")
            print(f"Item keys: {list(converted_item.keys())}")
            
            # Check for extracted data
            if 'total_extracted_data' in converted_item:
                extracted_data = converted_item['total_extracted_data']
                if extracted_data and str(extracted_data).strip():
                    print(f"✅ Has extracted data (length: {len(str(extracted_data))})")
                    print(f"Data preview: {str(extracted_data)[:200]}...")
                else:
                    print("⚠️ total_extracted_data field exists but is empty/null")
            else:
                print("⚠️ No total_extracted_data field found")
            
            return converted_item
        else:
            print(f"❌ No matching item found for claimid: {claimid}")
            
            # Debug: Show what claim IDs actually exist
            existing_ids = [item.get('claimid') for item in all_items[:10] if 'claimid' in item]
            print(f"Sample existing claim IDs: {existing_ids}")
            
            return "claim data not present"
            
    except Exception as e:
        print(f"❌ Error querying DynamoDB: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return "claim data not present"    """Fetch a single claim by claim ID"""
    dynamodb_tbl_nm = "claimassistv2-claimdetails"
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_tbl_nm)
    
    print(f"Searching for claimid: {claimid}")
    
    try:
        # First, let's see what claim IDs actually exist in the database
        print("Scanning database for existing claim IDs...")
        scan_response = table.scan(ProjectionExpression="claimid")
        
        all_claim_ids = []
        for item in scan_response['Items']:
            if 'claimid' in item:
                all_claim_ids.append(item['claimid'])
        
        # Handle pagination
        while 'LastEvaluatedKey' in scan_response:
            scan_response = table.scan(
                ProjectionExpression="claimid",
                ExclusiveStartKey=scan_response['LastEvaluatedKey']
            )
            for item in scan_response['Items']:
                if 'claimid' in item:
                    all_claim_ids.append(item['claimid'])
        
        print(f"Total claim IDs in database: {len(all_claim_ids)}")
        print(f"First 5 claim IDs: {all_claim_ids[:5]}")
        print(f"Looking for claimid: '{claimid}' (type: {type(claimid)})")
        
        # Check if the claimid exists
        if claimid in all_claim_ids:
            print(f"✅ Found exact match for claimid: {claimid}")
        else:
            print(f"❌ No exact match found for claimid: {claimid}")
            # Show some similar IDs for debugging
            similar_ids = [cid for cid in all_claim_ids if str(claimid)[:2] in str(cid)][:5]
            print(f"Similar IDs starting with '{claimid[:2]}': {similar_ids}")
        
        # Search for the specific claim
        response = table.scan(
            FilterExpression=Attr('claimid').eq(claimid)
        )
        
        items = response['Items']
        print(f"Found {len(items)} items for claimid: {claimid}")
        
        if len(items) > 0:
            item = items[0]
            converted_item = convert_decimals(item)
            
            print(f"✅ Returning data for claimid: {claimid}")
            print(f"Item keys: {list(converted_item.keys())}")
            
            # Check for extracted data
            if 'total_extracted_data' in converted_item:
                extracted_data = converted_item['total_extracted_data']
                if extracted_data and extracted_data.strip():
                    print(f"✅ Has extracted data (length: {len(str(extracted_data))})")
                    print(f"Data preview: {str(extracted_data)[:200]}...")
                else:
                    print("⚠️ total_extracted_data field exists but is empty")
            else:
                print("⚠️ No total_extracted_data field found")
            
            return converted_item
        else:
            print(f"❌ No data found for claimid: {claimid}")
            return "claim data not present"
            
    except Exception as e:
        print(f"❌ Error querying DynamoDB: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return "claim data not present"

def fetchsinglerec(claimid):
    """Wrapper for singleclaimfetch"""
    return singleclaimfetch(claimid)

def allitemscan():
    """Scan all items from the DynamoDB table"""
    dynamodb_tbl_nm = "claimassistv2-claimdetails"
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(dynamodb_tbl_nm)
    
    try:
        print("🔍 Starting DynamoDB scan for all items...")
        response = table.scan()
        items = response['Items']
        
        # Handle pagination
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response['Items'])
        
        converted_items = [convert_decimals(item) for item in items]
        print(f"✅ Found {len(converted_items)} total items in table")
        
        # Enhanced logging for debugging
        if converted_items:
            sample_item = converted_items[0]
            print(f"Sample item keys: {list(sample_item.keys())}")
            
            # Show first few claim IDs
            claim_ids = []
            for item in converted_items[:10]:
                if 'claimid' in item:
                    claim_ids.append(item['claimid'])
            print(f"First 10 claim IDs: {claim_ids}")
            
            # Check how many have extracted data
            with_extracted_data = 0
            for item in converted_items:
                if item.get('total_extracted_data') and str(item['total_extracted_data']).strip():
                    with_extracted_data += 1
            
            print(f"Items with extracted data: {with_extracted_data}/{len(converted_items)}")
        
        return converted_items
        
    except Exception as e:
        print(f"❌ Error scanning DynamoDB: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return []

def allclaimsfetch():
    """Fetch all claims data"""
    print("📋 Fetching all claims data...")
    return allitemscan()

def sendtoPSproQ(claimid, s3filename, action):
    """Send message to Policy Document processing queue"""
    sqs = boto3.client('sqs')
    queue_url = "https://sqs.us-east-1.amazonaws.com/040504913362/ClaimAssistV2PolicyDocProcessingQueue"
    
    try:
        message_body = {
            "claimid": claimid,
            "s3filename": s3filename,
            "action": action,
            "timestamp": str(boto3.Session().region_name),
            "message_type": "policy_processing"
        }
        
        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message_body),
            MessageAttributes={
                'ClaimId': {
                    'StringValue': claimid,
                    'DataType': 'String'
                },
                'S3Filename': {
                    'StringValue': s3filename,
                    'DataType': 'String'
                },
                'Action': {
                    'StringValue': action,
                    'DataType': 'String'
                }
            }
        )
        
        print(f"✅ Message sent to Policy Doc processing queue: {response['MessageId']}")
        return {"status": "success", "MessageId": response['MessageId']}
        
    except Exception as e:
        print(f"❌ Error sending to Policy Doc processing queue: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        mock_id = str(uuid.uuid4())
        return {"status": "error", "MessageId": mock_id, "error": str(e)}

def sendtodocproQ(indexid, s3filename, docid, source):
    """Send message to Document processing queue"""
    sqs = boto3.client('sqs')
    
    queue_url = "https://sqs.us-east-1.amazonaws.com/040504913362/NMMDocProcessingQueue"
    try:
        message_body = {
            "indexid": indexid,
            "s3filename": s3filename,
            "docid": docid,
            "timestamp": str(boto3.Session().region_name),
            "message_type": "document_processing",
            "source": source
        }
        print(f"Final message_body going to SQS queue: {message_body}")
        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message_body),
            MessageAttributes={
                'IndexId': {
                    'StringValue': indexid,
                    'DataType': 'String'
                },
                'S3Filename': {
                    'StringValue': s3filename,
                    'DataType': 'String'
                },
                'DocId': {
                    'StringValue': docid,
                    'DataType': 'String'
                }

            }
        )
        
        print(f"✅ Message sent to document processing queue successfully!")
        print(f"✅ MessageId: {response['MessageId']}")
        print(f"📨 Message body: {json.dumps(message_body)}")
        
        return {"status": "success", "MessageId": response['MessageId']}
        
    except Exception as e:
        print(f"❌ Error sending to document processing queue: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        mock_id = str(uuid.uuid4())
        return {"status": "error", "MessageId": mock_id, "error": str(e)}

def sendtoembeddingQ(claimid, s3filename):
    """Send message to Document Embedding queue"""
    sqs = boto3.client('sqs')
    queue_url = "https://sqs.us-east-1.amazonaws.com/040504913362/ClaimAssistV2DocEmbeddingQueue"
    
    try:
        message_body = {
            "claimid": claimid,
            "s3filename": s3filename,
            "timestamp": str(boto3.Session().region_name),
            "message_type": "document_embedding"
        }
        
        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message_body),
            MessageAttributes={
                'ClaimId': {
                    'StringValue': claimid,
                    'DataType': 'String'
                },
                'S3Filename': {
                    'StringValue': s3filename,
                    'DataType': 'String'
                }
            }
        )
        
        print(f"✅ Message sent to embedding queue: {response['MessageId']}")
        return {"status": "success", "MessageId": response['MessageId']}
        
    except Exception as e:
        print(f"❌ Error sending to embedding queue: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        mock_id = str(uuid.uuid4())
        return {"status": "error", "MessageId": mock_id, "error": str(e)}

def verifyclaim(claimid, psid):
    """Verify claim - placeholder implementation"""
    print(f"🔍 Verifying claim: {claimid} with PS: {psid}")
    return {
        "status": "verified", 
        "claimid": claimid, 
        "psid": psid,
        "summary": f"Verification completed for claim {claimid}"
    }

def GenerateEmail(claimid, psid):
    """Generate email - placeholder implementation"""
    print(f"📧 Generating email for claim: {claimid} with PS: {psid}")
    return {
        "email": "generated", 
        "claimid": claimid, 
        "psid": psid,
        "subject": f"Claim {claimid} Processing Update",
        "body": f"Your claim {claimid} has been processed."
    }
def fetch_extraction_data(claimid):
    """Fetch extracted data from multiple processing tables"""
    print(f"Fetching all processing data for claimid: {claimid}")
    
    # Initialize result structure
    result = {
        'claimid': claimid,
        'extraction_data': None,
        'classification_data': None,
        'entity_data': None,
        'confidence_data': None,
        'status': 'not_found'
    }
    
    try:
        # 1. Check extraction data (nmm-doc-extraction table)
        extraction_data = fetch_from_extraction_table(claimid)
        if extraction_data:
            result['extraction_data'] = extraction_data
            result['status'] = 'extraction_complete'
        
        # 2. Check classification data (likely nmm-doc-classification table)
        classification_data = fetch_from_classification_table(claimid)
        if classification_data:
            result['classification_data'] = classification_data
            result['status'] = 'classification_complete'
        
        # 3. Check entity extraction data
        entity_data = fetch_from_entity_table(claimid)
        if entity_data:
            result['entity_data'] = entity_data
            result['status'] = 'entity_complete'
        
        # 4. Check confidence scores
        confidence_data = fetch_from_confidence_table(claimid)
        if confidence_data:
            result['confidence_data'] = confidence_data
            result['status'] = 'confidence_complete'
        
        # 5. Check final processed data (main claims table)
        final_data = fetch_final_processed_data(claimid)
        if final_data:
            result['final_data'] = final_data
            result['status'] = 'fully_processed'
        
        return result
        
    except Exception as e:
        print(f"❌ Error fetching processing data: {str(e)}")
        result['error'] = str(e)
        result['status'] = 'error'
        return result

def fetch_from_extraction_table(claimid):
    """Fetch from nmm-doc-extraction table"""
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('nmm-doc-extraction')
    
    try:
        response = table.scan(FilterExpression=Attr('indexid').eq(claimid))
        items = response['Items']
        
        if items:
            return [convert_decimals(item) for item in items]
        return None
    except Exception as e:
        print(f"Error fetching extraction data: {e}")
        return None

def fetch_from_classification_table(claimid):
    """Fetch from classification table (adjust table name as needed)"""
    dynamodb = boto3.resource('dynamodb')
    # Adjust table name based on your actual classification table
    table_name = 'nmm-doc-classification'  # or whatever your classification table is named
    
    try:
        table = dynamodb.Table(table_name)
        response = table.scan(FilterExpression=Attr('indexid').eq(claimid))
        items = response['Items']
        
        if items:
            return [convert_decimals(item) for item in items]
        return None
    except Exception as e:
        print(f"Error fetching classification data: {e}")
        return None

def fetch_from_entity_table(claimid):
    """Fetch from entity extraction table"""
    dynamodb = boto3.resource('dynamodb')
    # Adjust table name based on your actual entity table
    table_name = 'nmm-entity-extraction'  # or whatever your entity table is named
    
    try:
        table = dynamodb.Table(table_name)
        response = table.scan(FilterExpression=Attr('indexid').eq(claimid))
        items = response['Items']
        
        if items:
            return [convert_decimals(item) for item in items]
        return None
    except Exception as e:
        print(f"Error fetching entity data: {e}")
        return None

def fetch_from_confidence_table(claimid):
    """Fetch from confidence scoring table"""
    dynamodb = boto3.resource('dynamodb')
    # Adjust table name based on your actual confidence table
    table_name = 'nmm-confidence-scores'  # or whatever your confidence table is named
    
    try:
        table = dynamodb.Table(table_name)
        response = table.scan(FilterExpression=Attr('indexid').eq(claimid))
        items = response['Items']
        
        if items:
            return [convert_decimals(item) for item in items]
        return None
    except Exception as e:
        print(f"Error fetching confidence data: {e}")
        return None

def fetch_final_processed_data(claimid):
    """Fetch final processed data from main claims table"""
    return singleclaimfetch(claimid)
def fetchtmpltemail(claimid):

    """Fetch template email - placeholder implementation"""
    print(f"📧 Fetching template email for claim: {claimid}")
    return {
        "template": "email", 
        "claimid": claimid,
        "subject": f"Template for Claim {claimid}",
        "body": f"This is a template email for claim {claimid}"
    }