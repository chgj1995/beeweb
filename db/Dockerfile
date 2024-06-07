# Use the official MariaDB image from the Docker Hub
FROM mariadb:latest

# Set environment variables for MariaDB
ENV MYSQL_ROOT_PASSWORD=rootpassword
ENV MYSQL_DATABASE=thingspeak_data
ENV MYSQL_USER=user
ENV MYSQL_PASSWORD=password

# Copy the initialization script to the Docker entrypoint directory
COPY init.sql /docker-entrypoint-initdb.d/

# Expose the default MariaDB port
EXPOSE 3306
