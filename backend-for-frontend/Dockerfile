FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    git unzip curl libpng-dev libzip-dev zip sqlite3 libsqlite3-dev

RUN docker-php-ext-install gd zip pdo_sqlite

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install

# Create .env from .env.example
RUN cp .env.example .env

# Create SQLite database
RUN mkdir -p /app/database && \
    touch /app/database/database.sqlite && \
    chmod 777 /app/database/database.sqlite

RUN php artisan key:generate
RUN php artisan migrate --force

EXPOSE 10000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=10000"]