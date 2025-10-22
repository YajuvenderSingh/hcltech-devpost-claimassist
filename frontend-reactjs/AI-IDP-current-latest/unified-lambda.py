import json
import boto3
import random
import re

s3 = boto3.client('s3')
BUCKET_NAME = "aimlusecases-pvt"

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
        task_type = body.get('tasktype')
        
        if task_type == 'GET_PRESIGNED_URL_FOR_VIEW':
            # Preview: use existing s3Key
            s3_key = body.get('s3Key')
            presigned_url = s3.generate_presigned_url(
                ClientMethod='get_object',
                Params={'Bucket': BUCKET_NAME, 'Key': s3_key},
                ExpiresIn=3600
            )
        else:
            # Upload: create new s3Key
            file_name = body.get('fileName')
            claim_id = body.get('claimId')
            file_type = body.get('fileType', 'application/octet-stream')
            
            if not file_name:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'fileName required'})}
            
            if not claim_id or not claim_id.strip():
                claim_id = "IN" + str(random.randint(100000, 999999))
            
            doc_id = "DOC" + str(random.randint(100000, 999999))
            s3_key = f'newmexicomutual/claimforms/{claim_id}/{doc_id}/{file_name}'
            
            presigned_url = s3.generate_presigned_url(
                'put_object',
                Params={'Bucket': BUCKET_NAME, 'Key': s3_key, 'ContentType': file_type},
                ExpiresIn=3600
            )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'uploadUrl': presigned_url,
                's3Key': s3_key,
                'claimId': claim_id if 'claim_id' in locals() else None,
                'docId': doc_id if 'doc_id' in locals() else None,
                'documentId': claim_id if 'claim_id' in locals() else None
            })
        }
        
    except Exception as e:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}
