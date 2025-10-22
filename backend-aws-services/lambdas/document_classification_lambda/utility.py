import boto3
import json
import time
import datetime
import traceback
from botocore.exceptions import ClientError

# Initialize DynamoDB resource
dynamodb_resource = boto3.resource("dynamodb")

def get_docs_extract(docid):
    """Retrieve document extract details from DynamoDB"""
    print('in get_docs_extract begin', docid)
    
    dynamodb_tbl_nm = "nmm-doc-extraction"
    dbtable = dynamodb_resource.Table(dynamodb_tbl_nm)
    
    return dbtable.get_item(Key={'docid': docid})

# def get_prompt_ready(raw_text, tabletext, key_value_pair_data):
#     """Generate prompt for document classification"""
#     prompt = f"""You are an expert in understanding and analyzing documents within the Worker Compensation Industry.

#     You will be provided with detailed information encapsulated within the following XML tags:

#     <raw_text> for the raw text content,
#     <key_value_pair_data> for the key-value pair data,
#     <table_text> for the tabular data.
    
#     <raw_text>{raw_text}</raw_text>
#     <key_value_pair_data>{key_value_pair_data}</key_value_pair_data>
#     <table_text>{tabletext}</table_text>
    
#     Your task is to analyze the document content and identify its classification type from the following options: ['MedicalRecord', 'ClaimForm', 'Invoice'].

#     If the document type cannot be identified, please classify it as "Unclassified".
    
#     Output Format: Generate only the following JSON response:
#     {{
#         "classification_type": "<classification_type>"
#     }}
    
#     Note:
#     - Ensure the response is a perfect JSON without any additional text.
#     - The value for classification_type must be one of ['MedicalRecord', 'ClaimForm', 'Invoice'] or "Unclassified".
    
#     Assistant:"""
    
#     return prompt

def get_prompt_ready(raw_text, tabletext, key_value_pair_data):
    
    cpromppretext="""Human: You are an expert in understand and analyzing the Worker Compensation Industry Documents. 
    
    You are provided with all the details within the <raw_text>,  <key_value_pair_data> and <table_text> xml tags.
   
    <raw_text>""" + raw_text + """</raw_text> , 
    <key_value_pair_data>""" + key_value_pair_data + """</key_value_pair_data> , 
    <table_text>""" + tabletext + """</table_text> 

    The raw text of all the details is within <raw_text> xml tag.
    The key value pair of all the details are mentioned as a list within <key_value_pair_data> xml tag.
    The tabular data of the all the details are mentioned as a json array with objects within <table_text> xml tag.     
    
    Your job is to analyze the document content and identify the Classification Type of the document from one of these types ['MedicalReport', 'ClaimForm', 'DoctorReportMMI', 'PhysicalTherapy', 'Prescription', 'CMS1500', 'Legal', 'Invoice'].
    Select the classification type only from the above given types and if you are not able to identify the document type then please reply the Classification Type as Unidentified Type.

    {
        classification_type : ""
    }
    
    Generate only a perfect JSON till end.
    Do not provide any supporting or explanation text beyond generating the perfect JSON.
    Skip any preamble text and generate the final JSON ONLY. 
    
    """

    prompbody=cpromppretext+"\n"+"Assistant:"

    return prompbody

def execute_model(prompt, bedrock):
    """Execute Claude model for document classification"""
    try:
        print("inside execute_model() method. Please wait Large Language Model (Haiku) is preparing your JSON....")
        
        start_time = time.time()
        model_id = "anthropic.claude-3-haiku-20240307-v1:0"
        response = bedrock.invoke_model(
            modelId=model_id,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 5000,
                "messages": [{
                    "role": "user",
                    "content": [{"type": "text", "text": prompt}],
                }]
            }),
        )
        
        end_time = time.time()
        print(f"Time taken by execute_model() {end_time - start_time} sec")
        
        result = json.loads(response.get("body").read())
        output_list = result["content"]
        for output in output_list:
            return output["text"]
            
    except Exception as error:
        print(f"Exception in execute_model(): {error}")
        print('Exception Details:', traceback.format_exc())
        return ""

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
