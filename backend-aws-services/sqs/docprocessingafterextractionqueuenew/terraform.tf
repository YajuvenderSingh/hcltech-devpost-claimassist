terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "lambda_function_name" {
  description = "Name of the Lambda function to trigger"
  type        = string
  default     = "nmm_document_classification_lambda"
}

resource "aws_sqs_queue" "nmm_doc_processing_queue" {
  name                       = "NMM_DocProcessingAfterExtractionQueueNew"
  visibility_timeout_seconds = 300
  max_message_size          = 1048576
  message_retention_seconds = 240
  delay_seconds             = 0
  receive_wait_time_seconds = 0
  sqs_managed_sse_enabled   = true

  tags = {
    Name        = "NMM_DocProcessingAfterExtractionQueueNew"
    Environment = "production"
    Service     = "document-processing"
  }
}

resource "aws_lambda_event_source_mapping" "sqs_lambda_trigger" {
  event_source_arn = aws_sqs_queue.nmm_doc_processing_queue.arn
  function_name    = var.lambda_function_name
  batch_size       = 10
  maximum_batching_window_in_seconds = 0
}

output "queue_url" {
  description = "URL of the SQS queue"
  value       = aws_sqs_queue.nmm_doc_processing_queue.url
}

output "queue_arn" {
  description = "ARN of the SQS queue"
  value       = aws_sqs_queue.nmm_doc_processing_queue.arn
}
