import boto3, json
import time
import os
from logging import exception
from botocore.exceptions import ClientError
from typing import Dict 
import datetime
import decimal
from typing import Optional
import traceback
import botocore
from botocore.config import Config


os.environ["AWS_DEFAULT_REGION"] = "us-east-1"  # E.g. "us-west-2"
os.environ["BEDROCK_ASSUME_ROLE"] = "arn:aws:iam::040504913362:role/bedrock"  # E.g. "arn:aws:..." role name is 'bedrock'

dynamodb_resource = boto3.resource("dynamodb")

####################################

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

def get_docs_extract(docid):
    
    print('in get_docs_extract begin ',docid)
    
    dynamodb_tbl_nm4 = "nmm-doc-extraction"
    dbtable1 = dynamodb_resource.Table(dynamodb_tbl_nm4)

    docs_extractDetails = dbtable1.get_item(Key={'docid': docid})
#     print('docs_extractDetails = ',docs_extractDetails)
    
    return docs_extractDetails

def get_prompt_ready(raw_text, tabletext, key_value_pair_data):
    
    cpromppretext="""Human: You are an expert in understand and analyzing the Worker Compensation Document. 
    
    You are provided with Document within the <raw_text>,  <key_value_pair_data> and <table_text> xml tags.
   
    <raw_text>""" + raw_text + """</raw_text> , 
    <key_value_pair_data>""" + key_value_pair_data + """</key_value_pair_data> , 
    <table_text>""" + tabletext + """</table_text> 

    The raw text of Document is within <raw_text> xml tag.
    The key value pair of Document are mentioned as a list within <key_value_pair_data> xml tag.
    The tabular data of the Document are mentioned as a json array with objects within <table_text> xml tag.     
    
    Your objective is understand and analyze the above text and generate a separate brief summary 
    of the document with point numbers so that its readable for the verification officer. 
    
    Do not provide any supporting or explanation text beyond generating the perfect pointwise summary.
    Skip any preamble text and generate the final pointwise summary ONLY. 
    
    """

    prompbody=cpromppretext+"\n"+"Assistant:"

    return prompbody

def execute_model(prompt, bedrock):
    
    try:
        
        print("inside execute_model() method. Please wait Large Langauage Model (Haiku) is preparing your JSON.... ")

        start3 = time.time()  # record start time
        model_id = "anthropic.claude-3-haiku-20240307-v1:0"
        response = bedrock.invoke_model(
            modelId=model_id,
            body=json.dumps(
                {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 5000,
                    "messages": [
                        {
                            "role": "user",
                            "content": [{"type": "text", "text": prompt}],
                        }
                    ],
                }
            ),
        )

        end3 = time.time() # record end time
        print("Time taken by execute_model() ", end3-start3, "sec")

        # print("\nresponse = ", response)
        # Process and print the response
        result = json.loads(response.get("body").read())
        # print("\nresult = ", result)
        output_list = result["content"]
        for output in output_list:
            result = output["text"]
        
        return result

    except Exception as error:
        print(f"Exception in execute_model() and the error is - {error}")  
        print('Exception Details in save_claimform_attributes() are - ',traceback.format_exc())
        return ""



def upsert_document_summary(tablename, docid, **kwargs):
    """
    Update existing record or insert new record in nmm-dashboard table

    Args:
        docid (str): Document ID (primary key)
        **kwargs: Additional fields to update/insert

    Returns:
        dict: Response from DynamoDB operation
    """
#     dynamodb = boto3.resource('dynamodb')
#     table = dynamodb_resource.Table('nmm-doc-extraction')
    table = dynamodb_resource.Table(tablename)

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


################################

def lambda_handler(event, context):
    summary =""
    headers = {
            'Access-Control-Allow-Origin': '*',  # Replace with your client's origin
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*',  # Adjust based on the allowed methods
        }
    try:
        print ('inside lambda_handler() - event = ', event)

        lambda_runtime_region = os.environ['AWS_REGION']    
        print('This Lambda Function was run in region: ', lambda_runtime_region)
        print('This Lambda Function was run in os.environ["AWS_DEFAULT_REGION"] : ', os.environ["AWS_DEFAULT_REGION"])
        
        data_string = event  #["queryStringParameters"]
        print("event[body]",data_string,type(data_string))
        
        if type(data_string) is dict:
            qtext = data_string
        else:
            qtext = json.loads(data_string)
        print("qtext=json.loads(data_string) :",type(qtext),qtext)
        
        docid = qtext["docid"]
        print("docid = ",docid)

        bedrock = get_bedrock_client(
                    assumed_role=os.environ.get("BEDROCK_ASSUME_ROLE", None),
                    region="us-west-2"  #os.environ.get("AWS_DEFAULT_REGION", None)  #setting us-west-2 for bedrock but lambda in us-east-1 region
                )

        accept = 'application/json'
        contentType = 'application/json'

        docs_extract_details = get_docs_extract(docid)
        # print("docs_extract_details = ", docs_extract_details)
        document_name = docs_extract_details["Item"]["document_name"]
        print("document_name = ",document_name)
        rawtext = docs_extract_details["Item"]["rawtext"]
        # print("rawtext1 = ",rawtext1)
        tbltxt = docs_extract_details["Item"]["tbltxt"]
        # print("tbltxt1 = ",tbltxt1)
        keyvaluesText = docs_extract_details["Item"]["keyvaluesText"]
        # print("keyvaluesText1 = ",keyvaluesText1)
        print("fetched rawtext, tbltext and also keyvaluesText from claim details table of database")

       

        prompt = get_prompt_ready(str(rawtext), str(keyvaluesText), str(tbltxt))
        # print(str(ps_det_prompt))
        summary = execute_model(prompt, bedrock)
        print("\nJSON Output from LLM : ",summary)

        # Update Document Extraction table with classification type
        updateres = upsert_document_summary('nmm-doc-extraction', docid=docid, doc_summary =summary )
        print("updateres = ",updateres)


    except Exception as e:
        print('Exception in lambda_handler() - ', e)
        print('Exception Details in lambda_handler() are - ',traceback.format_exc())
     
    return {
            "statusCode": 200,
            "headers": headers,
#             "body": json.dumps(json_string)
            "body": summary #finalresult_json
        }
