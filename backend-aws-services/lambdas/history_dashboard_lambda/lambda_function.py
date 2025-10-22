import boto3
from boto3.dynamodb.conditions import Key
import json

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    
    # Get table references
    extraction_table = dynamodb.Table('nmm-doc-extraction')
    dashboard_table = dynamodb.Table('nmm-dashboard')
    
    # Scan both tables
    extraction_data = extraction_table.scan()['Items']
    dashboard_data = dashboard_table.scan()['Items']
    
    # Create lookup dict for dashboard data
    dashboard_lookup = {item['docid']: item for item in dashboard_data}
    
    # Columns to exclude
    exclude_columns = {'rawtext', 'tbltxt', 'keyvaluesText', 'empty_key_perc', 'empty_keys', 'empty_keys_count', 'total_keys', 'doc_summary', 'extracted_entities'}
    
    # Combine data based on docid, only for ManualUpload status
    combined_data = []
    for extraction_item in extraction_data:
        docid = extraction_item['docid']
        
        # Check if doc_source is ManualUpload in either table
        extraction_status = extraction_item.get('doc_source')
        dashboard_item = dashboard_lookup.get(docid, {})
        dashboard_status = dashboard_item.get('doc_source')
        
        if extraction_status == 'ManualUpload' or dashboard_status == 'ManualUpload' or extraction_status == 'email' or dashboard_status == 'email':
            combined_item = extraction_item.copy()
            if docid in dashboard_lookup:
                combined_item.update(dashboard_lookup[docid])
            
            # Remove excluded columns
            for col in exclude_columns:
                combined_item.pop(col, None)
            
            combined_data.append(combined_item)
    
    print("combined_data = ", type(combined_data),  combined_data)
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': f'Combined {len(combined_data)} ManualUpload records',
            'data': combined_data,
            'count': len(combined_data)
        })
    }
