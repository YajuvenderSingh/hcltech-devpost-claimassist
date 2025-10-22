import json
import boto3
from utility import get_docs_extract, get_prompt_ready, execute_model, upsert_dashboard_record

def lambda_handler(event, context):
    try:
        # Extract document ID from event
        print("Event - ", event)
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

        #docid = event.get('docid')
        if not docid:
            print("Error: docid is not present, hence returning")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'docid is required'})
            }
        
        # Initialize Bedrock client
        bedrock = boto3.client('bedrock-runtime')
        print("bedrock - ", bedrock)
        
        # Get document extract details
        docs_extract_details = get_docs_extract(docid)
        print("docs_extract_details - ", docs_extract_details)
        
        if 'Item' not in docs_extract_details:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Document not found for docid'})
            }
        
        # Extract document data
        document_name = docs_extract_details["Item"]["document_name"]
        rawtext = docs_extract_details["Item"]["rawtext"]
        tbltxt = docs_extract_details["Item"]["tbltxt"]
        keyvaluesText = docs_extract_details["Item"]["keyvaluesText"]
        
        #########################################
        ## Here we will check document language and translate to english
        translate_client = boto3.client('translate')
        comprehend_client = boto3.client('comprehend')
        translated_text=""
        # Detect language
        language_response = comprehend_client.detect_dominant_language(Text=rawtext)
        detected_language = language_response['Languages'][0]['LanguageCode']
        print("detected language = ", detected_language)
        doc_language = "English"
        # Translate if not English
        if detected_language == 'en':
            #translated_text = rawtext
            doc_language = "English"
            print("detected lang is english")
        else:
            translation_response = translate_client.translate_text(
                Text=rawtext,
                SourceLanguageCode=detected_language,
                TargetLanguageCode='en'
            )
            doc_language = "Spanish"
            translated_text = translation_response['TranslatedText']
            # Update Document Extraction table with TranslatedText
            resTanslate = upsert_dashboard_record('nmm-doc-extraction', docid=docid, translated_text=translated_text)
            print ("resTanslate = ", resTanslate)
            print("translated_text = ", translated_text)

        #########################################
        
        # Generate prompt and classify document
        if detected_language == 'en':
            prompt = get_prompt_ready(str(rawtext), str(tbltxt), str(keyvaluesText))
        else:
            prompt = get_prompt_ready(str(translated_text), "", "")
            
        classification_result = execute_model(prompt, bedrock)
        ##########################################
        # prompt = get_prompt_ready(str(rawtext), str(tbltxt), str(keyvaluesText))
        # classification_result = execute_model(prompt, bedrock)
        
        # Parse classification result
        llm_extracted_json = json.loads(classification_result)
        classificationtype = llm_extracted_json['classification_type']
        
        # # Update Document Extraction table with classification type
        # upsert_dashboard_record('nmm-doc-extraction', docid=docid, classification=classificationtype)
        
        # # Update Dashboard table with classification status
        # upsert_dashboard_record('nmm-dashboard', docid=docid, classification_status="Completed")
        ####################################
        # Update Document Extraction table with classification type
        resExtraction = upsert_dashboard_record('nmm-doc-extraction', docid=docid, classification=classificationtype)
        print ("resExtraction = ", resExtraction)

        if "ResponseMetadata" in resExtraction:
            if "HTTPStatusCode" in resExtraction["ResponseMetadata"]:
                print("@@@HTTP Response Code of resExtraction = ", resExtraction["ResponseMetadata"]["HTTPStatusCode"])
                
                if resExtraction["ResponseMetadata"]["HTTPStatusCode"] == 200:
                    print("success to call next dashboard")
                    # Update Dashboard table with classification status
                    restDashboard = upsert_dashboard_record('nmm-dashboard', docid=docid, classification_status="Completed", classification=classificationtype, doc_language=doc_language, s3filename=s3files)
                    print ("restDashboard = ", restDashboard)
                    
                    if "ResponseMetadata" in restDashboard:
                        if "HTTPStatusCode" in restDashboard["ResponseMetadata"]:
                            print("@@@HTTP Response Code of restDashboard = ", restDashboard["ResponseMetadata"]["HTTPStatusCode"])

                            if restDashboard["ResponseMetadata"]["HTTPStatusCode"] == 200:
                                print("success to call entity extraction lambda  ")
                                
                                ent_payload = """{   'docid': '""" + docid + """' }"""
                                print("ent_payload = ", ent_payload)
                                try:
                                    # Initialize a boto3 client
                                    lambda_client = boto3.client('lambda')
                                    function_name = "nmm_entityextraction_lambda"
                                    # Invoke the nmm_entityextraction_lambda function
                                    response = lambda_client.invoke(
                                        FunctionName=function_name,
                                        InvocationType='RequestResponse',  # Use 'Event' for asynchronous invocation
                                        Payload=json.dumps(event)  # Pass the event or any payload you need
                                        # Payload=json.dumps(ent_payload)  # Pass the event or any payload you need
                                    )
                                    print("lambda invoke response = ", response)
                                    # # Read the response payload
                                    # payload = response['Payload'].read()
                                    # extracted_entities = json.loads(payload)

                                    # # Example: Log or process the extracted entities
                                    # print("Extracted Entities:", extracted_entities)

        #                             # Return a response (optional)
        #                             return {
        #                                 'statusCode': 200,
        #                                 'body': json.dumps({
        #                                     'message': 'Entity extraction successful',
        #                                     'extracted_entities': extracted_entities
        #                                 })
        #                             }

                                except Exception as e:
                                    print(f"Error invoking Entity Extraction Lambda function: {e}")
        #                             return {
        #                                 'statusCode': 500,
        #                                 'body': json.dumps({'message': 'Error invoking Lambda function'})
        #                             }
                                



        #####################################
        return {
            'statusCode': 200,
            'body': json.dumps({
                'docid': docid,
                'classification_type': classificationtype,
                'status': 'Classification completed successfully'
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
