import json
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('nmm-doc-extraction')

def lambda_handler(event, context):
    try:
        docid = event.get('docid')
        if not docid:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'docid is required'})
            }
        
        response = table.get_item(
            Key={'docid': docid},
            ProjectionExpression='extracted_entities'
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Document not found'})
            }
        
        extracted_entities = response['Item'].get('extracted_entities')
        
        if not extracted_entities:
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'There are no extracted entities for this document'})
            }
        
        return {
            'statusCode': 200,
            'body': json.dumps({'extracted_entities': extracted_entities})
        }
        
    except ClientError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
