import json
import boto3
import os
import uuid
import time

def lambda_handler(event, context):
    try:
        print("Event = ", event)
        
        # Parse SQS message
        data_string = event['Records'][0]['body']
        print("event[body]", data_string, type(data_string))
        
        if isinstance(data_string, dict):
            qtext = data_string
        else:
            qtext = json.loads(data_string)
        
        print("qtext=json.loads(data_string) :", type(qtext), qtext)
        
        # Extract parameters
        s3_filename = qtext['s3filename']
        indexid = qtext['indexid']
        docid = qtext['docid']
        
        print("indexid = ", indexid)
        print("docid = ", docid)
        print("s3PDF = ", s3_filename)
        
        # Get bucket name from environment or use default
        bucket_name = os.environ.get('BUCKET_NAME', 'aimlusecasesv1')
        print(f"Using bucket: {bucket_name}")
        
        # Initialize AWS clients
        textract = boto3.client('textract', region_name='us-east-1')
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        
        # Update dashboard status
        try:
            dashboard_table = dynamodb.Table('nmm-dashboard')
            dashboard_table.put_item(
                Item={
                    'indexid': indexid,
                    'docid': docid,
                    'extraction_status': 'Processing',
                    'classification_status': 'To Be Processed',
                    'entity_extraction_status': 'To Be Processed',
                    'gw_claim_id': 'To Be Processed',
                    'confidence_score_status': 'To Be Processed'
                }
            )
            print("✅ Dashboard record created")
        except Exception as e:
            print(f"⚠️ Dashboard update failed: {e}")
        
        # Start Textract document analysis
        print("🔍 Starting Textract analysis...")
        
        response = textract.start_document_analysis(
            DocumentLocation={
                'S3Object': {
                    'Bucket': bucket_name,
                    'Name': s3_filename
                }
            },
            FeatureTypes=['TABLES', 'FORMS']
        )
        
        job_id = response['JobId']
        print(f"📋 Textract job started: {job_id}")
        
        # Wait for job completion
        max_wait_time = 300  # 5 minutes
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            response = textract.get_document_analysis(JobId=job_id)
            status = response['JobStatus']
            
            print(f"📊 Textract status: {status}")
            
            if status == 'SUCCEEDED':
                break
            elif status == 'FAILED':
                raise Exception(f"Textract job failed: {response.get('StatusMessage', 'Unknown error')}")
            
            time.sleep(10)
        
        if status != 'SUCCEEDED':
            raise Exception("Textract job timed out")
        
        # Extract text from results
        print("📝 Extracting text from Textract results...")
        
        blocks = response['Blocks']
        next_token = response.get('NextToken')
        
        # Get all pages if there are more
        while next_token:
            response = textract.get_document_analysis(JobId=job_id, NextToken=next_token)
            blocks.extend(response['Blocks'])
            next_token = response.get('NextToken')
        
        # Process blocks to extract text
        raw_text = ""
        table_data = []
        key_value_pairs = []
        
        for block in blocks:
            if block['BlockType'] == 'LINE':
                raw_text += block['Text'] + "\n"
            elif block['BlockType'] == 'KEY_VALUE_SET':
                if 'KEY' in block.get('EntityTypes', []):
                    # Simple key-value extraction
                    key_text = block.get('Text', '')
                    key_value_pairs.append(key_text)
        
        print(f"✅ Extracted {len(raw_text)} characters of text")
        
        # Classify document
        classification = classify_document(raw_text)
        print(f"📋 Document classified as: {classification}")
        
        # Store extraction results
        try:
            extraction_table = dynamodb.Table('nmm-doc-extraction')
            extraction_table.put_item(
                Item={
                    'docid': docid,
                    'document_name': s3_filename.split('/')[-1],
                    's3_filename': s3_filename,
                    'rawtext': raw_text,
                    'tbltxt': json.dumps(table_data),
                    'keyvaluesText': json.dumps(key_value_pairs),
                    'classification': classification,
                    'extraction_timestamp': int(time.time()),
                    'status': 'completed'
                }
            )
            print("✅ Extraction results stored in DynamoDB")
        except Exception as e:
            print(f"⚠️ Failed to store extraction results: {e}")
        
        # Update dashboard status to completed
        try:
            dashboard_table.update_item(
                Key={'indexid': indexid, 'docid': docid},
                UpdateExpression='SET extraction_status = :status',
                ExpressionAttributeValues={':status': 'Completed'}
            )
            print("✅ Dashboard status updated to Completed")
        except Exception as e:
            print(f"⚠️ Dashboard update failed: {e}")
        
        print(f"🎉 Document extraction completed successfully for docid: {docid}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Document extraction completed successfully',
                'docid': docid,
                'classification': classification,
                'text_length': len(raw_text)
            })
        }
        
    except Exception as e:
        print(f"❌ Error in document extraction: {str(e)}")
        
        # Update dashboard status to failed
        try:
            if 'indexid' in locals() and 'docid' in locals():
                dashboard_table = dynamodb.Table('nmm-dashboard')
                dashboard_table.update_item(
                    Key={'indexid': indexid, 'docid': docid},
                    UpdateExpression='SET extraction_status = :status',
                    ExpressionAttributeValues={':status': 'Failed'}
                )
        except:
            pass
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Document extraction failed'
            })
        }

def classify_document(text):
    """Simple document classification based on content"""
    text_lower = text.lower()
    
    if any(keyword in text_lower for keyword in ['claim', 'injury', 'workers compensation', 'wcb']):
        return 'ClaimForm'
    elif any(keyword in text_lower for keyword in ['medical', 'doctor', 'physician', 'treatment', 'report']):
        return 'MedicalReport'
    elif any(keyword in text_lower for keyword in ['policy', 'insurance', 'coverage']):
        return 'PolicyDocument'
    else:
        return 'Other'
