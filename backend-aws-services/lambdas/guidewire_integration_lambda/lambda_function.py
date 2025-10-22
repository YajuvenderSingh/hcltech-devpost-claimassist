from zeep import Client, Transport
from requests import Session
from requests.auth import HTTPBasicAuth
import boto3,json
import time
import os
import sys
from logging import exception
from botocore.exceptions import ClientError
import datetime
import decimal
import traceback
import botocore
from botocore.config import Config
import re
import time

serverpath = "http://xx.xx.xx.xx:8080/xx/xx/hcl/"  ## replace
# API credentials
api_userid = "xx" ## replace
api_password = "xx"  ## replace
    
def lambda_handler(event, context):
    soap_response =""
    headers = {
            'Access-Control-Allow-Origin': '*',  # Replace with your client's origin
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*',  # Adjust based on the allowed methods
        }
    try:
        print('inside lambda_handler() event= ', event)
        if type(event) is dict:
            qtext = event
        else:
            qtext = json.loads(event)
        print("qtext=json.loads(event) :",type(qtext),qtext)
        
        req_type = qtext['req_type']
        print("req_type = ",req_type)
        req_payload = qtext['req_payload']
        print("req_payload = ",req_payload)
        
        if req_type == 'checkclaim' or req_type == 'fetchmatchingclaims':
            wsdl_url =  serverpath + "/search/ClaimSearch_Ext?WSDL"
        elif req_type == 'updategwentities' or req_type == 'updategwdms' or req_type == 'updategwlegal':
            wsdl_url = serverpath + "/idp/ClaimAPI_Ext?WSDL"

        print("wsdl_url = ",wsdl_url)

        # Create a custom session with authentication
        session = Session()
        session.auth = HTTPBasicAuth(api_userid, api_password)
        print("session = ", session)
        # Initialize the SOAP client with the custom session
        transport = Transport(session=session)
        print("transport = ", transport)
        client = Client(wsdl_url, transport=transport)
        print("client = ", client)
        
        # Make the SOAP request
        if req_type == 'checkclaim':
            soap_response = client.service.performClaimExists(req_payload)
        elif req_type == 'fetchmatchingclaims':
            soap_response = client.service.performClaimSearch(req_payload)
        elif req_type == 'updategwentities':
            soap_response = client.service.updateClaimData(req_payload)
        elif req_type == 'updategwdms':
            soap_response = client.service.indexDocument(req_payload)
        elif req_type == 'updategwlegal':
            soap_response = client.service.createNewMatter(req_payload)
        
        print("SOAP Response:", soap_response)
        

    except Exception as e:
        print('Exception in lambda_handler() - ', e)
        print('Exception Details in lambda_handler() are - ',traceback.format_exc())
    
    return {
            "statusCode": 200,
            "headers": headers,
            "body": soap_response 
        }




