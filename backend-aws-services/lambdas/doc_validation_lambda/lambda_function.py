import boto3
import json
from datetime import datetime
from botocore.exceptions import ClientError

# def dt_convert (sourcedate, sourceformat):
#     date_str = str(sourcedate) #'2013-04-15'
#     date_format = sourceformat # '%Y-%m-%d'

#     date_obj = datetime.strptime(date_str, date_format)
# #     print('old date format =',date_obj)

#     targetdate = date_obj.strftime("%m/%d/%Y")
# #     print ('new date format =',targetdate)
    
#     return targetdate

def lambda_handler(event, context):
    try:
        docid = event['docid']
        
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('nmm-doc-extraction')
        
        response = table.get_item(Key={'docid': docid})

        doc_classification = response['Item']['classification']
        print("doc_classification = ", doc_classification)

        if doc_classification != 'ClaimForm':
            return {
                'statusCode': 200,
                'body': json.dumps({'validation_result': 'Currently Document level validation is not implemented for this document type. Please check ClaimForm document to view the document validation in action.'})
            }

        extracted_entities_str = response['Item']['extracted_entities']
        extracted_entities = json.loads(extracted_entities_str)
        print("extracted_entities = ", extracted_entities)
        date_of_injury = datetime.strptime(extracted_entities['claim_details_section']['date_of_injury']['value'], '%m/%d/%Y')
        initial_return_date = datetime.strptime(extracted_entities['work_status_section']['initial_return_to_work_date']['value'], '%m/%d/%Y')
        injury_dt = extracted_entities['claim_details_section']['date_of_injury']['value']
        print("injury_dt = ", injury_dt)
        work_return_date = extracted_entities['work_status_section']['initial_return_to_work_date']['value']
        print("work_return_date = ", work_return_date)
        result = 'Pass - Date of Injury (' + str(injury_dt) + ') is before Intial Return To Work Date ('+ str(work_return_date) + ').' if date_of_injury < initial_return_date else 'Fail - Date of Injury (' + str(injury_dt) + ') cannot be after Intial Return To Work Date ('+ str(work_return_date) + ').'
        
        return {
            'statusCode': 200,
            'body': json.dumps({'validation_result': result})
        }
    except ClientError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }