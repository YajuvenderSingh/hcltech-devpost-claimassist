import boto3
import json
import os
import sys
from botocore.config import Config
from botocore.exceptions import ClientError
import time
import datetime
import decimal
from typing import Optional
import traceback
from boto3.dynamodb.conditions import Key, Attr

os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
os.environ["BEDROCK_ASSUME_ROLE"] = "arn:aws:iam::040504913362:role/bedrock"

dynamodb_resource = boto3.resource("dynamodb")

def get_bedrock_client(assumed_role: Optional[str] = None, region: Optional[str] = None, runtime: Optional[bool] = True):
    if region is None:
        target_region = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION"))
    else:
        target_region = region

    print(f"Create new client\n  Using region: {target_region}")
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

def get_DashboardDetails(docid):
    
    print('in get_DashboardDetails begin ',docid)
    
#     dynamodb_resource = boto3.resource("dynamodb")
    dynamodb_tbl_nm4 = "nmm-dashboard"
    dbtable1 = dynamodb_resource.Table(dynamodb_tbl_nm4)

    dashboardDetails = dbtable1.get_item(Key={'docid': docid})
#     print('dashboardDetails = ',dashboardDetails)
    
    return dashboardDetails

def get_DocExtractionDetails(docid):
    
    print('in get_DocExtractionDetails begin ', docid)
    
#     dynamodb_resource = boto3.resource("dynamodb")
    dynamodb_tbl_nm5 = "nmm-doc-extraction"
    dbtable1 = dynamodb_resource.Table(dynamodb_tbl_nm5)

    docExtractionDetails = dbtable1.get_item(Key={'docid': docid})
#     print('docExtractionDetails = ',docExtractionDetails)
    
    return docExtractionDetails



def save_chathistory(userid, sessionid, docid, historicqa):
    print('inside save_chathistory()')
    try:
        # Get the current datetime
        current_datetime = datetime.datetime.now(datetime.timezone.utc)
        # Convert the datetime to ISO 8601 format        
        sort_key = current_datetime.isoformat()
        print("sort_key (which is datetime) = ", sort_key)

        dynamodb_tbl_nm = "nmm-chathistory"
        dbtable = dynamodb_resource.Table(dynamodb_tbl_nm)
        print('dbtable = ',dbtable)
        response = dbtable.put_item(
                                   Item={
                                       "docid": docid, 
                                       "userid" : userid,
                                       "sessionid" : sessionid,
                                       "historicqa" : str(historicqa),                                                                             
                                       "current_datetime" : str(sort_key), 
                                         }
                                    )

        print("successfully inserted the record in DynamoDB Table 'nmm-chathistory'")
        return 'Saved successfully to DynamoDB'
    
    except Exception as error:
        print(f"Exception in save_chathistory() and the error is - {error}")  
        print('Exception Details in save_chathistory() are - ',traceback.format_exc())
        return 'Unable to save the json in DynamoDB'


def prep_query_response(query, historicqa, context, bedrock):
    try:
        prompt = f"""
        <system>
            context is provided in <context></context> xml node.
            user query is provided in <userquery></userquery> xml node.
            user previous questions and answers are provided in <historicqa></historicqa> xml node.

            You are a helpful chat assistant and your objective is to analyze and understand the context, previous questions and answers thoroughly. 
            After that, give a precise answer to the query asked and provide the Source pdf name for reference.
        
        </system>
        <userquery>
        {query}
        </userquery>
        
        <historicqa>
        {historicqa}
        </historicqa>

        <context>  
        {context}
        </context>
        """
        
        model_id = "anthropic.claude-3-haiku-20240307-v1:0"
        response = bedrock.invoke_model(
            modelId=model_id,
            body=json.dumps(
                {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 1000,
                    "messages": [
                        {
                            "role": "user",
                            "content": [{"type": "text", "text": prompt}],
                        }
                    ],
                }
            ),
        )

        result = json.loads(response.get("body").read())
        output_list = result.get("content", [])

        if output_list:
            return output_list[0]["text"]
        else:
            return "I apologize, but I couldn't generate a response to your query."
            
    except Exception as e:
        print(f"Error in prep_query_response: {e}")
        return "I'm sorry, but I encountered an error while processing your question. Please try again."



def get_HistoryQnA(docid, user_id, session_id):
    
    print('in docid = ',docid)
    print('in user_id = ',user_id)
    print('in session_id = ',session_id)
    
#     dynamodb_resource = boto3.resource("dynamodb")
    dynamodb_tbl_nm4 = "nmm-chathistory"
    dbtable1 = dynamodb_resource.Table(dynamodb_tbl_nm4)
    
    
    # Build the query based on provided parameters
    if docid and session_id and user_id:
        # If all three parameters are provided,  
        response = dbtable1.scan(
            FilterExpression=
                Attr('docid').eq(docid) & 
                Attr('sessionid').eq(session_id) & 
                Attr('userid').eq(user_id)
        )
#         print("response = ", response)
    return response.get('Items', [])     


def getResponse(userquery, docid, userid, sessionid, bedrock, newcontext):

    historyqna = get_HistoryQnA(docid, userid, sessionid)


    if (len(historyqna) != 0):
        histqna = historyqna[0]["historicqa"]
        print("histqna=",histqna)
        historicqa = histqna
    else:
        historicqa = ""
    print("\n\nhistoricqa =",historyqna)
    # This will return the most 3 similarity search items for the query asked.
    # query2 = "is Early-stage prostate cancer covered in product sheet?"  # Excluded illness from product sheet
    # query2 = "What is the illness mentioned?"
#     query2 = "When was the surgery done and by whom?"
    query2 = userquery

    print("\nhistoricqa = ",historicqa)

    #3 . prepare prompt and call LLM  to get answer to the query
    result2 = prep_query_response(query2, historicqa, newcontext, bedrock)
    # display(HTML(result))
    # print(result2)
    print("\nQuery = ", query2)
    print("\nAnswer = ", result2)
    historicqa = historicqa + "\n------------------------------------\n User Query = " + query2 + " \n\n Answer = " + result2

    #4 . Save the chat history to DynamoDB along with sessionid
    outputmssage = save_chathistory(userid, sessionid, docid, historicqa)
    
    return result2

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
    }
    
    result = ""
    
    try:
        print('inside lambda_handler() - event = ', event)

        # Initialize Bedrock client
        bedrock = get_bedrock_client(
            assumed_role=os.environ.get("BEDROCK_ASSUME_ROLE", None),
            region="us-west-2"
        )

        print('bedrock object created successfully')
        
        # Parse event data
        data_string = event.get("body", {})
        print("event[body]", data_string, type(data_string))
        
        if isinstance(data_string, dict):
            qtext = data_string
        else:
            try:
                qtext = json.loads(data_string)
            except json.JSONDecodeError:
                qtext = data_string
        
        print("qtext=json.loads(data_string) :", type(qtext), qtext)

        # Extract required parameters with validation
        docid = qtext.get('docid')
        # recnumber = qtext.get('recnumber')
        userid = qtext.get('userid')
        sessionid = qtext.get('sessionid')
        userquery = qtext.get('userquery')
        
        if not all([docid, userid, sessionid, userquery]):
            result = "Missing required parameters. Please provide claimid, recnumber, userid, sessionid, and userquery."
            return {
                "body": result,
                'statusCode': 400,
                'headers': headers,
            }

        print("docid =", docid)
        # print("recnumber =", recnumber)
        print("userid =", userid)
        print("sessionid =", sessionid)
        print("userquery =", userquery)

        extractionDetails = get_DocExtractionDetails(docid)
        extractionDet = extractionDetails["Item"]
        rawtext = extractionDet["rawtext"]
        docName = extractionDet["document_name"][0]
        total_extracted_data = extractionDet["extracted_entities"]
        print("total_extracted_data = ",total_extracted_data)

        dashboardDetails = get_DashboardDetails(docid)

        dashboardDet = dashboardDetails["Item"]
        print("dashboardDet = ," , dashboardDet)
        
        # Fetch claim details
        # claimdetails = get_ClaimDetails(claimid)
        # claim_item = claimdetails.get("Item", {})
        
        # if not claim_item:
        #     result = f"No claim details found for claim ID: {claimid}"
        #     return {
        #         "body": result,
        #         'statusCode': 404,
        #         'headers': headers,
        #     }

        # rawtext = claim_item.get("rawtext", "")
        # docName = claim_item.get("document_name", ["Unknown Document"])[0] if claim_item.get("document_name") else "Unknown Document"
        # total_extracted_data = claim_item.get("total_extracted_data", "{}")

        # Parse extracted data safely
        # try:
        #     jsonextracted_data = json.loads(total_extracted_data)
            
        #     # Try different paths for patient name
        #     patient_name = "Unknown Patient"
        #     if "CLINICAL_ABSTRACT_APPLICATION" in jsonextracted_data:
        #         patient_name = jsonextracted_data["CLINICAL_ABSTRACT_APPLICATION"].get("NAME_OF_PATIENT", "Unknown Patient")
        #     elif "CLAIM_FORM_DETAILS" in jsonextracted_data:
        #         patient_name = jsonextracted_data["CLAIM_FORM_DETAILS"].get("PATIENT_NAME", "Unknown Patient")

        #     # Try different paths for policy number
        #     policy_num = recnumber  # fallback to recnumber
        #     if "CLAIMANT_STATEMENT" in jsonextracted_data:
        #         policy_details = jsonextracted_data["CLAIMANT_STATEMENT"].get("POLICY_DETAILS", {})
        #         policy_num = policy_details.get("POLICY_NUMBERS", recnumber)
        #     elif "CLAIM_FORM_DETAILS" in jsonextracted_data:
        #         policy_num = jsonextracted_data["CLAIM_FORM_DETAILS"].get("POLICY_NUMBER", recnumber)
                
        # except json.JSONDecodeError:
        #     print("Error parsing total_extracted_data")
        #     patient_name = "Unknown Patient"
        #     policy_num = recnumber

        # print("patient_name =", patient_name)
        # print("policy_num =", policy_num)

        # # Get product sheet details
        # productsheetdetails = get_ProductSheetDetails(policy_num)
        # ps_item = productsheetdetails.get("Item", {})
        # ps_rawtext = ps_item.get("rawtext", "")

        # # Get verification summary details
        # verisummdetails = get_VerificationSummDetails(claimid)
        # veri_item = verisummdetails.get("Item", {})
        
        # verificationsummary = veri_item.get("verificationsummary", "No verification summary available")
        # dbverificationsummary = veri_item.get("dbverificationsummary", "No database verification available")
        # claim_status = veri_item.get("claim_status", "Status not available")

        # print("verificationsummary =", verificationsummary)
        # print("dbverificationsummary =", dbverificationsummary)
        # print("claim_status =", claim_status)

        # Prepare context for AI
        newcontext = str(rawtext) + str(dashboardDet)
        
        if not newcontext.strip():
            result = "I apologize, but I don't have enough information about this claim to answer your question."
        else:
            # Get AI response
            result = getResponse(userquery, docid, userid, sessionid, bedrock, newcontext)

        print("Final result:", result)

    except Exception as e:
        print(f"Exception in lambda_handler: {e}")
        print('Exception Details are - ', traceback.format_exc())
        result = "I apologize, but I encountered an error while processing your request. Please try again later."
        
    return {
        "body": result,
        'statusCode': 200,
        'headers': headers,
    }