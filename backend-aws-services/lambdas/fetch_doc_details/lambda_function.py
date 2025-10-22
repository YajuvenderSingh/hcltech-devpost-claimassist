import json
import boto3
import traceback

# Initialize DynamoDB resource
dynamodb_resource = boto3.resource("dynamodb")

def get_docs_dashboard(docid):
    """Retrieve document extract details from DynamoDB"""
    print('in get_docs_extract begin', docid)
    
    dynamodb_tbl_nm = "nmm-dashboard"
    dbtable = dynamodb_resource.Table(dynamodb_tbl_nm)
    
    return dbtable.get_item(Key={'docid': docid})

def get_docs_extract(docid):
    """Retrieve document extract details from DynamoDB"""
    print('in get_docs_extract begin', docid)
    
    dynamodb_tbl_nm = "nmm-doc-extraction"
    dbtable = dynamodb_resource.Table(dynamodb_tbl_nm)
    response = dbtable.get_item(  Key={'docid': docid},  ProjectionExpression='extracted_entities'            )

    return response['Item']['extracted_entities']
    
    # return dbtable.get_item(Key={'docid': docid})

def lambda_handler(event, context):
    try:
        print("Event = ", event)

        docid = event.get('docid')
        print("docid = ",docid)

        if not docid:
            print("Error: docid is not present")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'docid is required'})
            }
        
       
        # Get document extract details
        docs_dashboard = get_docs_dashboard(docid)
        docs_det = docs_dashboard['Item']
        print("docs_dashboard = ",docs_det)

        docs_extract = get_docs_extract(docid)
        # docs_det = docs_extract['Item']
        # # extracted_entities = docs_extract_details['extracted_entities']
        json_docs_det = json.loads(docs_extract)
        print("docs_extract_details  = ",json_docs_det)

        
        # body = json.dumps ({
        #         'docid': docid,
        #         'docs_dashboard': docs_det,
        #         'docs_extract': json_docs_det #docs_extract,
        #     })
        # print("body = ",body)  

        return {
            'statusCode': 200,
            'body': json.dumps({
                'docid': docid,
                'docs_dashboard': docs_det,
                'docs_extract': json_docs_det #docs_extract,
            })
        }
        
    except Exception as e:
        print(f"Exception in execute_model() and the error is - {e}")  
        print('Exception Details in lambda handler () are - ',traceback.format_exc())
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
