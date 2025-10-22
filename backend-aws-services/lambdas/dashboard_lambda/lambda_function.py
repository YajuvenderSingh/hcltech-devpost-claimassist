import json
import boto3
from botocore.exceptions import ClientError



def get_all_doc_details(indexid):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('nmm-dashboard')
    print("in get_all_doc_details() - indexid = ", indexid )
    response = table.scan(
        FilterExpression=boto3.dynamodb.conditions.Attr('indexid').eq(indexid)
    )
    print("response items = ", response['Items'])
    
    return response['Items']

def get_individual_doc_details(docid):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('nmm-dashboard')
    print("in get_individual_doc_details() - docid = ", docid )
    response = table.get_item(Key={'docid': docid})
    print("individual doc details = ", response['Item'])
    
    return response['Item']

def lambda_handler(event, context):
    try:
        docid = event.get('docid')
        
        if not docid:
            indexid = event.get('indexid')
            if not indexid:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Either docid or indexid is required'})
                }
            else:
                response = get_all_doc_details(indexid)
                return {
                    'statusCode': 200,
                    'body': json.dumps(response)
                }
        else:
            response = get_individual_doc_details(docid)
            return {
                'statusCode': 200,
                'body': json.dumps(response)
            }
        # if not docid:
        #     return {
        #         'statusCode': 400,
        #         'body': json.dumps({'error': 'docid is required'})
        #     }
        
        # response = table.get_item(Key={'docid': docid})
        
        # if 'Item' not in response:
        #     return {
        #         'statusCode': 404,
        #         'body': json.dumps({'error': 'Item not found'})
        #     }
        
        # return {
        #     'statusCode': 200,
        #     'body': json.dumps(response['Item'])
        # }
        
    except ClientError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
