import json
import boto3
import os
from utilities import (
    fetchsinglerec, 
    allitemscan, 
    allclaimsfetch, 
    sendtoPSproQ, 
    sendtodocproQ, 
    singleclaimfetch, 
    verifyclaim, 
    GenerateEmail, 
    fetchtmpltemail
)

headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
}

def lambda_handler(event, context):
    try:
        print(f"📥 Received event: {event}")
        # Parse the input parameters from the API Gateway event
        if 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event

        print(f"📥 Received body: {body}")
        tasktype = body.get('tasktype')
        print(f"🔧 Task type: {tasktype}")

        # Handle different task types
        if tasktype == 'SEND_TO_QUEUE':
            print('📤 Processing SEND_TO_QUEUE request')
            indexid = body.get('indexid')
            s3filename = body.get('s3filename')
            docid = body.get('docid')
            source = body.get('source')
            print(f"Doc source: {source}")
            if source == None or source == "":
                source = "ManualUpload"
            print(f"Final source going to SQS queue: {source}")
            print(f"🆔 Claim ID: {indexid}")
            print(f"📁 S3 Filename: {s3filename}")
            print(f"📁 S3 docid inside docid : {docid}")
            
            if not indexid or not s3filename:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({
                        'error': 'Missing required parameters: indexid and s3filename'
                    })
                }
            
            response = sendtodocproQ(indexid, s3filename, docid, source)
            print(f"📤 Queue response: {response}")
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'message': 'Message sent to SQS successfully',
                    'messageId': response['MessageId']
                })
            }

        elif tasktype == 'SEND_TO_PS_QUEUE':
            print('📤 Processing SEND_TO_PS_QUEUE request')
            claimid = body.get('claimid')
            s3filename = body.get('s3filename')
            actionn = body.get('actionn')
            
            if not claimid or not s3filename:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({
                        'error': 'Missing required parameters: claimid and s3filename'
                    })
                }
            
            response = sendtoPSproQ(claimid, s3filename, actionn)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'message': 'Message sent to PS SQS successfully',
                    'messageId': response['MessageId']
                })
            }

        elif tasktype == 'FETCH_ALL_CLAIMS':
            print('📋 Processing FETCH_ALL_CLAIMS request')
            allclaimdata = allitemscan()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'allclaimdata': allclaimdata
                })
            }

        elif tasktype == 'FETCH_SINGLE_CLAIM':
            print('🔍 Processing FETCH_SINGLE_CLAIM request')
            claimid = body.get('claimid')
            print(f"🆔 Searching for Claim ID: {claimid}")
            
            singleclaimdata = fetchsinglerec(claimid)
            print(f"📄 Single claim data result: {type(singleclaimdata)}")
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'singleclaimdata': singleclaimdata
                })
            }

        elif tasktype == 'FETCH_ALL_ACT_CLAIMS':
            print('📋 Processing FETCH_ALL_ACT_CLAIMS request')
            allclaimactdata = allclaimsfetch()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'allclaimactdata': allclaimactdata
                })
            }

        elif tasktype == 'FETCH_SINGLE_ACT_CLAIM':
            print('🔍 Processing FETCH_SINGLE_ACT_CLAIM request')
            claimid = body.get('claimid')
            print(f"🆔 Searching for Active Claim ID: {claimid}")
            
            claimactdata = singleclaimfetch(claimid)
            print(f"📄 Active claim data result: {type(claimactdata)}")
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'allclaimactdata': claimactdata
                })
            }

        elif tasktype == 'VERIFY_CLAIM':
            print('✅ Processing VERIFY_CLAIM request')
            claimid = body.get('claimid')
            psid = body.get('psid')
            
            print(f"🆔 Claim ID: {claimid}")
            print(f"📋 PS ID: {psid}")
            
            verifresult = verifyclaim(claimid, psid)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'verifyclaimactdata': verifresult
                })
            }

        elif tasktype == 'GENERATE_EMAIL':
            print('📧 Processing GENERATE_EMAIL request')
            claimid = body.get('claimid')
            psid = body.get('psid')
            
            print(f"🆔 Claim ID: {claimid}")
            print(f"📋 PS ID: {psid}")
            
            generatedemail = GenerateEmail(claimid, psid)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'generatedemaildata': generatedemail
                })
            }

        elif tasktype == 'FETCH_EMAIL':
            print('📧 Processing FETCH_EMAIL request')
            claimid = body.get('claimid')
            emailbody = fetchtmpltemail(claimid)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'emailbody': emailbody
                })
            }

        else:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': f'Unknown task type: {tasktype}'
                })
            }

    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'error': 'Invalid JSON format',
                'details': str(e)
            })
        }
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }