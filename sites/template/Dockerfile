FROM wordpress:latest

# Install some useful tools and cleanup
RUN apt-get update && apt-get install -y \
    less \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

# Update www-data user to match host user (UID 1000)
# This prevents permission issues when mounting volumes (though less critical with named volumes, still good practice)
ARG HOST_UID=1000
ARG HOST_GID=1000
RUN usermod -u $HOST_UID www-data && groupmod -g $HOST_GID www-data

# Increase limitations in php.ini
# We'll rely on the external ini file, but this ensures defaults are sane
RUN echo "memory_limit = 512M" > /usr/local/etc/php/conf.d/memory-limit.ini

# Copy php configuration
COPY conf.d/uploads.ini /usr/local/etc/php/conf.d/uploads.ini
