import json
import boto3
import time
from botocore.exceptions import ClientError

# Initialize AWS clients
textract = boto3.client('textract', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
s3 = boto3.client('s3', region_name='us-east-1')

# Configuration
BUCKET_NAME = "aimlusecases-pvt"
DASHBOARD_TABLE = "nmm-dashboard"
EXTRACTION_TABLE = "nmm-doc-extraction"

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
        
        print("Parsed message:", qtext)
        
        # Extract parameters
        s3_filename = qtext['s3filename']
        indexid = qtext['indexid']
        docid = qtext['docid']
        
        print(f"Processing: indexid={indexid}, docid={docid}, s3_filename={s3_filename}")
        
        # Update dashboard status to "Processing"
        update_dashboard_status(indexid, docid, 'extraction_status', 'Processing')
        
        # Extract text from document
        rawtext, tbltxt, keyvalues_text = extract_document_text(s3_filename)
        
        if not rawtext:
            raise Exception("Failed to extract text from document")
        
        # Classify document based on content
        classification = classify_document(rawtext)
        
        # Store extraction results in DynamoDB
        store_extraction_results(docid, s3_filename, rawtext, tbltxt, keyvalues_text, classification)
        
        # Update dashboard status to "Completed"
        update_dashboard_status(indexid, docid, 'extraction_status', 'Completed')
        
        print(f"✅ Document extraction completed for docid: {docid}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Document extraction completed successfully',
                'docid': docid,
                'classification': classification,
                'text_length': len(rawtext)
            })
        }
        
    except Exception as e:
        print(f"❌ Error in document extraction: {str(e)}")
        
        # Update dashboard status to "Failed"
        try:
            if 'indexid' in locals() and 'docid' in locals():
                update_dashboard_status(indexid, docid, 'extraction_status', 'Failed')
        except:
            pass
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'message': 'Document extraction failed'
            })
        }

def extract_document_text(s3_filename):
    """Extract text from S3 document using Textract"""
    try:
        print(f"Starting Textract analysis for: {s3_filename}")
        
        # Start document analysis
        response = textract.start_document_analysis(
            DocumentLocation={
                'S3Object': {
                    'Bucket': BUCKET_NAME,
                    'Name': s3_filename
                }
            },
            FeatureTypes=['TABLES', 'FORMS']
        )
        
        job_id = response['JobId']
        print(f"Textract job started: {job_id}")
        
        # Wait for job completion
        while True:
            response = textract.get_document_analysis(JobId=job_id)
            status = response['JobStatus']
            
            if status == 'SUCCEEDED':
                break
            elif status == 'FAILED':
                raise Exception(f"Textract job failed: {response.get('StatusMessage', 'Unknown error')}")
            
            print(f"Textract job status: {status}, waiting...")
            time.sleep(5)
        
        # Process results
        rawtext = ""
        tbltxt = []
        keyvalues_text = []
        
        # Get all pages
        blocks = response['Blocks']
        next_token = response.get('NextToken')
        
        while next_token:
            response = textract.get_document_analysis(JobId=job_id, NextToken=next_token)
            blocks.extend(response['Blocks'])
            next_token = response.get('NextToken')
        
        # Extract text blocks
        for block in blocks:
            if block['BlockType'] == 'LINE':
                rawtext += block['Text'] + "\n"
            elif block['BlockType'] == 'KEY_VALUE_SET':
                if 'KEY' in block.get('EntityTypes', []):
                    key_text = extract_text_from_block(block, blocks)
                    value_block = find_value_block(block, blocks)
                    if value_block:
                        value_text = extract_text_from_block(value_block, blocks)
                        keyvalues_text.append(f"{key_text}: {value_text}")
            elif block['BlockType'] == 'TABLE':
                table_text = extract_table_text(block, blocks)
                if table_text:
                    tbltxt.append(table_text)
        
        print(f"✅ Text extraction completed. Raw text length: {len(rawtext)}")
        return rawtext, json.dumps(tbltxt), json.dumps(keyvalues_text)
        
    except Exception as e:
        print(f"❌ Error in text extraction: {str(e)}")
        raise

def extract_text_from_block(block, all_blocks):
    """Extract text from a block using relationships"""
    text = ""
    if 'Relationships' in block:
        for relationship in block['Relationships']:
            if relationship['Type'] == 'CHILD':
                for child_id in relationship['Ids']:
                    child_block = next((b for b in all_blocks if b['Id'] == child_id), None)
                    if child_block and child_block['BlockType'] == 'WORD':
                        text += child_block['Text'] + " "
    return text.strip()

def find_value_block(key_block, all_blocks):
    """Find the corresponding value block for a key block"""
    if 'Relationships' in key_block:
        for relationship in key_block['Relationships']:
            if relationship['Type'] == 'VALUE':
                value_id = relationship['Ids'][0]
                return next((b for b in all_blocks if b['Id'] == value_id), None)
    return None

def extract_table_text(table_block, all_blocks):
    """Extract text from table block"""
    table_data = {}
    if 'Relationships' in table_block:
        for relationship in table_block['Relationships']:
            if relationship['Type'] == 'CHILD':
                for cell_id in relationship['Ids']:
                    cell_block = next((b for b in all_blocks if b['Id'] == cell_id), None)
                    if cell_block and cell_block['BlockType'] == 'CELL':
                        row = cell_block.get('RowIndex', 0)
                        col = cell_block.get('ColumnIndex', 0)
                        cell_text = extract_text_from_block(cell_block, all_blocks)
                        if row not in table_data:
                            table_data[row] = {}
                        table_data[row][col] = cell_text
    return table_data

def classify_document(text):
    """Classify document based on content"""
    text_lower = text.lower()
    
    if any(keyword in text_lower for keyword in ['claim', 'injury', 'workers compensation', 'wcb']):
        return 'ClaimForm'
    elif any(keyword in text_lower for keyword in ['medical', 'doctor', 'physician', 'treatment']):
        return 'MedicalReport'
    elif any(keyword in text_lower for keyword in ['policy', 'insurance', 'coverage']):
        return 'PolicyDocument'
    else:
        return 'Other'

def store_extraction_results(docid, s3_filename, rawtext, tbltxt, keyvalues_text, classification):
    """Store extraction results in DynamoDB"""
    try:
        table = dynamodb.Table(EXTRACTION_TABLE)
        
        # Get document name from S3 filename
        document_name = s3_filename.split('/')[-1]
        
        item = {
            'docid': docid,
            'document_name': document_name,
            's3_filename': s3_filename,
            'rawtext': rawtext,
            'tbltxt': tbltxt,
            'keyvaluesText': keyvalues_text,
            'classification': classification,
            'extraction_timestamp': int(time.time()),
            'status': 'completed'
        }
        
        table.put_item(Item=item)
        print(f"✅ Stored extraction results for docid: {docid}")
        
    except Exception as e:
        print(f"❌ Error storing extraction results: {str(e)}")
        raise

def update_dashboard_status(indexid, docid, status_field, status_value):
    """Update status in dashboard table"""
    try:
        table = dynamodb.Table(DASHBOARD_TABLE)
        
        # Create or update dashboard record
        table.update_item(
            Key={'indexid': indexid, 'docid': docid},
            UpdateExpression=f'SET {status_field} = :status, last_updated = :timestamp',
            ExpressionAttributeValues={
                ':status': status_value,
                ':timestamp': int(time.time())
            }
        )
        
        print(f"✅ Updated dashboard: {status_field} = {status_value}")
        
    except Exception as e:
        print(f"❌ Error updating dashboard: {str(e)}")
        # Don't raise - this is not critical
