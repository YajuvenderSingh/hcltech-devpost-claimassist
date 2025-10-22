# syntax=docker/dockerfile:1
FROM public.ecr.aws/lambda/python:3.11

# Copy requirements.txt
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Copy function code
COPY lambda_function.py ${LAMBDA_TASK_ROOT}
#COPY sqlite3.zip /var/lang/lib/python3.10/
# # Install the specified packages
# RUN yum -y install tar
# RUN yum -y install make
# RUN yum -y install tcl
# RUN yum -y install gzip
RUN pip install -r requirements.txt
# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "lambda_function.lambda_handler" ]