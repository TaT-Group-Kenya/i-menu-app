FROM php:8.2-cli

# Update package list and install dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    && docker-php-ext-install gd zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# install composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install

RUN cp .env.example .env 2>/dev/null || echo "APP_ENV=local" > .env
# Create SQLite database file
RUN mkdir -p /app/database && \
    touch /app/database/database.sqlite && \
    chmod 777 /app/database/database.sqlite

# Run migrations
RUN php artisan migrate --force

RUN php artisan key:generate

EXPOSE 10000

# Fixed CMD with JSON syntax (fixes the warning)
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=10000"]