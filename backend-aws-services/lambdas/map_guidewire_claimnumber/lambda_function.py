import json
import boto3

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

    # Extract document ID from event
    docid = event.get('docid')
    gw_claim_number = event.get('gw_claim_number')
    if not docid:
        print("Error: docid is not present")
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'docid is required'})
        }
    print("before updating dashboard ")
    # Update Dashboard table with entity extraction status
    resUpdate = upsert_dashboard_record('dashboard', docid=docid, gw_claim_id=gw_claim_number)
    print("after updating dashboard response : ", resUpdate)

    return {
        'statusCode': 200,
        'body': json.dumps('Successfully update dashboard with guidewire claim number!')
    }
