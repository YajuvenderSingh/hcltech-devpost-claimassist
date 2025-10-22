import json
import boto3
import random
import re

s3 = boto3.client('s3')
BUCKET_NAME = "aimlusecasesv1"  # Updated to use the bucket the extraction lambda expects

def lambda_handler(event, context):
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    try:
        body = json.loads(event.get('body', '{}')) if 'body' in event else event
        
        file_name = body.get('fileName')
        file_type = body.get('fileType', 'application/octet-stream')
        claim_id = body.get('claimId')
        
        if not file_name:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'fileName required'})
            }
        
        # Validate claim ID format if provided and not empty
        if claim_id and claim_id.strip():
            if not re.match(r'^IN\d{6}$', claim_id):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Invalid claim ID format. Must be IN followed by 6 digits'})
                }
        
        # Use provided claim_id or generate new one
        if not claim_id or not claim_id.strip():
            claim_id = "IN" + str(random.randint(100000, 999999))
        
        # Always generate new DOC ID for each document
        doc_id = "DOC" + str(random.randint(100000, 999999))
        
        s3_key = f'newmexicomutual/claimforms/{claim_id}/{doc_id}/{file_name}'
        
        presigned_url = s3.generate_presigned_url(
            'put_object',
            Params={'Bucket': BUCKET_NAME, 'Key': s3_key, 'ContentType': file_type},
            ExpiresIn=3600
        )
        
        print(f"Generated presigned URL for claim: {claim_id}, doc: {doc_id}, file: {file_name}")
        print(f"Using bucket: {BUCKET_NAME}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'uploadUrl': presigned_url,
                's3Key': s3_key,
                'claimId': claim_id,
                'docId': doc_id,
                'documentId': claim_id
            })
        }
        
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
