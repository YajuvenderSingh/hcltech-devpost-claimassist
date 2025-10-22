import json
import logging
import boto3
from utils import run_confidence_scorer,run_confidence_scorer_with_doc_score,get_entity_weights, update_doc_status_new

logging.basicConfig(level=logging.INFO)

def lambda_handler(event, context):
    try:
        print("Event = ", event)

        if 'Records' in event:
            data_string = event['Records'][0]['body']   # this change is done only to accept the 'body' from SQS
        else:
            data_string = event
        print("event[body]",data_string,type(data_string))
        
        if type(data_string) is dict:
            qtext = data_string
        else:
            qtext = json.loads(data_string)
        #print("\n","Lambda Handler context:",type(context),context)
        
        print("qtext=json.loads(data_string) :",type(qtext),qtext)
        #s3files = [qtext['s3filename']]  # send the file name in an array
        #indexid = qtext['indexid']
        #print("indexid = ",indexid)
        docid = qtext['docid']
        print("docid = ",docid)


        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('doc-extraction')
        dbtbl= dynamodb.Table('dashboard')
        
        # # Extract docid from event
        # docid = event.get('docid', '')
        # print("docid =", docid)
        # model_name = event.get('model_name', 'sonnet')
        # model_id = event.get('model_id', 'anthropic.claude-3-5-sonnet-20240620-v1:0')
        region = event.get('region', 'us-east-1')
        batch_size = event.get('batch_size', 20)
        
        if not docid:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No docid provided'})
            }
        
        # Read from DynamoDB
        response = table.get_item(Key={'docid': docid})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Document not found'})
            }
        
        item = response['Item']
        text = item.get('rawtext', '')
        extracted_entities = item.get('extracted_entities', '{}')
        
        if not text:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No rawtext found for docid'})
            }
        
        if not extracted_entities:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No extracted_entities found for docid'})
            }
        
        # Parse extracted_entities if it's a string
        if isinstance(extracted_entities, str):
            extracted_entities = json.loads(extracted_entities)
        
        print("extracted_entities =", extracted_entities)
        field_weights=get_entity_weights("ClaimForm")
        print("field wghts",field_weights)
        # Run confidence scoring
        updated_entities,doc_score = run_confidence_scorer_with_doc_score(
            text=text,
            extracted_entities=extracted_entities,
            model_name= "sonnet", # "model_name",
            model_id= "anthropic.claude-3-5-sonnet-20240620-v1:0", # model_id,
            field_weights=field_weights,
            region=region,
            batch_size=batch_size
        )
        print("updated entities",updated_entities)
        # Convert back to string for DynamoDB storage
        updated_entities_str = json.dumps(updated_entities)
        print("updated_entities_str =", updated_entities_str)
        # Update DynamoDB with scored entities
        table.update_item(
            Key={'docid': docid},
            UpdateExpression='SET extracted_entities = :val, document_conf_score=:val1',
            ExpressionAttributeValues={':val': updated_entities_str,':val1': doc_score}
        )
        dbtbl.update_item(
            Key={'docid': docid},
            UpdateExpression='SET document_conf_score = :val, confidence_score_status=:val1',
            ExpressionAttributeValues={':val': doc_score,':val1':'Completed'}
        )

        ######################################
        print("before updating email_reader_v1 -> docid = ", docid)
        res = update_doc_status_new(docid, "Completed")
        print("successfully updated email_reader status = ", res)

        #######################################
        print("Updated database table with updated confidence score for each field.")
        return {
            'statusCode': 200,
            'body': json.dumps({
                'docid': docid,
                'message': 'Confidence scoring completed and updated in DynamoDB',
                'updated_entities': updated_entities
            })
        }
        
    except Exception as e:
        logging.error(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
