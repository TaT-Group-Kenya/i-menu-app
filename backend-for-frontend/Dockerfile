FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    git unzip curl libpng-dev libzip-dev zip sqlite3 libsqlite3-dev

RUN docker-php-ext-install gd zip pdo_sqlite

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install

# Remove problematic migration files if they exist
RUN rm -f database/migrations/2026_04_17_094613_enhance_stock_movements_table.php
RUN rm -f database/migrations/2026_04_17_094732_migrate_stock_movements_data.php

# Create fresh .env file
RUN echo "APP_NAME=i-menu" > .env && \
    echo "APP_ENV=production" >> .env && \
    echo "APP_DEBUG=false" >> .env && \
    echo "APP_URL=https://i-menu-app-5.onrender.com" >> .env && \
    echo "" >> .env && \
    echo "DB_CONNECTION=sqlite" >> .env && \
    echo "DB_DATABASE=/app/database/database.sqlite" >> .env && \
    echo "" >> .env && \
    echo "SESSION_DRIVER=file" >> .env && \
    echo "CACHE_DRIVER=file" >> .env && \
    echo "QUEUE_CONNECTION=sync" >> .env

# Create SQLite database
RUN mkdir -p /app/database && \
    touch /app/database/database.sqlite && \
    chmod 777 /app/database/database.sqlite

RUN php artisan key:generate

# Run migrations
RUN php artisan migrate --force

EXPOSE 10000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=10000"]