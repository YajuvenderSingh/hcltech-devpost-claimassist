import json
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr

# dynamodb = boto3.resource('dynamodb')
# table = dynamodb.Table('nmm-doc-extraction')
# def get_review_items():
#     dynamodb = boto3.resource('dynamodb')
#     table = dynamodb.Table('nmm-doc-extraction')

#     response = table.scan(
#         FilterExpression='mark_for_review = :review' ,
#         ExpressionAttributeValues={
#             ':review': 'Yes'
#             #':class': 'ClaimForm'
#         },
#         ProjectionExpression='docid, classification, extracted_entities'
#     )
#     results = []
#     for item in response['Items']:
#         #rint(item)
#         print(item['classification'])#,item['extracted_entities'],item['docid'])
#         if item['classification']=='MedicalReport':
#             try:
#                 extracted = json.loads(item['extracted_entities'])
#                 #print(extracted)
#             except:
#                 extracted = {}
#             #extracted = item.get('extracted_entities', {})

#             result = {
#                 'doc_id': item.get('docid'),
#                 'classification': item.get('classification'),
#                 'employee_first_name': extracted['medical_report_section']['employee_name']['value'].split()[0],
#                 'employee_last_name': extracted['medical_report_section']['employee_name']['value'].split()[1]
#             }
#             results.append(result)

#         elif item['classification']=='ClaimForm':
#             try:
#                 extracted = json.loads(item['extracted_entities'])
#                 #print(extracted)
#             except:
#                 extracted = {}
#             #extracted = item.get('extracted_entities', {})

#             result = {
#                 'doc_id': item.get('docid'),
#                 'classification': item.get('classification'),
#                 'employee_first_name': extracted['employee_information_section']['employee_first_name']['value'],
#                 'employee_last_name': extracted['employee_information_section']['employee_last_name']['value']
#             }
#             results.append(result)

    
#         elif item['classification']=='PhysicalTherapy':
#             try:
#                 extracted = json.loads(item['extracted_entities'])
#                 #print(extracted)
#             except:
#                 extracted = {}
#             #extracted = item.get('extracted_entities', {})

#             result = {
#                 'doc_id': item.get('docid'),
#                 'classification': item.get('classification'),
#                 'employee_first_name': "",
#                 'employee_last_name': ""
#             }
#             results.append(result)
#         elif item['classification']=='Prescription':
#             try:
#                 extracted = json.loads(item['extracted_entities'])
#                 #print(extracted)
#             except:
#                 extracted = {}
#             result = {
#                 'doc_id': item.get('docid'),
#                 'classification': item.get('classification'),
#                 'employee_first_name': (extracted['prescription_section']['name']['value']).split()[0],
#                 'employee_last_name': (extracted['prescription_section']['name']['value']).split()[1]
#             }
#             results.append(result)
#         elif item['classification']=='CMS1500':
#             try:
#                 extracted = json.loads(item['extracted_entities'])
#                # print(extracted)
#             except:
#                 extracted = {}
#             result = {
#                 'doc_id': item.get('docid'),
#                 'classification': item.get('classification'),
#                 'employee_first_name': (extracted['CMS1500_section']['patients_name']['value']).split()[0],
#                 'employee_last_name': (extracted['CMS1500_section']['patients_name']['value']).split()[1]
#             }
#             results.append(result)
#         elif item['classification']=='DoctorReportMMI':
#             try:
#                 extracted = json.loads(item['extracted_entities'])
#                 #print(extracted)
#             except:
#                 extracted = {}
#             result = {
#                 'doc_id': item.get('docid'),
#                 'classification': item.get('classification'),
#                 'employee_first_name': (extracted['patients_information_section']['patients_name']['value']).split()[0],
#                 'employee_last_name': (extracted['patients_information_section']['patients_name']['value']).split()[1]
#             }
#             results.append(result)
#     return results

def get_review_items():
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('nmm-doc-extraction')
 
    response = table.scan(
        FilterExpression='mark_for_review = :review' ,
        ExpressionAttributeValues={
            ':review': 'Yes'
            #':class': 'ClaimForm'
        },
        ProjectionExpression='docid, classification, extracted_entities,indexid'
    )
    results = []
    for item in response['Items']:
        #rint(item)
        print(item['classification'])#,item['extracted_entities'],item['docid'])
        if item['classification']=='MedicalReport':
            try:
                extracted = json.loads(item['extracted_entities'])
                print(extracted,item.get('indexid'),)
            except:
                extracted = {}
            #extracted = item.get('extracted_entities', {})
 
            result = {
                'doc_id': item.get('docid'),
                'indexid':item.get('indexid'),
                'classification': item.get('classification'),
                'employee_first_name': extracted['medical_report_section']['employee_name']['value'].split()[0],
                'employee_last_name': extracted['medical_report_section']['employee_name']['value'].split()[1]
            }
            results.append(result)
 
        elif item['classification']=='ClaimForm':
            try:
                extracted = json.loads(item['extracted_entities'])
                #print(extracted)
            except:
                extracted = {}
            #extracted = item.get('extracted_entities', {})
 
            result = {
                'doc_id': item.get('docid'),
                'indexid':item.get('indexid'),
                'classification': item.get('classification'),
                'employee_first_name': extracted['employee_information_section']['employee_first_name']['value'],
                'employee_last_name': extracted['employee_information_section']['employee_last_name']['value']
            }
            results.append(result)
 
    
        elif item['classification']=='PhysicalTherapy':
            try:
                extracted = json.loads(item['extracted_entities'])
                #print(extracted)
            except:
                extracted = {}
            #extracted = item.get('extracted_entities', {})
 
            result = {
                'doc_id': item.get('docid'),
                'indexid':item.get('indexid'),
                'classification': item.get('classification'),
                'employee_first_name': "",
                'employee_last_name': ""
            }
            results.append(result)
        elif item['classification']=='Prescription':
            try:
                extracted = json.loads(item['extracted_entities'])
                #print(extracted)
            except:
                extracted = {}
            result = {
                'doc_id': item.get('docid'),
                'indexid':item.get('indexid'),
                'classification': item.get('classification'),
                'employee_first_name': (extracted['prescription_section']['name']['value']).split()[0],
                'employee_last_name': (extracted['prescription_section']['name']['value']).split()[1]
            }
            results.append(result)
        elif item['classification']=='CMS1500':
            try:
                extracted = json.loads(item['extracted_entities'])
               # print(extracted)
            except:
                extracted = {}
            result = {
                'doc_id': item.get('docid'),
                'indexid':item.get('indexid'),
                'classification': item.get('classification'),
                'employee_first_name': (extracted['CMS1500_section']['patients_name']['value']).split()[0],
                'employee_last_name': (extracted['CMS1500_section']['patients_name']['value']).split()[1]
            }
            results.append(result)
        elif item['classification']=='Legal':
            try:
                extracted = json.loads(item['extracted_entities'])
               # print(extracted)
            except:
                extracted = {}
            result = {
                'doc_id': item.get('docid'),
                'indexid':item.get('indexid'),
                'classification': item.get('classification'),
                'employee_first_name': (extracted['legal_section']['name']['value']).split()[0],
                'employee_last_name': (extracted['legal_section']['name']['value']).split()[1]
            }
            results.append(result)
        elif item['classification']=='DoctorReportMMI':
            try:
                extracted = json.loads(item['extracted_entities'])
                #print(extracted)
            except:
                extracted = {}
            result = {
                'doc_id': item.get('docid'),
                'indexid':item.get('indexid'),
                'classification': item.get('classification'),
                'employee_first_name': (extracted['patients_information_section']['patients_name']['value']).split()[0],
                'employee_last_name': (extracted['patients_information_section']['patients_name']['value']).split()[1]
            }
            results.append(result)
    return results

def lambda_handler(event, context):
    try:
        print("event = ", event)

        items = get_review_items()
        print("response = ", items)
        # for item in items:
        #     print(item)
        # response = table.scan(
        # FilterExpression=Attr('mark_for_review').eq('Yes'),
        # ProjectionExpression='docid, classification, document_name, extracted_entities, mark_for_review' )
        # res = json.dumps(response)
        # print("response = ", res)
         
        
        return {
            'statusCode': 200,
            'body': json.dumps(items)
        }
        
    except ClientError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }



# import boto3
# import json
# from boto3.dynamodb.conditions import Attr

# def fetch_marked_for_review():
#     dynamodb = boto3.resource('dynamodb')
#     table = dynamodb.Table('nmm-doc-extraction')

#     response = table.scan(
#         FilterExpression=Attr('mark_for_review').eq('Yes'),
#         ProjectionExpression='docid, classification, document_name, extracted_entities, mark_for_review'
#     )
#     print("response = ", response['Items'])
#     # items = []
#     # for item in response['Items']:
#     #     # Extract employee_name from extracted_entities JSON
#     #     extracted_entities = item.get('extracted_entities', '{}')
#     #     if isinstance(extracted_entities, str):
#     #         entities = json.loads(extracted_entities)
#     #     else:
#     #         entities = extracted_entities

#     #     item['employee_name'] = entities.get('employee_name', '')
#     #     items.append(item)

#     return response['Items']



# def lambda_handler(event, context):
#     try:

#         print("event = ", event)
#         # Get document extract details
#         fetch_all  = fetch_marked_for_review()
#         print("after fetch_all  ", fetch_all)

#         return {
#                 'statusCode': 200,
#                 'body': json.dumps({"fetch_all"})
#             }
#     except Exception as e:
#         return {
#             'statusCode': 500,
#             'body': json.dumps({'error': str(e)})
#         }
