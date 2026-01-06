FROM wordpress:latest

# Install some useful tools and cleanup
RUN apt-get update && apt-get install -y     less     default-mysql-client     && rm -rf /var/lib/apt/lists/*

# Install Redis extension and enable Opcache
RUN pecl install redis     && docker-php-ext-enable redis     && docker-php-ext-install opcache

# Update www-data user to match host user (UID 1000)
ARG HOST_UID=1000
ARG HOST_GID=1000
RUN usermod -u ${HOST_UID} www-data && groupmod -g ${HOST_GID} www-data

# Increase limitations in php.ini
RUN echo "memory_limit = 512M" > /usr/local/etc/php/conf.d/memory-limit.ini

# Copy php configuration
COPY conf.d/php-custom.ini /usr/local/etc/php/conf.d/php-custom.ini
