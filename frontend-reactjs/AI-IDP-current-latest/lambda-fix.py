import json
import boto3

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
            s3_key = body.get('s3Key')
            
            # If s3_key is just docId, construct full path
            if not s3_key.startswith('newmexicomutual/'):
                # This is just a docId, need to find the actual file
                # For now, return error - frontend should pass full s3Key
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Full s3Key path required'})
                }
            
            # Generate presigned URL for GET (viewing)
            presigned_url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': BUCKET_NAME, 'Key': s3_key},
                ExpiresIn=3600
            )
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'viewUrl': presigned_url,
                    's3Key': s3_key
                })
            }
            
        # Handle other task types (upload, etc.)
        # ... existing code ...
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
