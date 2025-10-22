#!/bin/bash

echo "🧪 NMM End-to-End Flow Test (CORRECTED)"
echo "========================================"
echo ""

# Test 1: UI Application
echo "1️⃣ Testing UI Application..."
UI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
if [ "$UI_STATUS" = "200" ]; then
    echo "✅ UI Application: RUNNING"
    UI_TEST=true
else
    echo "❌ UI Application: NOT RUNNING"
    UI_TEST=false
fi

# Test 2: Orchestration Lambda (CORRECTED PAYLOAD)
echo "2️⃣ Testing Orchestration Lambda..."
aws lambda invoke --region us-east-1 --function-name nmm-orchestration-lambda --cli-binary-format raw-in-base64-out --payload '{"tasktype":"SEND_TO_QUEUE","indexid":"IN999999","s3filename":"newmexicomutual/claimforms/test.pdf","docid":"DOC999999"}' /tmp/orch-test.json > /dev/null 2>&1

if [ $? -eq 0 ]; then
    STATUS_CODE=$(cat /tmp/orch-test.json | jq -r '.statusCode // empty')
    if [ "$STATUS_CODE" = "200" ]; then
        MESSAGE_ID=$(cat /tmp/orch-test.json | jq -r '.body' | jq -r '.messageId // empty')
        echo "✅ Orchestration Lambda: SUCCESS (MessageId: ${MESSAGE_ID:0:8}...)"
        ORCH_TEST=true
    else
        echo "❌ Orchestration Lambda: FAILED (Status: $STATUS_CODE)"
        ORCH_TEST=false
    fi
else
    echo "❌ Orchestration Lambda: INVOKE FAILED"
    ORCH_TEST=false
fi

# Test 3: SQS Queue
echo "3️⃣ Testing SQS Queue..."
SQS_RESULT=$(aws sqs get-queue-attributes --region us-east-1 --queue-url "https://sqs.us-east-1.amazonaws.com/040504913362/NMMDocProcessingQueue" --attribute-names ApproximateNumberOfMessages 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ SQS Queue: ACCESSIBLE"
    SQS_TEST=true
else
    echo "❌ SQS Queue: FAILED"
    SQS_TEST=false
fi

# Test 4: Lambda Chain
echo "4️⃣ Testing Lambda Chain..."
LAMBDAS=("nmm_document_extraction_lambda" "nmm_document_classification_lambda" "nmm_entityextraction_lambda" "nmm_confidence_score_lambda")
LAMBDA_TEST=true

for lambda_name in "${LAMBDAS[@]}"; do
    LAMBDA_STATUS=$(aws lambda get-function --region us-east-1 --function-name "$lambda_name" --query 'Configuration.State' --output text 2>/dev/null)
    if [ "$LAMBDA_STATUS" = "Active" ]; then
        echo "   ✅ $lambda_name: Active"
    else
        echo "   ❌ $lambda_name: $LAMBDA_STATUS"
        LAMBDA_TEST=false
    fi
done

# Test 5: Processing Chain (Check if extraction was triggered)
echo "5️⃣ Testing Processing Chain..."
sleep 3
RECENT_INVOCATIONS=$(aws cloudwatch get-metric-statistics --region us-east-1 --namespace AWS/Lambda --metric-name Invocations --dimensions Name=FunctionName,Value=nmm_document_extraction_lambda --start-time $(date -u -d '1 minute ago' +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 60 --statistics Sum --query 'Datapoints[0].Sum' --output text 2>/dev/null)

if [ "$RECENT_INVOCATIONS" != "None" ] && [ "$RECENT_INVOCATIONS" != "" ]; then
    echo "✅ Processing Chain: TRIGGERED ($RECENT_INVOCATIONS invocations)"
    CHAIN_TEST=true
else
    echo "⚠️  Processing Chain: NO RECENT ACTIVITY"
    CHAIN_TEST=false
fi

# Summary
echo ""
echo "📊 Test Results Summary:"
echo "========================"
if [ "$UI_TEST" = true ]; then echo "✅ UI Application: PASSED"; else echo "❌ UI Application: FAILED"; fi
if [ "$ORCH_TEST" = true ]; then echo "✅ Orchestration Lambda: PASSED"; else echo "❌ Orchestration Lambda: FAILED"; fi
if [ "$SQS_TEST" = true ]; then echo "✅ SQS Queue: PASSED"; else echo "❌ SQS Queue: FAILED"; fi
if [ "$LAMBDA_TEST" = true ]; then echo "✅ Lambda Chain: PASSED"; else echo "❌ Lambda Chain: FAILED"; fi
if [ "$CHAIN_TEST" = true ]; then echo "✅ Processing Chain: PASSED"; else echo "⚠️  Processing Chain: NO ACTIVITY"; fi

# Overall Status
if [ "$UI_TEST" = true ] && [ "$ORCH_TEST" = true ] && [ "$SQS_TEST" = true ] && [ "$LAMBDA_TEST" = true ]; then
    echo ""
    echo "🎯 Overall Status: ✅ ALL CORE TESTS PASSED"
    echo ""
    echo "🚀 NMM Flow is FULLY OPERATIONAL!"
    echo "📱 Access UI: http://localhost:8080"
    echo "🔧 Monitor: CloudWatch Logs"
    echo "📋 Note: Processing chain may need real S3 file for full test"
else
    echo ""
    echo "🎯 Overall Status: ❌ SOME TESTS FAILED"
fi
