import boto3, json
import time
import os
import sys
from logging import exception
from botocore.exceptions import ClientError

import trp
from trp import Document
from typing import Dict
from typing import Optional
# Import date class from datetime module
# from datetime import date
# from datetime import datetime
import datetime
import decimal
import traceback
import botocore
from botocore.config import Config
import re
import time


module_path = ".."
sys.path.append(os.path.abspath(module_path))
# from utils import bedrock, print_ww


# ---- ⚠️ Un-comment and edit the below lines as needed for your AWS setup ⚠️ ----
# We are setting the default region as us-east-1 because the Lambda is in east-1 however the bedrock instance is running in us-west-2
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"  # E.g. "us-west-2"
# os.environ["AWS_PROFILE"] = "<YOUR_PROFILE>"
os.environ["BEDROCK_ASSUME_ROLE"] = "arn:aws:iam::040504913362:role/bedrock"  # E.g. "arn:aws:..." role name is 'bedrock'
 

s3bkt = "aimlusecases-pvt"

textract = boto3.client('textract', region_name='us-east-1')
# Define DynamoDB Database and the Dynamo Table
dynamodb_resource = boto3.resource("dynamodb")


def get_bedrock_client(assumed_role: Optional[str] = None, region: Optional[str] = None, runtime: Optional[bool] = True):
    
#     """Create a boto3 client for Amazon Bedrock, with optional configuration overrides

# #     Parameters
# #     ----------
# #     assumed_role :
# #         Optional ARN of an AWS IAM role to assume for calling the Bedrock service. If not
# #         specified, the current active credentials will be used.
# #     region :
# #         Optional name of the AWS Region in which the service should be called (e.g. "us-east-1").
# #         If not specified, AWS_REGION or AWS_DEFAULT_REGION environment variable will be used.
# #     runtime :
# #         Optional choice of getting different client to perform operations with the Amazon Bedrock service.
# #     """
    if region is None:
        target_region = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION"))
    else:
        target_region = region
    
    print(f"Create new client Using region: {target_region}")
    session_kwargs = {"region_name": target_region}
    client_kwargs = {**session_kwargs}

    profile_name = os.environ.get("AWS_PROFILE")
    print('profile_name=', profile_name)
    if profile_name:
        print(f"  Using profile: {profile_name}")
        session_kwargs["profile_name"] = profile_name

    retry_config = Config(
        region_name=target_region,
        retries={
            "max_attempts": 10,
            "mode": "standard",
        },
    )
    session = boto3.Session(**session_kwargs)

    if assumed_role:
        print(f"  Using role: {assumed_role}", end='')
        sts = session.client("sts")
        response = sts.assume_role(
            RoleArn=str(assumed_role),
            RoleSessionName="langchain-llm-1"
        )
        print(" ... successful!")
        client_kwargs["aws_access_key_id"] = response["Credentials"]["AccessKeyId"]
        client_kwargs["aws_secret_access_key"] = response["Credentials"]["SecretAccessKey"]
        client_kwargs["aws_session_token"] = response["Credentials"]["SessionToken"]
#         print('client_kwargs = ',client_kwargs)

    if runtime:
        service_name='bedrock-runtime'
    else:
        service_name='bedrock'

    bedrock_client = session.client(
        service_name=service_name,
        config=retry_config,
        **client_kwargs
    )

    print("boto3 Bedrock client successfully created!")
    print(bedrock_client._endpoint)
    return bedrock_client

# COPIED FROM PREVIOUS POCs
# ---------------------------
def get_doc_text(s3files):
    tbltxt=[]
    rawtext=[]
    keyvaluesText=[]
    print('in get_doc_text()')
    jobids = resp_id(s3files)
    
    print('in get_doc_text()-> jobids', jobids)
    print('Please wait till we analyze the documents for the job ids...')
    for jobid in jobids:
        filname=list(jobid.keys())[0].split('.')[0]
        print('filname=',filname)
        jobidss=list(jobid.values())[0]
        print('jobidss=',jobidss)
        
        resanal="NotComplete"
        while(resanal=="NotComplete"):
            resanal=getJobResults(jobidss)
            
        if resanal=="FAILED":
            tabletxt="FAILED"
        else:
            tabletxt=parseresp(resanal)    
        
        response=json.dumps({"text":tabletxt})
        print('\nCOMPLETE jobidss=',jobidss)
        
        resp=json.loads(response)
        tbltxt.append({filname:resp['text'][0]})
        rawtext.append({filname:resp['text'][1]})
        keyvaluesText.append({filname:resp['text'][2]})
        
    return tbltxt,rawtext,keyvaluesText

# COPIED FROM PREVIOUS POCs
# ---------------------------
def resp_id(s3files):
#     client = boto3.client('textract')
#     s3bkt = "aimlusecasesv1"

    # Step1: Textract(Getting JobID) 
    jobids = []
    for s3PDF in s3files:
        print('s3PDF =',s3PDF)
#         s3filename = 'iassureclaim/policydocuments/' + s3PDF
        s3filename = s3PDF
        response = textract.start_document_analysis(
                DocumentLocation={
                    'S3Object': {
                        'Bucket': s3bkt,
                        'Name': s3filename
                    }
                },
                FeatureTypes=["TABLES","FORMS"],
                OutputConfig={
                    'S3Bucket': s3bkt,
                    'S3Prefix': s3PDF + '_extractedoutput.txt' #'iassureclaim/policydocuments/tblr-pdf/output'
                },
            )

        jobid=response['JobId']
        print('jobid=',jobid)
        resp = json.dumps({"text":jobid})
        print('resp=',resp)
        jobids.append({s3PDF:jobid})
    txtract_jobid=jobids
    return txtract_jobid

# COPIED FROM PREVIOUS POCs
# ---------------------------
def getJobResults(jobId):

    pages = []
    pgcnt=1
    
    response = textract.get_document_analysis(JobId=jobId,MaxResults=3) 
    pages.append(response) 
#     print('JobStatus=',response['JobStatus']) 
    
    if response['JobStatus']=="SUCCEEDED":
        print('JobStatus=',response['JobStatus']) 
        nextToken = None
        if('NextToken' in response):
            nextToken = response['NextToken'] 
        while(nextToken):
            pgcnt+=1
            print(pgcnt) 
            response = textract.get_document_analysis(JobId=jobId, NextToken=nextToken)
            pages.append(response)
            nextToken = None
            if('NextToken' in response):
                nextToken = response['NextToken'] 
        print("coming out from token formatting func")
        return pages
    elif response['JobStatus']=="FAILED":
        return("FAILED")
    else:
        return("NotComplete")
    
# COPIED FROM PREVIOUS POCs
# ---------------------------
def parseresp(resanal):
#     print('\nresanal=',resanal)
    doc = Document(resanal)
    prevpg=''
    tblcont=[]
    rawtext=""
    keyvaluesText=[]
    tblindex=0
    for resultPage in doc.pages: #pages of read PDF
        for Line in resultPage.lines:
            rawtext+=Line.text+"\n"
            
        for field in resultPage.form.fields:
    #         print("Key: {}, Value: {}".format(field.key, field.value))
            keyvaluesText.append("Key: {}, Value: {}".format(field.key, field.value))
        
        for table in resultPage.tables: #for each table 
            print("table #",tblindex)
            clnmtxt='Tabluar Data Processing '
            col=[]
            
            # try to get its shape - how many columns and rows
            for r, row in enumerate(table.rows):
                for c, cell in enumerate(row.cells):
                    if r==0:
                        if cell.text=="":
                            colval="description:-"
                        else:
                            colval=cell.text
                        col.append({str(c):colval})
#             print('columns',col)           
            # for each row define your format to get the data points
            for r, row in enumerate(table.rows):

                for c, cell in enumerate(row.cells):
                    if r!=0: # this is not the header row
                        clnmtxt+=col[c][str(c)]+" "+cell.text+","
                clnmtxt+=';'

            tblcont.append({tblindex:clnmtxt})
            tblindex+=1
            
#     print('\n--------------------------------------------------')
#     print('tblcont = ',tblcont)

#     print('\n--------------------------------------------------')
#     print('rawtext = ',rawtext)

#     print('\n--------------------------------------------------')
#     print('keyvaluesText = ',keyvaluesText)
            
    return tblcont, rawtext, keyvaluesText
# -------------------------------------------------------------------------


##########################

def save_docs_extract(docid, indexid, s3filename, rawtext, keyvaluesText, tbltxt, source):
    print('inside save_claimform_attributes()')
    try:
        # Get the current datetime
        current_datetime = datetime.datetime.now(datetime.timezone.utc)
        # Convert the datetime to ISO 8601 format        
        sort_key = current_datetime.isoformat()
        print("sort_key (which is datetime) = ", sort_key)

        dynamodb_tbl_nm = "nmm-doc-extraction"
        dbtable = dynamodb_resource.Table(dynamodb_tbl_nm)
        print('dbtable = ',dbtable)
        response = dbtable.put_item(
                                   Item={
                                       "docid": docid, 
                                       "indexid": indexid, 
                                       "document_name" : s3filename,
                                       "current_datetime" : str(sort_key), 
                                       "rawtext" : rawtext,   # This holds the rawtext which is used for chatbot
                                       "keyvaluesText" : keyvaluesText,   # This holds the keyvaluesText which is used for chatbot
                                       "tbltxt" : tbltxt,   # This holds the tbltxt which is used for chatbot
                                       "doc_source" : source,   # document source (email or manual upload)
                                         }
                                    )

        print("successfully inserted the record in DynamoDB Table")
        return 'Saved successfully to DynamoDB'
    
    except Exception as error:
        print(f"Exception in save_docs_extract() and the error is - {error}")  
        print('Exception Details in save_docs_extract() are - ',traceback.format_exc())
        return 'Unable to save the json in DynamoDB'




def upsert_dashboard_record(docid, **kwargs):
    """
    Update existing record or insert new record in nmm-dashboard table

    Args:
        docid (str): Document ID (primary key)
        **kwargs: Additional fields to update/insert

    Returns:
        dict: Response from DynamoDB operation
    """
#     dynamodb = boto3.resource('dynamodb')
    table = dynamodb_resource.Table('nmm-dashboard')

    # Build update expression and attribute values
    update_expression = "SET "
    expression_attribute_values = {}

    for key, value in kwargs.items():
        update_expression += f"{key} = :{key}, "
        expression_attribute_values[f":{key}"] = value

    # Remove trailing comma and space
    update_expression = update_expression.rstrip(", ")
    print ("update_expression = ", update_expression)
    try:
        response = table.update_item(
            Key={'docid': docid},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues='ALL_NEW'
        )
        print ("response = ", response)
        return response
    except ClientError as e:
        print(f"Error updating record: {e}")
        raise

        
def sendtodocproQ(indexid, s3filename, docid, source):
    """Send message to Document processing queue"""
    sqs = boto3.client('sqs')
    
    queue_url = "https://sqs.us-east-1.amazonaws.com/040504913362/NMM_DocProcessingAfterExtractionQueueNew"
    try:
        message_body = {
            "indexid": indexid,
            "s3filename": s3filename,
            "docid": docid,
            "timestamp": str(boto3.Session().region_name),
            "message_type": "document_processing",
            "source" : source
        }
        
        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message_body),
            MessageAttributes={
                'IndexId': {
                    'StringValue': indexid,
                    'DataType': 'String'
                },
                'S3Filename': {
                    'StringValue': s3filename,
                    'DataType': 'String'
                },
                'DocId': {
                    'StringValue': docid,
                    'DataType': 'String'
                },
                'source': {
                    'StringValue': source,
                    'DataType': 'String'
                }

            }
        )
        
        print(f"✅ Message sent to document processing queue successfully!")
        print(f"✅ MessageId: {response['MessageId']}")
        print(f"📨 Message body: {json.dumps(message_body)}")
        
        return {"status": "success", "MessageId": response['MessageId']}
        
    except Exception as e:
        print(f"❌ Error sending to document processing queue: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        mock_id = str(uuid.uuid4())
        return {"status": "error", "MessageId": mock_id, "error": str(e)}
        
#    *****************************************************************************************
    
def lambda_handler(event, context):
    saveres=""
    headers = {
            'Access-Control-Allow-Origin': '*',  # Replace with your client's origin
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*',  # Adjust based on the allowed methods
        }
    try:
        print ('inside lambda_handler()')
        print('event= ', event)
        
        lambda_runtime_region = os.environ['AWS_REGION']    
        print('This Lambda Function was run in region: ', lambda_runtime_region)
        print('This Lambda Function was run in os.environ["AWS_DEFAULT_REGION"] : ', os.environ["AWS_DEFAULT_REGION"])
        
        bedrock = get_bedrock_client(
            assumed_role=os.environ.get("BEDROCK_ASSUME_ROLE", None),
            region="us-west-2"  #os.environ.get("AWS_DEFAULT_REGION", None)  #setting us-west-2 for bedrock but lambda in us-east-1 region
        )

        print('bedrock object which is assuming a role and region to create a bedrock client = ',bedrock)
        
#         data_string = event["body"]  # if using from postman, we can directly use this but in this case, SQS is triggering lambda so the 
        #  event is having different attributes and 'body' is inside this
        data_string = event['Records'][0]['body']   # this change is done only to accept the 'body' from SQS
        print("event[body]",data_string,type(data_string))
        
        if type(data_string) is dict:
            qtext = data_string
        else:
            qtext = json.loads(data_string)
        #print("\n","Lambda Handler context:",type(context),context)
        
        print("qtext=json.loads(data_string) :",type(qtext),qtext)
        s3files = [qtext['s3filename']]  # send the file name in an array
        indexid = qtext['indexid']
        print("indexid = ",indexid)
        docid = qtext['docid']
        print("docid = ",docid)
        source = qtext['source']
        print("source = ",source)
        
        # Upsert the Dashboard table before extraction
        upsert_dashboard_record(docid=docid,  indexid=indexid, gw_claim_id="To Be Processed", extraction_status="To Be Processed", classification_status="To Be Processed", confidence_score_status="To Be Processed", entity_extraction_status="To Be Processed" , doc_source= source )

        
        start2 = time.time()  # record start time
        tbltxt,rawtext,keyvaluesText = get_doc_text(s3files)
        end2 = time.time() # record end time
        print("Time taken by extract tbltxt,rawtext,keyvaluesText = ", end2-start2, "sec")
       
        print('keyvaluesText=',keyvaluesText)
        print('tbltxt=',tbltxt)
        
        # Save the JSON Data into DynamoDB for future querying
        saveres = save_docs_extract(docid, indexid, s3files, str(rawtext), str(keyvaluesText), str(tbltxt), source)
        
        print('after saving the extracted document in DB - saveres - ',saveres)      
        
#         # Upsert to update the record and mark ExtractionStatus as completed.
#         resExtraction = upsert_dashboard_record(docid=docid, indexid=indexid, gw_claim_id="To Be Processed", extraction_status="Completed", classification_status="To Be Processed", confidence_score_status="To Be Processed", entity_extraction_status="To Be Processed" )
#         print('Updated dashboard table and marked extraction_status as Completed ')

########################################################
        
        resExtraction = upsert_dashboard_record(docid=docid, indexid=indexid, gw_claim_id="To Be Processed", extraction_status="Completed", 
                                                classification_status="To Be Processed", confidence_score_status="To Be Processed", 
                                                entity_extraction_status="To Be Processed")

        # print ("resExtraction = ", resExtraction)
        print('Updated dashboard table and marked extraction_status as Completed ')

        if "ResponseMetadata" in resExtraction:
            if "HTTPStatusCode" in resExtraction["ResponseMetadata"]:
        #         print("@@@HTTP Response Code of resExtraction = ", resExtraction["ResponseMetadata"]["HTTPStatusCode"])

                if resExtraction["ResponseMetadata"]["HTTPStatusCode"] == 200:
                    print("Now put a message in SQS queue for future processing")
                    response = sendtodocproQ(indexid, s3files[0], docid, source)
                    print(f"📤 Queue response: {response}")
#########################################################################
    except Exception as e:
        print('Exception in lambda_handler() - ', e)
        print('Exception Details in lambda_handler() are - ',traceback.format_exc())
    
    return {
            "statusCode": 200,
            "headers": headers,
#             "body": json.dumps(json_string)
            "body": saveres #result 
        }




