import json
import boto3
from entity_utility import (
    get_docs_extract, 
    get_prompt_ready, 
    execute_model, 
    extract_empty_keys, 
    calculate_stats, 
    upsert_dashboard_record,
    get_entities_template,
    get_legal_entities_template,
    get_legal_prompt_ready
)

def lambda_handler(event, context):
    try:
        print("Event = ", event)
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


        # Extract document ID from event
        # docid = event.get('docid')
        if not docid:
            print("Error: docid is not present")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'docid is required'})
            }
        
        # Initialize Bedrock client
        bedrock = boto3.client('bedrock-runtime', region_name='us-west-2')
        
        # Get document extract details
        docs_extract_details = get_docs_extract(docid)
        
        
        if 'Item' not in docs_extract_details:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Document not found for docid'})
            }
        
        # Extract document data
        document_name = docs_extract_details["Item"]["document_name"]
        print("document_name = ", document_name)
        rawtext = docs_extract_details["Item"]["rawtext"]
        tbltxt = docs_extract_details["Item"]["tbltxt"]
        keyvaluesText = docs_extract_details["Item"]["keyvaluesText"]
        classification = docs_extract_details["Item"]["classification"]
        print("classification = ", classification)
        prompt=""
        if classification == 'Legal':
            # Get entities template based on classification
            legal_entities_to_be_extracted = get_legal_entities_template(classification)
            print("legal_entities_to_be_extracted = ", legal_entities_to_be_extracted)

            # Generate prompt and extract entities
            prompt = get_legal_prompt_ready(classification, str(rawtext), str(tbltxt), str(keyvaluesText), legal_entities_to_be_extracted)
        else:
            # Get entities template based on classification
            entities_to_be_extracted = get_entities_template(classification)
            print("entities_to_be_extracted = ", entities_to_be_extracted)
            
            if not entities_to_be_extracted:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f'Unidentified Classification - {classification}'})
                }
            
            # Generate prompt and extract entities
            prompt = get_prompt_ready(classification, str(rawtext), str(tbltxt), str(keyvaluesText), entities_to_be_extracted)
        
        
        print("prompt before sending to LLM = ", prompt)
        llm_extracted_json = execute_model(prompt, bedrock)
        print("llm_extracted_json = ", llm_extracted_json)
        
        # Parse and analyze results
        # parsed_json = json.loads(llm_extracted_json, strict=False)
        try:
            parsed_json = json.loads(llm_extracted_json, strict=False)
        except json.JSONDecodeError as e:
            print(f"JSON parsing failed: {e}")
            print(f"Raw LLM response: {llm_extracted_json}")
            return {'statusCode': 500, 'body': json.dumps({'error': 'Invalid JSON from LLM'})}

        print("parsed_json = ", parsed_json)
        empty_keys = extract_empty_keys(parsed_json)
        total_keys, empty_keys_count, empty_keys_percentage = calculate_stats(parsed_json)
        empty_key_perc = str(round(empty_keys_percentage)) + "%"
        ##############################
        gw_claim_number = "Not Available"
        if "claim_details_section" in parsed_json:
            print("inside if")
            if "claim_administrator_claim_number" in parsed_json["claim_details_section"]:
                print("inside if 1")
                if "value" in parsed_json["claim_details_section"]["claim_administrator_claim_number"]:
                    gw_claim_number = parsed_json["claim_details_section"]["claim_administrator_claim_number"]["value"]
                    print("gw_claim_number = ", gw_claim_number)
        
        if "CMS1500_section" in parsed_json:
            print("inside CMS if")
            if "other_claim_id" in parsed_json["CMS1500_section"]:
                print("inside CMS if 1")
                if "value" in parsed_json["CMS1500_section"]["other_claim_id"]:
                    gw_claim_number = parsed_json["CMS1500_section"]["other_claim_id"]["value"]
                    print("gw_claim_number in CMS = ", gw_claim_number)
        ##################################
        print("before updating nmm-doc-extraction -> llm_extracted_json = ", llm_extracted_json)
        # Update Document Extraction table with entity results
        upsert_dashboard_record('nmm-doc-extraction', docid=docid, 
                              extracted_entities=llm_extracted_json, 
                              total_keys=total_keys, 
                              empty_keys_count=empty_keys_count, 
                              empty_keys=empty_keys, 
                              empty_key_perc=empty_key_perc)
        print("before updating nmm-dashboard ")
        # Update Dashboard table with entity extraction status
        upsert_dashboard_record('nmm-dashboard', docid=docid, entity_extraction_status="Completed", gw_claim_id=gw_claim_number)
        #########################
        ########## From here we will call the confidence score lambda function 

        print("success to call entity confidence score lambda  ")
                                
        try:
            # Initialize a boto3 client
            lambda_client = boto3.client('lambda')
            function_name = "nmm_confidence_score_lambda"
            # Invoke the nmm_entityexnmm_confidence_score_lambdatraction_lambda function
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType='RequestResponse',  # Use 'Event' for asynchronous invocation
                Payload=json.dumps(event)  # Pass the event or any payload you need
            )
            print("lambda invoke response = ", response)
        except Exception as e:
            print(f"Error invoking Entity Extraction Lambda function: {e}")


        ###############################
        return {
            'statusCode': 200,
            'body': json.dumps({
                'docid': docid,
                'classification': classification,
                'total_keys': total_keys,
                'empty_keys_count': empty_keys_count,
                'empty_key_percentage': empty_key_perc,
                'status': 'Entity extraction completed successfully'
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
