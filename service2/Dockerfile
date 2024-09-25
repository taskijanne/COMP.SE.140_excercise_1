# Use an official Python runtime as the base image
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install procps to get the 'ps' command
RUN apt-get update && apt-get install -y procps

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Install the required third-party libraries (netifaces in this case)
RUN pip install netifaces

# Expose port 8299 for internal communication
EXPOSE 8299

# Command to run the application
CMD ["python", "app.py"]
