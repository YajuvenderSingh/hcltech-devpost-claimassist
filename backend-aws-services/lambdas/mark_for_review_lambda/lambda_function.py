import boto3
import json
from decimal import Decimal
from botocore.exceptions import ClientError

# Initialize DynamoDB resource
dynamodb_resource = boto3.resource("dynamodb")

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

def lambda_handler(event, context):
    """
    Lambda function to update extracted_entities in DynamoDB while preserving original structure
    """
    try:
        # Extract parameters from event
        docid = event.get('docid')
        print("docid =", docid)

        # Update Document Extraction table with classification type
        resExtraction = upsert_dashboard_record('nmm-doc-extraction', docid=docid, mark_for_review="Yes")
        print ("resExtraction = ", resExtraction)       
         
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully marked the document for review',
            }, default=str)
        }
        
    except ClientError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'DynamoDB error: {str(e)}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Unexpected error: {str(e)}'})
        }
